const express = require('express')
const router = express.Router()
const pg = require('pg')
const turf = require('@turf/turf')
const utc = require('../geom/utc')
const database = require('../database.js')
const connectionString = database.connectionString
const errMsg = require('../errorMessages')
const external = require('../fetch/external')
const jsonminify = require('jsonminify')

/*
  Recieves data like this:
  {
    'projectname': 'Po River Valley',
    'geometry': stringified GeoJSON,
    'options': {
      'date': 2017-01-01,
      'sentinel1': false,
      'sentinel2': true,
      'sentinel3': false,
      'landsat8': true
    },
    'user': {
      'session': 'Nyr8kM24Q-f00qgWi2YAXH3-PAFtNGz3',
      'username': 'casperfibaek'
    }
  }
*/

function str2num (arr) {
  var newArr = []
  var i = arr.length
  while (i--) { newArr[i] = arr[i] }
  for (var j = 0; j < arr.length; j++) {
    if (arr[j] instanceof Array) {
      str2num(arr[j])
    } else {
      if (!isNaN(arr[j])) { arr[j] = Number(arr[j]) }
    }
  }
  return newArr
}

router.post('/api/createSite', function (req, res) {
  var post = req.body

  // First we verify the post
  if (post.projectname === 'undefined' || post.options === 'undefined' || post.options.date === 'undefined' ||
      post.geometry === 'undefined' || post.user.session === 'undefined' || post.user.username === 'undefined') {
    return res.status(200).json({
      'status': 'error',
      'message': 'session key or username invalid (here)'
    })
  }

  // Then we verify the user
  var client = new pg.Client(connectionString)
  client.connect(function (err) {
    if (err) { errMsg.serverError(err, res) }

    // Find the user in the database
    var request = `SELECT username FROM users WHERE session_id = '${post.user.session}';`

    client.query(request, function (err, result) {
      if (err) { errMsg.queryError(err, res) }

      // If we find the user
      if (result.rowCount > 0) {
        checkUnique(function () {                 // check if the sitename is unique for that user
          createSite(function () {                // if successfull run this function
            insertImages(client, res)        // download images
          })
        })
      } else {
        errMsg.endConnection(client, err, res)
        return res.status(200).json({'status': 'error', 'message': result})
      }
    })
  })

  var checkUnique = function (callback) {
    var request = `
      SELECT sitename FROM sites
      WHERE sitename = '${post.projectname}' AND username = '${post.user.username}';
    `
    client.query(request, function (err, result) {
      if (err) { errMsg.queryError(err, res) }

      // If we find a match, post an error message
      if (result.rowCount > 0) {
        errMsg.endConnection(client, err, res)

        return res.status(200).json({
          'status': 'error',
          'message': 'please choose a unique name',
          'total': result
        })
      } else {
        callback()
      }
    })
  }

  var createSite = function (callback) {
    // Calculate the timezone of the posted siteGeometry
    // The coordinates array gets parsed wrong, this is a work around, hack.
    post.geometry.geometry.coordinates = str2num(post.geometry.geometry.coordinates)
    var center = turf.centroid(post.geometry)
    var timezone
    for (var i = 0; i < utc.features.length; i += 1) {
      if (turf.inside(center, utc.features[i]) === true) {
        timezone = utc.features[i].properties.zone
      }
    }

    var sat = []
    if (post.options.sentinel1 === 'true') { sat.push('s1') }
    if (post.options.sentinel2 === 'true') { sat.push('s2') }
    if (post.options.sentinel3 === 'true') { sat.push('s3') }
    if (post.options.landsat8 === 'true') { sat.push('l8') }
    sat = `{${sat.toString()}}`

    var request = `
    INSERT INTO sites (
      sitename,
      footprint,
      satellites,
      username,
      startdate,
      created_on,
      timezone
    ) VALUES (
      '${post.projectname}',
      '${jsonminify(JSON.stringify(turf.truncate(post.geometry), 6, 2))}',
      '${sat}',
      '${post.user.username}',
      '${post.options.date}',
      NOW(),
      ${timezone}
    );

    UPDATE users SET sites = array_append(sites, '${post.projectname}')
    WHERE username = '${post.user.username}' AND session_id = '${post.user.session}';
    `

    client.query(request, function (err, result) {
      if (err) { errMsg.queryError(err, res) }

      callback()
    })
  }

  var insertImages = function (client, res) {
    external(post, function (result) {
      if (result.status === 'success') {
        var imgArray = result.message
        var imgCount = imgArray.length
        var count = 0
        var latest = 0
        var latestUID = ''

        for (var i = 0; i < imgCount; i += 1) {
          var img = imgArray[i]
          var time = new Date(img.date.UTC).getTime()
          if (time > latest) {
            latest = time
            latestUID = img.id
          }

          var request = `
          DO LANGUAGE plpgsql
          $$
          BEGIN
          INSERT INTO images (
            image_uuid,
            sat_name,
            sat_sensor,
            sat_producttype,
            sat_sensormode,
            sat_polarisation,
            time_utc,
            time_local,
            footprint,
            clouds,
            radar,
            sun_altitude,
            sun_azimuth
          ) VALUES (
            '${img.id}',
            '${img.satellite.name}',
            '${img.satellite.sensor}',
            '${img.satellite.producttype}',
            '${img.satellite.sensormode}',
            '${img.satellite.polarisation}',
            '${img.date.UTC}',
            '${img.date.local}',
            '${jsonminify(JSON.stringify(img.footprint))}',
             ${img.clouds.cover},
            '${img.clouds.radar}',
             ${img.sun.altitude},
             ${img.sun.azimuth}
          );

          UPDATE sites SET
          images = array_append(images, '${img.id}'),
          latest_image_time = '${new Date(latest).toISOString()}',
          latest_image_uuid = '${latestUID}'
          WHERE username = '${post.user.username}' AND sitename = '${post.projectname}';

          EXCEPTION
          WHEN unique_violation THEN
          UPDATE images SET image_uuid = '${img.id}' WHERE image_uuid = '${img.id}';

          END;
          $$;
        `
          client.query(request, function (err, result) {
            if (err) { errMsg.queryError(client, err, res) }

            count += 1

            if (count === imgCount) {
              errMsg.endConnection(client, err, res)
              return res.status(200).json({
                'status': 'success',
                'message': `Prepared database`
              })
            }
          })
        }
      } else {
        client.end(function (err) { if (err) { console.log('error closing connection') } })
        return res.status(200).json({status: 'error', 'message': 'Error getting image metadata'})
      }
    })
  }
})

module.exports = router

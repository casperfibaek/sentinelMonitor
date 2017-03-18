const express = require('express')
const database = require('./database')
const turf = require('turf')
const utc = require('./geom/utc')
const errMsg = require('./errorMessages')
const connectionString = database.connectionString
const router = express.Router()
const pg = require('pg')

router.post('/api/fetchUserSites', function (req, res) {
  var user = {
    username: req.body.username || 'undefined',
    session: req.body.session || 'undefined'
  }

  if (user.session === 'undefined' || user.username === 'undefined') {
    return res.status(200).json({
      'status': 'error',
      'message': 'session key or username invalid'
    })
  }

  var client = new pg.Client(connectionString)
  client.connect(function (err) {
    if (err) { errMsg.serverError(err, res) }

    var request = `
    SELECT sitename, latest_image, latest_image_uuid, identifier, thumbnail, timezone
    FROM (
      SELECT
        UNNEST(trig_users.sites) AS arr_sitename,
        trig_sites.latest_image AS latest_image,
        trig_sites.latest_image_uuid AS latest_image_uuid,
        trig_sites.sitename AS sitename,
        trig_sites.timezone AS timezone,
        trig_users.username AS username,
        trig_users.session_id AS session_id,
        trig_images.identifier as identifier,
        trig_images.link_thumb as thumbnail,
        trig_images.image_uuid as image_uuid
      FROM trig_sites, trig_users, trig_images
    ) AS b
    WHERE arr_sitename = sitename
    AND latest_image_uuid = image_uuid
    AND username = '${user.username}'
    AND session_id = '${user.session}';`

    client.query(request, function (err, result) {
      if (err) { errMsg.queryError(err, res) }

      errMsg.endConnection(client, err, res)

      if (result || result.rowCount > 0) {
        return res.status(200).json({
          'status': 'success',
          'message': result.rows
        })
      } else if (result.rowCount === 0) {
        return res.status(200).json({'status': 'error', 'message': 'User has no sites'})
      }
    })
  })
})

router.post('/api/createUserSite', function (req, res) {
  var project = req.body

  if (project.projectname === 'undefined' || project.startdate === 'undefined' || project.geom === 'undefined' ||
      project.satellites === 'undefined' || project.user === 'undefined') {
    return res.status(200).json({
      'status': 'error',
      'message': 'session key or username invalid (here)'
    })
  }

  var center = turf.centroid(JSON.parse(project.geom))
  var timezone
  for (var i = 0; i < utc.features.length; i += 1) {
    if (turf.inside(center, utc.features[i]) === true) {
      timezone = utc.features[i].properties.zone
    }
  }

  // first we verify the user
  var client = new pg.Client(connectionString)
  client.connect(function (err) {
    if (err) { errMsg.serverError(err, res) }

    var request = `SELECT * FROM trig_users WHERE session_id = '${project.user.session}';`

    client.query(request, function (err, result) {
      if (err) { errMsg.queryError(err, res) }

      if (result.rowCount > 0) {
        checkUnique(function () { createSites() })
      } else {
        errMsg.endConnection(client, err, res)
        return res.status(200).json({'status': 'error', 'message': result})
      }
    })
  })

  var checkUnique = function (callback) {
    var request = `
      SELECT * FROM trig_sites
      WHERE sitename = '${project.projectname}' AND username = '${project.user.username}';
    `
    client.query(request, function (err, result) {
      if (err) { errMsg.queryError(err, res) }

      if (result.rowCount > 0) {
        errMsg.endConnection(client, err, res)

        return res.status(200).json({
          'status': 'error',
          'message': 'please choose a unique name'
        })
      } else {
        callback()
      }
    })
  }

  var createSites = function () {
    var request = `
    INSERT INTO trig_sites (
      sitename,
      geom,
      platform,
      username,
      startdate,
      created_on,
      timezone
    ) VALUES (
      '${project.projectname}',
      '${project.geom}',
      'Sentinel-2',
      '${project.user.username}',
      '${project.startdate}',
      NOW(),
      ${timezone}
    );

    UPDATE trig_users SET sites = array_append(sites, '${project.projectname}')
    WHERE username = '${project.user.username}' AND session_id = '${project.user.session}';

    SELECT * FROM trig_sites
    WHERE sitename = '${project.projectname}' AND username = '${project.user.username}';
    `
    client.query(request, function (err, result) {
      if (err) { errMsg.queryError(err, res) }

      errMsg.endConnection(client, err, res)

      return res.status(200).json({
        'status': 'success',
        'message': result
      })
    })
  }
})

router.post('/api/deleteSite', function (req, res) {
  if (
    typeof (req.body.username) === 'undefined' ||
    typeof (req.body.session) === 'undefined' ||
    typeof (req.body.site) === 'undefined'
  ) {
    return res.status(200).json({
      'status': 'error',
      'message': 'invalid delete request'
    })
  }

  var userRequest = {
    'username': req.body.username,
    'session': req.body.session,
    'site': req.body.site
  }

  var client = new pg.Client(connectionString)
  client.connect(function (err) {
    if (err) { errMsg.serverError(err, res) }

    var request = `
    UPDATE trig_users SET sites = array_remove(sites, '${userRequest.site}')
    WHERE username = '${userRequest.username}' AND session_id = '${userRequest.session}';

    DELETE FROM trig_sites
    WHERE sitename = '${userRequest.site}' AND username = '${userRequest.username}';
    `

    client.query(request, function (err, result) {
      if (err) { errMsg.queryError(err, res) }

      errMsg.endConnection(client, err, res)

      return res.status(200).json({
        'status': 'success',
        'message': `${userRequest.site} deleted`
      })
    })
  })
})

router.post('/api/getSite', function (req, res) {
  if (typeof (req.body.username) === 'undefined' || typeof (req.body.site) === 'undefined') {
    return res.status(200).json({
      'status': 'error',
      'message': 'invalid delete request'
    })
  }

  var userRequest = {
    'username': req.body.username,
    'site': req.body.site
  }

  var client = new pg.Client(connectionString)
  client.connect(function (err) {
    if (err) { errMsg.serverError(err, res) }

    var request = `
    SELECT
      sitename,
      image_uuid,
      link_main,
      link_alt,
      link_thumb,
      clouds,
      footprint,
      sun_altitude,
      sun_azimuth,
      identifier,
      platformname,
      platform_id,
      time_begin,
      time_end,
      time_ingestion
    FROM (
      SELECT
        trig_sites.sitename AS sitename,
        trig_sites.username AS username,
        UNNEST(trig_sites.images) AS sites_images,
        trig_images.image_uuid AS image_uuid,
        trig_images.link_main AS link_main,
        trig_images.link_alt AS link_alt,
        trig_images.link_thumb AS link_thumb,
        trig_images.clouds AS clouds,
        trig_images.footprint AS footprint,
        trig_images.sun_altitude AS sun_altitude,
        trig_images.sun_azimuth AS sun_azimuth,
        trig_images.identifier AS identifier,
        trig_images.platformname AS platformname,
        trig_images.platform_id AS platform_id,
        trig_images.time_begin AS time_begin,
        trig_images.time_end AS time_end,
        trig_images.time_ingestion AS time_ingestion
      FROM trig_sites, trig_images
    ) AS b
    WHERE sites_images = image_uuid
    AND username = '${userRequest.username}'
    AND sitename = '${userRequest.site}'
    ORDER BY time_begin DESC
    `

    client.query(request, function (err, result) {
      if (err) { errMsg.queryError(err, res) }

      errMsg.endConnection(client, err, res)

      return res.status(200).json({
        'status': 'success',
        'message': result.rows
      })
    })
  })
})

module.exports = router

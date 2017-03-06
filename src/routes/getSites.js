const express = require('express')
const request = require('request')
const database = require('./database.js')
const credentials = database.credentials.main
const connectionString = database.connectionString
const router = express.Router()
const geojsonPrecision = require('geojson-precision')
const wicket = require('../../node_modules/wicket/wicket')
const sunCalc = require('suncalc')
const turf = require('@turf/turf')
const pg = require('pg')

router.post('/api/fetchEsaImages', function (req, res) {
  var siteRequest = req.body
  var wkt = new wicket.Wkt()
  wkt.read(siteRequest.geom)
  var footprint = wkt.write()

  if (
    siteRequest.footprint === 'undefined' ||
    siteRequest.startdate === 'undefined') {
    return res.status(200).json({
      'status': 'error',
      'message': 'invalid request'
    })
  }

  var startRow = 0
  var baseUrl = 'https://scihub.copernicus.eu/dhus/search?q='
  var esaRequest = `${baseUrl}footprint:"Intersects(${footprint})" AND platformname:Sentinel-2 AND beginposition:[${siteRequest.startdate}T00:00:00.000Z TO NOW]&start=${startRow}&rows=100&format=json`

  var getSearches = function (nr) {
    var base = Math.floor(nr / 100)
    if (nr % 100 > 0) { base += 1 }
    return base
  }

  var message = {
    entries: [],
    request: esaRequest
  }

  request.get(esaRequest, {
    'auth': credentials,
    'timeout': 900000,
    'gzip': true
  }, function (error, response, result) {
    if (!error && response.statusCode === 200) {
      var esa = JSON.parse(result).feed
      var nrEntries = esa['opensearch:totalResults']
      var nrSearches = getSearches(nrEntries) - 1
      var completed = 0
      message.entries = message.entries.concat(esa.entry)

      if (nrSearches === 0) {
        message.entries = makeSense(message.entries)
        insertImages(res, message.entries, siteRequest)
        // return res.status(200).json({
        //   'status': 'success',
        //   'message': message
        // })
      } else {
        for (var i = 0; i < nrSearches; i += 1) {
          startRow = (i + 1) * 100
          esaRequest = `${baseUrl}footprint:"Intersects(${footprint})" AND platformname:Sentinel-2 AND beginposition:[${siteRequest.startdate}T00:00:00.000Z TO NOW]&start=${startRow}&rows=100&format=json`

          request.get(esaRequest, {
            'auth': credentials,
            'timeout': 900000,
            'gzip': true
          }, function (error, response, result) {
            if (!error && response.statusCode === 200) {
              completed += 1
              message.entries = message.entries.concat(JSON.parse(result).feed.entry)
              if (completed === nrSearches) {
                message.entries = makeSense(message.entries)
                insertImages(res, message.entries, siteRequest)
                // return res.status(200).json({
                //   'status': 'success',
                //   'message': message
                // })
              }
            } else {
              return res.status(200).json({
                'status': 'error',
                'message': JSON.parse(result)
              })
            }
          })
        }
      }
    } else {
      return res.status(200).json({
        'status': 'error',
        'message': JSON.parse(result)
      })
    }
  })
})

var insertImages = function (res, arr, siteRequest) {   // TODO: ADD VALUES
  var client = new pg.Client(connectionString)
  var imageCount = arr.length
  var count = 0
  client.connect(function (err) {
    if (err) { db.serverError(client, err, res) }

    for (var i = 0; i < imageCount; i += 1) {
      var image = arr[i]
      var request = `
      DO LANGUAGE plpgsql
      $$
      BEGIN
        INSERT INTO trig_images (
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
        ) VALUES (
            '${image.info.uuid}',
            '${image.link.replace(/'/g, "''")}',
            '${image.altLink.replace(/'/g, "''")}',
            '${image.thumbnail.replace(/'/g, "''")}',
             ${image.clouds},
            '${JSON.stringify(image.footprint)}',
             ${image.sun.altitude},
             ${image.sun.azimuth},
            '${image.info.identifier}',
            '${image.info.platformname}',
            '${image.info.platformserialidentifier}',
            '${image.date.beginposition.after}',
            '${image.date.endposition.after}',
            '${image.date.ingestiondate.after}'
        );

        UPDATE trig_sites
        SET images = array_append(images, '${image.info.uuid}')
        WHERE username = '${siteRequest.user.username}' AND sitename = '${siteRequest.projectname}';

      EXCEPTION
        WHEN unique_violation THEN
        UPDATE trig_images SET image_uuid = '${image.info.uuid}' WHERE image_uuid = '${image.info.uuid}';

      END;
      $$;
      `

      client.query(request, function (err, result) {
        if (err) {
          db.queryError(client, err, res)
        }

        count += 1

        if (count === (imageCount - 1)) {
          db.endConnection(client, err, res)
          return res.status(200).json({
            'status': 'success',
            'message': 'uploaded all images and updated session'
          })
        }
      })
    }
  })
}

var db = {
  endConnection: function (client, err, res) {
    client.end(function (err) {
      if (err) {
        console.log(err)
        return res.status(500).json({
          'status': 'error',
          'message': err
        })
      }
    })
  },
  queryError: function (client, err, res) {
    console.log('Error while querying database: ', err)
    this.endConnection(client, err, res)
    return res.status(500).json({
      'status': 'error',
      'message': err
    })
  },
  serverError: function (client, err, res) {
    console.log('Error while connecting to database: ', err)
    this.endConnection(client, err, res)
    return res.status(500).json({
      'status': 'error',
      'message': err
    })
  }
}

var round = function (num, roundTo) {
  return Math.round(num * Math.pow(10, roundTo)) / Math.pow(10, roundTo)
}

var makeSense = function (arr) {
  var returnArr = []

  for (let i = 0; i < arr.length; i++) {
    var curr = arr[i]

    var image = {
      'date': {},
      'clouds': round(Number(curr.double.content), 2),
      'footprint': {},
      'info': {},
      'sun': {},
      'link': curr.link[0].href,
      'altLink': curr.link[1].href,
      'thumbnail': curr.link[2].href
    }

    for (let w = 0; w < curr.date.length; w++) {
      image.date[curr.date[w].name] = {
        'after': curr.date[w].content.replace('T', ' ').replace('Z', ''),
        'before': curr.date[w].content
      }
    }

    for (let j = 0; j < curr.str.length; j++) {
      if (curr.str[j].name === 'gmlfootprint') { continue }
      image.info[curr.str[j].name] = curr.str[j].content
    }

    var wkt = new wicket.Wkt()
    wkt.read(image.info.footprint)
    var json = wkt.toJson()
    delete image.info.footprint
    var center = {
      'geom': geojsonPrecision.parse(turf.centerOfMass(json), 6)
    }

    var simple = turf.simplify(json, 300, false)
    image.footprint = geojsonPrecision.parse(simple, 6)
    image.footprint.properties = {
      area: round(turf.area(image.footprint) * 0.000001, 2) // km2
    }

    center.lat = center.geom.geometry.coordinates[1]
    center.lng = center.geom.geometry.coordinates[0]
    image.sun = sunCalc.getPosition(
      new Date(image.date.beginposition.before), center.lat, center.lng
    )
    image.sun.azimuth = round(image.sun.azimuth * 180 / Math.PI, 2)
    image.sun.altitude = round(image.sun.altitude * 180 / Math.PI, 2)

    returnArr.push(image)
  }
  return returnArr
}

module.exports = router

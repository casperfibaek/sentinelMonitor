/* eslint-disable */
const express = require('express')
const request = require('request')
const database = require('./database.js')
const credentials = database.credentials.main
const router = express.Router()
const geojson_precision = require('geojson-precision')
const wicket = require('../../node_modules/wicket/wicket')
const sunCalc = require('suncalc')
const turf = require('@turf/turf')

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
        return res.status(200).json({
          'status': 'success',
          'message': message
        })
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
                return res.status(200).json({
                  'status': 'success',
                  'message': message
                })
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
      'information': {},
      'sunAngle': {},
      'link': curr.link[0].href,
      'alternativeLink': curr.link[1].href,
      'thumbnail': curr.link[2].href
    }

    for (let w = 0; w < curr.date.length; w++) {
      image.date[curr.date[w].name] = curr.date[w].content
    }

    for (let j = 0; j < curr.str.length; j++) {
      if (curr.str[j].name === 'gmlfootprint') { continue }
      image.information[curr.str[j].name] = curr.str[j].content
    }

    var wkt = new wicket.Wkt()
    wkt.read(image.information.footprint)
    var json = wkt.toJson()
    delete image.information.footprint
    var center = {
      'geom': geojson_precision.parse(turf.centerOfMass(json), 6)
    }

    var simple = turf.simplify(json, 300, false)
    image.footprint = geojson_precision.parse(simple, 6)
    image.footprint.area = round(turf.area(image.footprint) * 0.000001, 2) // km2

    center.lat = center.geom.geometry.coordinates[1]
    center.lng = center.geom.geometry.coordinates[0]
    image.sunAngle = sunCalc.getPosition(
      new Date(image.date.beginposition), center.lat, center.lng
    )
    image.sunAngle.azimuth = round(image.sunAngle.azimuth * 180 / Math.PI, 2)
    image.sunAngle.altitude = round(image.sunAngle.altitude * 180 / Math.PI, 2)

    returnArr.push(image)
  }
  return returnArr
}

module.exports = router

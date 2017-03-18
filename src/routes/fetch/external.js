/* eslint-disable no-unused-vars */
const request = require('request')
const bodyParser = require('body-parser')
const sunCalc = require('suncalc')
const turf = require('@turf/turf')
const xmldoc = require('xmldoc')
const database = require('../database.js')
const credentials = database.credentials
const NASAkey = database.NASAkey
const utc = require('../geom/utc')
const helper = require('./helpers')

var external = function (obj, callback) {
  var timeOut = setTimeout(function () {
    callback({
      'status': 'error',
      'message': 'Waiting for images took too long..'
    })
  }, 1000 * 60 * 2) // Two minutes

  var returnArray = []
  var key = NASAkey
  var params = {
    'date': '2017.01.01',
    'sentinel1': false,
    'sentinel2': true,
    'sentinel3': false,
    'landsat8': false,
    'geometry': {}
  }

  // CHECK: Does the request have a geometry column?
  if (obj && obj.geometry) {
    params.geometry.geojson = obj.geometry
  } else {
    clearTimeout(timeOut)
    callback({
      'status': 'error',
      'message': 'geometry invalid'
    })
  }

  // Shortcut
  var geom = params.geometry.geojson

  // Convert the strings of the array to numbers
  helper.toNumber(geom.geometry.coordinates[0])

  // Calculate different instances of the geometry, needed for different requests
  params.geometry.array = geom.geometry.coordinates[0]
  params.geometry.wkt = helper.arr2wkt(params.geometry.array)
  params.geometry.center = turf.centroid(geom)

  // Find timezone of geometry and add it to the params
  for (var j = 0; j < utc.features.length; j += 1) {
    if (turf.inside(params.geometry.center, utc.features[j]) === true) {
      params.geometry.timezone = utc.features[j].properties.zone
      break
    }
  }

  // Is there an options parameter
  if (obj && obj.options) {
    var options = helper.readObject(obj.options)

    // Add the options to the parameters
    if (options.date && helper.checkDate(options.date)) { params.date = options.date }
    if (typeof (options.sentinel1) === 'boolean') { params.sentinel1 = options.sentinel1 }
    if (typeof (options.sentinel2) === 'boolean') { params.sentinel2 = options.sentinel2 }
    if (typeof (options.sentinel3) === 'boolean') { params.sentinel3 = options.sentinel3 }
    if (typeof (options.landsat8) === 'boolean') { params.landsat8 = options.landsat8 }
  }

  // Count how many requests to make
  var totalSatellites = 0
  if (params.sentinel1 === true || params.sentinel2 === true) { totalSatellites += 1 }
  if (params.sentinel3 === true) { totalSatellites += 1 }
  if (params.landsat8 === true) { totalSatellites += 1 }

  // Each time a request is finished
  var finished = 0
  var finishCheck = function () {
    finished += 1
    console.log('finished: ' + finished)
    console.log('totalSatellites: ' + totalSatellites)
    if (finished === totalSatellites) {
      clearTimeout(timeOut)
      callback({
        'status': 'success',
        'message': returnArray
      })
    }
  }

  /*****************
   * LANDSAT8
   *****************/
  if (params.landsat8 === true) {
    var landsat = {
      'count_NASA': 0,
      'count_AMAZON': 0,
      'id': []
    }

    console.log('landsat getting image IDs from NASA')

    // MINUS ONE BECAUSE GEOJSON ARRAYS REPEATS THE LAST POINT
    for (var i = 0; i < params.geometry.array.length - 1; i += 1) {
      var link = `https://api.nasa.gov/planetary/earth/assets?lon=${params.geometry.array[i][0]}&lat=${params.geometry.array[i][1]}&begin=${params.date}&api_key=${key}`

      // Request NASA for images of each of the points in the geometry
      request({
        method: 'GET',
        uri: link
      }, function (error, response, body) {
        if (error) { console.log(error) }

        // Parse the reply and add it to the list of unique IDs
        var bodyParse = JSON.parse(body)
        for (var j = 0; j < bodyParse.results.length; j += 1) {
          var post = bodyParse.results[j].id.split('/')[1]
          if (landsat.id.indexOf(post) === -1) {
            landsat.id.push(post)
          }
        }

        // Keeps track of how many points are returned.
        landsat.count_NASA += 1

        // MINUS ONE BECAUSE GEOJSON ARRAYS REPEATS THE LAST POINT
        if (landsat.count_NASA === params.geometry.array.length - 1) {
          console.log('landsat recieved: ' + landsat.id.length + ' from NASA')

          if (landsat.id.length === 0) { finishCheck() }

          for (var i = 0; i < landsat.id.length; i += 1) {
            var id = landsat.id[i]
            var row = id.slice(3, 6)
            var path = id.slice(6, 9)

            var metaLink = `http://landsat-pds.s3.amazonaws.com/L8/${row}/${path}/${id}/${id}_MTL.txt`

            request({
              method: 'GET',
              uri: metaLink
            }, function (error, response, body) {
              if (error) { console.log(error) }
              var preFormat = helper.parseLandsatMetadata(body)

              if (preFormat.METADATA_FILE_INFO.LANDSAT_SCENE_ID) {
                var _id = preFormat.METADATA_FILE_INFO.LANDSAT_SCENE_ID
                var _row = _id.slice(3, 6)
                var _path = _id.slice(6, 9)
                var main = `http://landsat-pds.s3.amazonaws.com/L8/${_row}/${_path}/${_id}/index.html`
                var thumbnail = `http://landsat-pds.s3.amazonaws.com/L8/${_row}/${_path}/${_id}/${_id}_thumb_large.jpg`

                var UTCTime = preFormat.PRODUCT_METADATA.DATE_ACQUIRED + 'T' + preFormat.PRODUCT_METADATA.SCENE_CENTER_TIME
                var localTime = helper.toLocaltime(UTCTime, params.geometry.timezone)

                var S_PM = preFormat.PRODUCT_METADATA

                var NW = [Number(S_PM.CORNER_UL_LON_PRODUCT), Number(S_PM.CORNER_UL_LAT_PRODUCT)]
                var NE = [Number(S_PM.CORNER_UR_LON_PRODUCT), Number(S_PM.CORNER_UR_LAT_PRODUCT)]
                var SW = [Number(S_PM.CORNER_LL_LON_PRODUCT), Number(S_PM.CORNER_LL_LAT_PRODUCT)]
                var SE = [Number(S_PM.CORNER_LR_LON_PRODUCT), Number(S_PM.CORNER_LR_LAT_PRODUCT)]
                var polygon = turf.polygon([[NW, NE, SE, SW, NW]]) // GeoJSON always repeats first and last entry

                var replyLandsat = helper.cloneObject(helper.defaultReply)
                replyLandsat.id = _id
                replyLandsat.satellite.name = 'Landsat-8'
                replyLandsat.satellite.sensor = 'OLI'
                replyLandsat.date.UTC = UTCTime
                replyLandsat.date.local = localTime
                replyLandsat.footprint = turf.truncate(turf.convex(polygon), 5, 2) // precision 5, no z-coordinates
                replyLandsat.clouds.radar = false
                replyLandsat.clouds.cover = preFormat.IMAGE_ATTRIBUTES.CLOUD_COVER
                replyLandsat.sun.altitude = preFormat.IMAGE_ATTRIBUTES.SUN_ELEVATION
                replyLandsat.sun.azimuth = preFormat.IMAGE_ATTRIBUTES.SUN_AZIMUTH
                // replyLandsat.links.main = main
                // replyLandsat.links.alternative = main
                // replyLandsat.links.thumbnail = thumbnail

                returnArray.push(replyLandsat)
              } else {
                var message = new xmldoc.XmlDocument(response.body)
                var messageID = message.childNamed('Key').val; messageID = messageID.split('/')[3]
                console.log('Error getting: ' + messageID)
              }

              landsat.count_AMAZON += 1
              console.log(`landsat completed: ${helper.round((landsat.count_AMAZON / landsat.id.length) * 100, 2)}%`)

              if (landsat.count_AMAZON === landsat.id.length) {
                console.log('Landsat request finished')
                finishCheck()
              }
            }
            )
          }
        }
      }
     )
    }
  }

  /*****************
   * Sentinel 1 & 2
   *****************/
  if (params.sentinel2 === true || params.sentinel1 === true) {
    var startRow = 0
    var baseUrl = 'https://scihub.copernicus.eu/dhus/search?q='
    var end = `&start=${startRow}&rows=100`
    var platforms
    if (params.sentinel1 === true && params.sentinel2 === true) { platforms = '' }
    if (params.sentinel1 === true && params.sentinel2 === false) { platforms = ' AND platformname:Sentinel-1' }
    if (params.sentinel1 === false && params.sentinel2 === true) { platforms = ' AND platformname:Sentinel-2' }
    var esaRequest = `${baseUrl}footprint:"Intersects(${params.geometry.wkt})"${platforms} AND beginposition:[${params.date}T00:00:00.000Z TO NOW]${end}`
    var entries = []

    console.log('Sentinel requesting images')
    request.get(esaRequest, {
      'auth': credentials.main,
      'gzip': true
    }, function (error, response, result) {
      if (!error && response.statusCode === 200) {
        var esa = new xmldoc.XmlDocument(result)
        var nrEntries = Number(esa.childNamed('opensearch:totalResults').val)
        console.log('Sentinel recived: ' + nrEntries + ' IDs')

        var nrSearches = helper.getSearches(nrEntries) - 1
        var completed = 0
        entries = esa.childrenNamed('entry')

        if (nrSearches === 0) {
          entries = helper.parseXML(entries, params)

          for (var i = 0; i < entries.length; i += 1) {
            returnArray.push(entries[i])
          }

          console.log('Sentinel request finished')
          finishCheck()
        } else {
          for (var j = 0; j < nrSearches; j += 1) {
            var newStartRow = (j + 1) * 100
            var newEnd = `&start=${newStartRow}&rows=100`
            var newEsaRequest = `${baseUrl}footprint:"Intersects(${params.geometry.wkt})"${platforms} AND beginposition:[${params.date}T00:00:00.000Z TO NOW]${newEnd}`

            request.get(newEsaRequest, {
              'auth': credentials.secondary,
              'timeout': 1200000,
              'gzip': true
            }, function (error, response, result) {
              if (!error && response.statusCode === 200) {
                completed += 1
                var esa = new xmldoc.XmlDocument(result)
                entries = entries.concat(esa.childrenNamed('entry'))

                if (completed === nrSearches) {
                  entries = helper.parseXML(entries, params)
                  for (var i = 0; i > entries.length; i += 1) {
                    returnArray.push(entries[i])
                  }
                  console.log('Sentinel request finished')
                  finishCheck()
                }
              } else { console.log('error: ' + error) }
            })
          }
        }
      } else { console.log('error: ' + error) }
    })
  }
}

module.exports = external

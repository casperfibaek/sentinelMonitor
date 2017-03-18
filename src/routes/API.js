 /* eslint-disable , camelcase */
const port = process.env.PORT || 3000
const express = require('express')
const request = require('request')
const bodyParser = require('body-parser')
const sunCalc = require('suncalc')
const turf = require('@turf/turf')
const utc = require('./utc')
const app = express()
const xmldoc = require('./xmldoc')
const cors = require('cors')
const credentials = {
  main: {
    'user': 'casperfibaek',
    'pass': 'Goldfish12',
    'sendImmediately': true
  },
  secondary: {
    'user': 'trigSent',
    'pass': 'elephant',
    'sendImmediately': true
  }
}

app.use(cors()) // Allow crossOrigin (remove after testing)
app.use(bodyParser.urlencoded({extended: true}))
app.use(bodyParser.json({extended: true, strict: false}))

/* Get data from ESA and NASA
 Reply Design:
 [
  {
    id: STRING,
    satellite: {
      name: 'Landsat-8',
      sensor: S2MSI1C
    },
    date: {
      UTC: ISO-String,
      local: ISO-String
    },
    clouds: {
      radar: false,
      clouds: NUMBER
    },
    sun: {
      altitude: NUMBER,
      azimuth: NUMBER
    },
    links: {
      main: STRING,
      alternative: STRING,
      thumbnail: STRING
    }
  }, ...
 ]

 Request Example:
   $.post('http://127.0.0.1:3000/api/', {
     geometry: {"type":"Feature","properties":{},"geometry":{"type":"Polygon","coordinates":[[[12.420043,55.547280],[12.711181,55.547280],[12.711181,55.762667],[12.420043,55.762667],[12.420043,55.547280]]]}},
     options: {
       date: '2017-01-01',
       sentinel1: false,
       sentinel2: true,
       sentinel3: false,
       landsat8: false
     }
   })
  .done(function(result) {
    console.log(result)
  })
  .fail(function(error) {
    console.log( "error: ", error.responseJSON );
  })

*/

// Convert a coordinate array to a WKT string (TODO: Error checks)
var arr2wkt = function (arr) {
  var wkt = 'POLYGON (('
  for (var i = 0; i < arr.length; i += 1) {
    if (i !== arr.length - 1) {
      wkt += arr[i].toString().replace(',', ' ') + ', '
    } else {
      wkt += arr[i].toString().replace(',', ' ') + '))'
    }
  }
  return wkt
}

// Converts a coordinate array of strings to numbers
var toNumber = function (arr) {
  for (var i = 0; i < arr.length; i += 1) {
    for (var j = 0; j < arr[i].length; j += 1) {
      arr[i][j] = Number(arr[i][j])
    }
  }
}

// Convert a WKT-string to a coordinate array (TODO: Error checks)
var wkt2arr = function (str) {
  var returnArray = []
  var step1 = str.slice(10, str.length - 2).split(',')
  for (var i = 0; i < step1.length; i += 1) {
    var coords = []
    var holder = step1[i].split(' ')
    coords.push(Number(holder[0]))
    coords.push(Number(holder[1]))
    returnArray.push(coords)
  }
  return returnArray
}

// Convert objects with values as a strings to numbers or booleans where applicable
var readObject = function (obj) {
  for (var key in obj) {
    if (obj.hasOwnProperty(key)) {
      if (!isNaN(obj[key])) { obj[key] = Number(obj[key]) }
      if (obj[key] === 'true') { obj[key] = true }
      if (obj[key] === 'false') { obj[key] = false }
    }
  }
  return obj
}

// Check if a date follows the format: YYYY-MM-DD
var checkDate = function (str) {
  var regex_1 = '^[0-9]{4}-(((0[13578]|(10|12))-(0[1-9]|[1-2][0-9]|3[0-1]))'
  var regex_2 = '|(02-(0[1-9]|[1-2][0-9]))|((0[469]|11)-(0[1-9]|[1-2][0-9]|30)))$'
  var dateRegex = new RegExp(regex_1 + regex_2)
  return dateRegex.test(str)
}

// Parses the return XML file from ESA into an array of human readable objects
var parseXML = function (arr, params) {
  var parsed = []

  for (var i = 0; i < arr.length; i += 1) {
    var reply = cloneObject(defaultReply)
    var entry = arr[i].children
    var polygon
    var center

    for (var j = 0; j < entry.length; j += 1) {
      if (entry[j].name === 'link' && entry[j].attr && !entry[j].attr.rel) { reply.links.main = entry[j].attr.href }
      if (entry[j].name === 'link' && entry[j].attr && entry[j].attr.rel === 'alternative') { reply.links.alternative = entry[j].attr.href }
      if (entry[j].name === 'link' && entry[j].attr && entry[j].attr.rel === 'icon') { reply.links.thumbnail = entry[j].attr.href }
      if (entry[j].attr && entry[j].attr.name === 'uuid') { reply.id = entry[j].val }
      if (entry[j].attr && entry[j].attr.name === 'platformname') { reply.satellite.name = entry[j].val }
      if (entry[j].attr && entry[j].attr.name === 'cloudcoverpercentage') { reply.clouds.cover = Number(entry[j].val) }
      if (entry[j].attr && entry[j].attr.name === 'producttype') { reply.satellite.producttype = entry[j].val }
      if (entry[j].attr && entry[j].attr.name === 'sensoroperationalmode') { reply.satellite.sensormode = entry[j].val }
      if (entry[j].attr && entry[j].attr.name === 'polarisationmode') { reply.satellite.polarisation = entry[j].val }
      if (entry[j].attr && entry[j].attr.name === 'beginposition') {
        reply.date.UTC = entry[j].val
        reply.date.local = toLocaltime(entry[j].val, params.geometry.timezone)
      }
      if (entry[j].attr && entry[j].attr.name === 'instrumentshortname') {
        reply.satellite.sensor = entry[j].val
        if (entry[j].val !== 'MSI') { reply.clouds.radar = true } else { reply.clouds.radar = false }
      }
      if (entry[j].attr && entry[j].attr.name === 'footprint') {
        polygon = turf.polygon([wkt2arr(entry[j].val)])
        center = turf.center(polygon)
      }
    }

    var sun = sunCalc.getPosition(
      new Date(reply.date.UTC), center.geometry.coordinates[1], center.geometry.coordinates[0]
    )
    var azimuth = sun.azimuth * 180 / Math.PI
    if (azimuth < 0) { azimuth += 180 }

    reply.sun.altitude = round(sun.altitude * 180 / Math.PI, 2)
    reply.sun.azimuth = round(azimuth, 2)

    parsed.push(reply)
  }
  return parsed
}

// Parses the plainText metadata file from landsat // AMAZON
var parseLandsatMetadata = function (data) {
  var topics = [
    'METADATA_FILE_INFO',
    'PRODUCT_METADATA',
    'IMAGE_ATTRIBUTES'
  ]

  var meta = function (metadata, topic) {
    var start = metadata.indexOf(topic)
    var end = metadata.lastIndexOf(topic) + topic.length
    var arr = metadata.slice(start, end)
    arr = arr.split('\n')
    arr.shift() // Remove START GROUP
    arr.pop()   // Remove END GROUP

    var obj = {}
    for (var i = 0; i < arr.length; i += 1) {
      var trim = arr[i].trim()
      var key = trim.split('=')[0].trim()
      var value = trim.split('=')[1].trim()

      if (isNaN(value)) { obj[key] = value.replace(/"/g, '') } else { obj[key] = Number(value) }
    }
    return obj
  }

  var retObj = {}
  for (var i = 0; i < topics.length; i += 1) {
    retObj[topics[i]] = meta(data, topics[i])
  }
  return retObj
}

var toLocaltime = function (UTC, timezone) {
  return new Date(Date.parse(UTC) + (1000 * 60 * 60 * Number(timezone))).toISOString()
}

var cloneObject = function (obj) {
  if (obj === null || typeof obj !== 'object') {
    return obj
  }

  var temp = obj.constructor()
  for (var key in obj) {
    temp[key] = cloneObject(obj[key])
  }

  return temp
}

var round = function (num, roundTo) {
  return Math.round(num * Math.pow(10, roundTo)) / Math.pow(10, roundTo)
}

var getSearches = function (nr) {
  var base = Math.floor(nr / 100)
  if (nr % 100 > 0) { base += 1 }
  return base
}

var defaultReply = {
  'id': 'string',
  'satellite': {
    'name': 'string',
    'sensor': 'string'
  },
  'date': {
    'UTC': 'ISO-String',
    'local': 'ISO-String'
  },
  'clouds': {
    'radar': 'boolean',
    'cover': 'number'
  },
  'sun': {
    'altitude': 'number',
    'azimuth': 'number'
  },
  'links': {
    'main': 'string',
    'alternative': 'string',
    'thumbnail': 'string'
  }
}

app.post('/api', function (req, res) {
  var returnArray = []
  var key = '4VMM8Rp44kR5KU1zkiHTuOS4PrYUbPel5ePfE114'
  var params = {
    'date': '2017.01.01',
    'sentinel1': false,
    'sentinel2': true,
    'sentinel3': false,
    'landsat8': true,
    'geometry': {}
  }

  // CHECK: Does the request have a geometry column?
  if (req.body && req.body.geometry && req.body.geometry.geometry && req.body.geometry.geometry.coordinates) {
    params.geometry.geojson = req.body.geometry
  } else {
    return res.status(400).json({
      'status': 'error',
      'message': 'geometry invalid'
    })
  }

  // Shortcut
  var geom = params.geometry.geojson

  // Convert the strings of the array to numbers
  toNumber(geom.geometry.coordinates[0])

  // Calculate different instances of the geometry, needed for different requests
  params.geometry.array = geom.geometry.coordinates[0]
  params.geometry.wkt = arr2wkt(params.geometry.array)
  params.geometry.center = turf.centroid(geom)

  // Find timezone of geometry and add it to the params
  for (var j = 0; j < utc.features.length; j += 1) {
    if (turf.inside(params.geometry.center, utc.features[j]) === true) {
      params.geometry.timezone = utc.features[j].properties.zone
      break
    }
  }

  // Is there an options parameter
  if (req.body && req.body.options) {
    var options = readObject(req.body.options)

    // Add the options to the parameters
    if (options.date && checkDate(options.date)) { params.date = options.date }
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
    if (finished === totalSatellites) { return res.status(200).json(returnArray) }
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
              var preFormat = parseLandsatMetadata(body)

              if (preFormat.METADATA_FILE_INFO.LANDSAT_SCENE_ID) {
                var _id = preFormat.METADATA_FILE_INFO.LANDSAT_SCENE_ID
                var _row = _id.slice(3, 6)
                var _path = _id.slice(6, 9)
                var main = `http://landsat-pds.s3.amazonaws.com/L8/${_row}/${_path}/${_id}/index.html`
                var thumbnail = `http://landsat-pds.s3.amazonaws.com/L8/${_row}/${_path}/${_id}/${_id}_thumb_large.jpg`

                var UTCTime = preFormat.PRODUCT_METADATA.DATE_ACQUIRED + 'T' + preFormat.PRODUCT_METADATA.SCENE_CENTER_TIME
                var localTime = toLocaltime(UTCTime, params.geometry.timezone)

                var replyLandsat = cloneObject(defaultReply)
                replyLandsat.id = _id
                replyLandsat.satellite.name = 'Landsat-8'
                replyLandsat.satellite.sensor = 'OLI'
                replyLandsat.date.UTC = UTCTime
                replyLandsat.date.local = localTime
                replyLandsat.clouds.radar = false
                replyLandsat.clouds.cover = preFormat.IMAGE_ATTRIBUTES.CLOUD_COVER
                replyLandsat.sun.altitude = preFormat.IMAGE_ATTRIBUTES.SUN_ELEVATION
                replyLandsat.sun.azimuth = preFormat.IMAGE_ATTRIBUTES.SUN_AZIMUTH
                replyLandsat.links.main = main
                replyLandsat.links.alternative = main
                replyLandsat.links.thumbnail = thumbnail

                returnArray.push(replyLandsat)
              }

              landsat.count_AMAZON += 1
              console.log(`landsat completed: (${(landsat.count_AMAZON / landsat.id.length) * 100})`)

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

        var nrSearches = getSearches(nrEntries) - 1
        var completed = 0
        entries = esa.childrenNamed('entry')

        if (nrSearches === 0) {
          entries = parseXML(entries, params)

          for (var i = 0; i < entries.length; i += 1) {
            returnArray.push(entries[i])
          }

          console.log('Sentinel-2 request finished')
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
                  entries = parseXML(entries, params)
                  for (var i = 0; i > entries.length; i += 1) {
                    returnArray.push(entries[i])
                  }
                  console.log('Sentinel request finished')
                  finishCheck()
                }
              } else { console.log(error) }
            })
          }
        }
      } else { console.log(error) }
    })
  }
})

app.use(function (req, res, next) {
  res.status(404).render('error', {
    title: 'Page not found'
  })
})
app.listen(port, function () {
  console.log('Satellite API stated')
})

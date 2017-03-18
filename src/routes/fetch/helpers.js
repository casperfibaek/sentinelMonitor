const sunCalc = require('suncalc')
const turf = require('@turf/turf')

var helpers = {}

helpers.defaultReply = {
  'id': 'na',
  'satellite': {
    'name': 'na',             // String
    'sensor': 'na',           // String
    'producttype': 'na',      // String
    'sensormode': 'na',       // String
    'polarisation': 'na'      // String
  },
  'date': {
    'UTC': 'na',              // ISO-String
    'local': 'na'             // ISO-String
  },
  'footprint': 'na',          // Stringified GeoJSON
  'clouds': {
    'radar': 'na',            // Boolean
    'cover': 'na'             // Number
  },
  'sun': {
    'altitude': 'na',         // Number
    'azimuth': 'na'           // Number
  }
  // 'links': {
  //   'main': 'string',
  //   'alternative': 'string',
  //   'thumbnail': 'string'
  // }
}

helpers.arr2wkt = function (arr) {
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
helpers.toNumber = function (arr) {
  for (var i = 0; i < arr.length; i += 1) {
    for (var j = 0; j < arr[i].length; j += 1) {
      arr[i][j] = Number(arr[i][j])
    }
  }
}

// Convert a WKT-string to a coordinate array (TODO: Error checks)
helpers.wkt2arr = function (str) {
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
helpers.readObject = function (obj) {
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
helpers.checkDate = function (str) {
  var regex1 = '^[0-9]{4}-(((0[13578]|(10|12))-(0[1-9]|[1-2][0-9]|3[0-1]))'
  var regex2 = '|(02-(0[1-9]|[1-2][0-9]))|((0[469]|11)-(0[1-9]|[1-2][0-9]|30)))$'
  var dateRegex = new RegExp(regex1 + regex2)
  return dateRegex.test(str)
}

helpers.toLocaltime = function (UTC, timezone) {
  return new Date(Date.parse(UTC) + (1000 * 60 * 60 * Number(timezone))).toISOString()
}

helpers.cloneObject = function (obj) {
  if (obj === null || typeof obj !== 'object') {
    return obj
  }

  var temp = obj.constructor()
  for (var key in obj) {
    temp[key] = helpers.cloneObject(obj[key])
  }

  return temp
}

helpers.round = function (num, roundTo) {
  return Math.round(num * Math.pow(10, roundTo)) / Math.pow(10, roundTo)
}

helpers.getSearches = function (nr) {
  var base = Math.floor(nr / 100)
  if (nr % 100 > 0) { base += 1 }
  return base
}

// Parses the return XML file from ESA into an array of human readable objects
helpers.parseXML = function (arr, params) {
  var parsed = []

  for (var i = 0; i < arr.length; i += 1) {
    var reply = helpers.cloneObject(helpers.defaultReply)
    var entry = arr[i].children
    var polygon
    var center

    for (var j = 0; j < entry.length; j += 1) {
      if (entry[j].attr && entry[j].attr.name === 'uuid') { reply.id = entry[j].val }
      if (entry[j].attr && entry[j].attr.name === 'platformname') { reply.satellite.name = entry[j].val }
      if (entry[j].attr && entry[j].attr.name === 'cloudcoverpercentage') { reply.clouds.cover = Number(entry[j].val) }
      if (entry[j].attr && entry[j].attr.name === 'producttype') { reply.satellite.producttype = entry[j].val }
      if (entry[j].attr && entry[j].attr.name === 'sensoroperationalmode') { reply.satellite.sensormode = entry[j].val }
      if (entry[j].attr && entry[j].attr.name === 'polarisationmode') { reply.satellite.polarisation = entry[j].val }

      if (entry[j].attr && entry[j].attr.name === 'beginposition') {
        reply.date.UTC = entry[j].val
        reply.date.local = helpers.toLocaltime(entry[j].val, params.geometry.timezone)
      }
      if (entry[j].attr && entry[j].attr.name === 'instrumentshortname') {
        reply.satellite.sensor = entry[j].val
        if (entry[j].val !== 'MSI') { reply.clouds.radar = true } else { reply.clouds.radar = false }
      }
      if (entry[j].attr && entry[j].attr.name === 'footprint') {
        polygon = turf.polygon([helpers.wkt2arr(entry[j].val)])
        center = turf.center(polygon)
        reply.footprint = turf.truncate(turf.convex(polygon), 5, 2) // precision 5, no z-coordinates
      }
    }

    var sun = sunCalc.getPosition(
      new Date(reply.date.UTC), center.geometry.coordinates[1], center.geometry.coordinates[0]
    )
    var azimuth = sun.azimuth * 180 / Math.PI
    if (azimuth < 0) { azimuth += 180 }

    reply.sun.altitude = helpers.round(sun.altitude * 180 / Math.PI, 2)
    reply.sun.azimuth = helpers.round(azimuth, 2)

    parsed.push(reply)
  }
  return parsed
}

// Parses the plainText metadata file from landsat // AMAZON
helpers.parseLandsatMetadata = function (data) {
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

module.exports = helpers

const SunCalc = require('./suncalc.js')
const wicket = require('./wicket.js')
const turf = require('@turf/turf')
const gp = require('geojson-precision')

const SentinelAPI = (function () {
  // Internal Constructor
  const api = function () {
    this.version = '0.1.2'

    this.getParamObj = function (arr, geom) {
      let returnObj = {
        'clouds': {},
        'satellite': 'none',
        'timeline': {},
        'footprint': geom
      }

      for (let i = 0; i < arr.length; i++) {
        let val = arr[i].value
        let name = arr[i].name

        switch (name) {
          case 'satellite':
            returnObj.satellite = val
            break
          case 'clouds-from':
            returnObj.clouds.from = val
            break
          case 'clouds-to':
            returnObj.clouds.to = val
            break
          case 'date-from':
            returnObj.timeline.from = val + 'T00:00:00.000Z'
            break
          case 'date-to':
            returnObj.timeline.to = val + 'T00:00:00.000Z'
            break
          default:
            returnObj[name] = val
        }
      }
      return returnObj
    }

    this.getESAString = function (obj) {
      const baseUrl = 'https://scihub.copernicus.eu/dhus/search?q='
      return `${baseUrl}footprint:"Intersects(${obj.footprint})" AND platformname:${obj.satellite} AND cloudcoverpercentage:[${obj.clouds.from} TO ${obj.clouds.to}] AND beginposition:[${obj.timeline.from} TO ${obj.timeline.to}]&start=0&rows=100&format=json`
    }

    this.test = function () {
      return 'Hello world!'
    }

    this.toGeoJSON = function (obj) {
      let wkt = new wicket.Wkt()
      wkt.read(obj)
      return wkt.toJson()
    }

    this.makeSense = function (obj, geom) {
      var m = obj.feed
      let metaData = {
        'amount': m.entry.length,
        'searchParam': m.id,
        'images': []
      }
      let geomArea = turf.area(geom) * 0.000001 // km2

      for (let i = 0; i < metaData.amount; i++) {
        var curr = m.entry[i]

        let image = {
          'date': {},
          'clouds': round(Number(curr.double.content), 2),
          'footprint': {},
          'information': {},
          'sunAngle': {},
          'link': curr.link[0],
          'alternativeLink': curr.link[1],
          'thumbnail': curr.link[2]
        }

        for (let w = 0; w < curr.date.length; w++) {
          image.date[curr.date[w].name] = curr.date[w].content
        }

        for (let j = 0; j < curr.str.length; j++) {
          if (curr.str[j].name === 'gmlfootprint') { continue }
          image.information[curr.str[j].name] = curr.str[j].content
        }

        let wkt = new wicket.Wkt()
        wkt.read(image.information.footprint)
        let json = wkt.toJson()
        delete image.information.footprint
        let center = {
          'geom': gp.parse(turf.centerOfMass(json), 4)
        }

        let simple = turf.simplify(json, 300, false)
        image.footprint = gp.parse(simple, 4)
        image.footprint.area = round(turf.area(image.footprint) * 0.000001, 2) // km2

        center.lat = center.geom.geometry.coordinates[1]
        center.lng = center.geom.geometry.coordinates[0]
        image.sunAngle = SunCalc.getPosition(
          new Date(image.date.beginposition), center.lat, center.lng
        )
        image.sunAngle.azimuth = round(image.sunAngle.azimuth * 180 / Math.PI, 2)
        image.sunAngle.altitude = round(image.sunAngle.altitude * 180 / Math.PI, 2)

        image.intersection = {
          'geom': gp.parse(turf.intersect(image.footprint, geom), 5)
        }
        image.intersection.area = round(turf.area(image.intersection.geom) * 0.000001, 2) // km2
        image.cover = round((image.intersection.area / geomArea) * 100, 2)

        metaData.images.push(image)
      }

      return metaData
    }

    var round = function (num, roundTo) {
      return Math.round(num * Math.pow(10, roundTo)) / Math.pow(10, roundTo)
    }
  }
  return api
})()

const nrs = new SentinelAPI()
module.exports = nrs

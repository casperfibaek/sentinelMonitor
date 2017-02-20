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

    this.makeSense = function (obj) {
      var m = obj.feed
      let metaData = {
        'amount': m.entry.length,
        'searchParam': m.id,
        'images': []
      }

      for (let i = 0; i < metaData.amount; i++) {
        var curr = m.entry[i]

        let image = {
          'date': {},
          'clouds': Number(curr.double.content),
          'footprint': {},
          'information': {},
          'sunAngle': {},
          'thumbnail': curr.link[2],
          'link': curr.link[0],
          'alternativeLink': curr.link[1]
        }

        for (let w = 0; w < curr.date.length; w++) {
          image.date[curr.date[w].name] = curr.date[w].content
        }

        for (let j = 0; j < curr.str.length; j++) {
          image.information[curr.str[j].name] = curr.str[j].content
        }

        let wkt = new wicket.Wkt()
        wkt.read(image.information.footprint)
        let json = wkt.toJson()
        let center = {
          'geom': gp.parse(turf.centerOfMass(json), 4)
        }

        let simple = turf.simplify(json, 100, false)
        image.footprint = gp.parse(simple, 4)
        image.footprint.area = turf.area(image.footprint)

        center.lat = center.geom.geometry.coordinates[1]
        center.lng = center.geom.geometry.coordinates[0]
        image.sunAngle = SunCalc.getPosition(
          new Date(image.date.beginposition), center.lat, center.lng
        )
        image.sunAngle.azimuth *= 180 / Math.PI
        image.sunAngle.altitude *= 180 / Math.PI

        metaData.images.push(image)
      }

      return metaData
    }
  }
  return api
})()

const nrs = new SentinelAPI()
module.exports = nrs

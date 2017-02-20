const SunCalc = require('./suncalc.js')
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

        image.footprint = image.information.footprint
        image.sunAngle = SunCalc.getPosition(
          new Date(image.date.beginposition), 55.40, 10.40
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

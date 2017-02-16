var NirasSentinelAPI = (function () {
  // Internal Constructor
  var api = function () {
    this.version = '0.1.1'

    // regular calculation here.
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
      return `${baseUrl}footprint:"Intersects(${obj.footprint})" AND platformname:${obj.satellite} AND cloudcoverpercentage:[${obj.clouds.from} TO ${obj.clouds.to}] AND beginposition:[${obj.timeline.from} TO ${obj.timeline.to}]&format=json`
    }
  }
  return api
})()

var nrs = new NirasSentinelAPI() // eslint-disable-line

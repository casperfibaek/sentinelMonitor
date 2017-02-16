var NirasSentinelAPI = (function () {
  // Internal Constructor
  var api = function () {
    this.version = '0.1.1'

    // regular calculation here.
    var baseUrl = 'https://scihub.copernicus.eu/dhus/search?q='

    var defaultValues = {
      footprint: 'POLYGON((14.676361083984375 54.9847061857119, 14.676361083984375 55.30101079449589, 15.167999267578125 55.30101079449589, 15.167999267578125 54.9847061857119, 14.676361083984375 54.9847061857119))',
      platformname: 'Sentinel-2',
      date: '[NOW-90DAYS TO NOW]',
      clouds: {
        from: 0,
        to: 5
      }
    }

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
            returnObj.timeline.from = val
            break
          case 'date-to':
            returnObj.timeline.to = val
            break
          default:
            returnObj[name] = val
        }
      }
      return returnObj
    }
  }

  this.getESAString = function (obj) {
    var retObj = JSON.parse( JSON.stringify( defaultValues ) )
  }

  return api
})()

var nrs = new NirasSentinelAPI() // eslint-disable-line

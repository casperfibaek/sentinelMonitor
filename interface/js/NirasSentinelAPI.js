var NirasSentinelAPI = (function () {
    // Internal Constructor
  var api = function () {
    this.version = '0.1.1'

    this.getParamObj = function (arr) {
      var returnObj = {}
      for (let i = 0; i < arr.length; i++) {
        returnObj[arr[i].name] = arr[i].value
      }
      return returnObj
    }
  }

  // regular calculation here.

  return api
})()

var nrs = new NirasSentinelAPI()

var request = require('request')
var fs = require('fs')

var credentials = {
  'user': 'casperfibaek',
  'pass': 'Goldfish12',
  'sendImmediately': true
}

var ESA = {
  bounds: {
    'pre': 'footprint:"Intersects("',
    'msg': 'POLYGON((14.676361083984375 54.9847061857119, 14.676361083984375 55.30101079449589, 15.167999267578125 55.30101079449589, 15.167999267578125 54.9847061857119, 14.676361083984375 54.9847061857119))',
    'post': ')"'
  },
  platform: {
    'pre': 'platformname:',
    'msg': 'Sentinel-2'
  },
  clouds: {
    'pre': 'cloudcoverpercentage:[',
    'from': 0,
    'to': 5,
    'post': ']'
  },
  time: {
    'pre': 'ingestiondate:[',
    'from': '90DAYS TO NOW',
    'to': 'NOW',
    'post': ']'
  },
  base: 'https://scihub.copernicus.eu/dhus/search?q='
}

var URL = ESA.base + ESA.bounds.pre + ESA.bounds.msg + ESA.bounds.post +
' AND ' + ESA.platform.pre + ESA.platform.msg +
' AND ' + ESA.clouds.pre + ESA.clouds.from + ' TO ' + ESA.clouds.to + ESA.clouds.post +
' AND ' + ESA.time.pre + ESA.time.to + '-' + ESA.time.from + ESA.time.post

fs.writeFile('./' + 'request.txt', URL)

// GET XML or JSON file
request.get(URL, {
  auth: credentials
}, function (error, response, result) {
  if (!error && response.statusCode === 200) {
    if (!fs.existsSync('./requests')) {
      fs.mkdirSync('./requests')
    }

    if (!fs.existsSync('./images')) {
      fs.mkdirSync('./images')
    }

    // fs.writeFile( './images/' + title + '.jpg', body );
    // fs.writeFile( './tmp/test.json', JSON.stringify( print ) );
    // fs.writeFile( './tmp/test.xml', result );
  }
})

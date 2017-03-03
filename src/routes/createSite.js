/* eslint-disable */
const express = require('express')
const request = require('request')
const database = require('./database.js')
const credentials = database.credentials.main
// const connectionString = database.connectionString
const router = express.Router()
// const pg = require('pg')
const SunCalc = require('./methods/suncalc.js')
const wicket = require('./methods/wicket.js')
// const turf = require('@turf/turf')
// const gp = require('geojson-precision')

router.post('/api/create', function (req, res) {
  // var client = new pg.Client(connectionString)
  var siteRequest = req.body
  var wkt = new wicket.Wkt()
  wkt.read(siteRequest.geom)
  var footprint = wkt.write()

  var baseUrl = 'https://scihub.copernicus.eu/dhus/search?q='
  var esaRequest = `${baseUrl}footprint:"Intersects(${footprint})" AND platformname:Sentinel-2 AND beginposition:[${siteRequest.startdate}T00:00:00.000Z TO NOW]&start=0&rows=100&format=json`

  var getSearches = function (nr) {
    var base = Math.floor(nr / 100)
    if (nr % 100 > 0) { base += 1 }
    return base
  }

  var entries = []

  request.get(esaRequest, {
    'auth': credentials,
    'timeout': 900000,
    'gzip': true
  }, function (error, response, result) {
    if (!error && response.statusCode === 200) {
      var esa = JSON.parse(result).feed
      var nrEntries = esa['opensearch:totalResults']
      var nrSearches = getSearches(nrEntries)

      entries = entries.concat(esa.entry);



    } else {
      return res.status(200).json({
        'status': 'error',
        'message': JSON.parse(result)
      })
    }
  })



  // return res.status(200).json({
  //   'status': 'success',
  //   'message': JSON.parse(result)
  // })

  // client.connect(function (err) {
  //   if (err) {
  //     return res.status(500).json({
  //       'status': 'error',
  //       'message': err
  //     })
  //   }
  //
  //   // Query the database
  //   var request = `
  //     SELECT * FROM trig_users
  //     WHERE username = '${user.username}';`
  //
  //   client.query(request, function (err, result) {
  //     if (err) {
  //       return res.status(500).json({
  //         'status': 'error',
  //         'message': err
  //       })
  //     }
  //
  //     if (result.rowCount === 0) {
  //       client.end(function (err) {
  //         if (err) {
  //           return res.status(500).json({
  //             'status': 'error',
  //             'message': err
  //           })
  //         }
  //       })
  //
  //       return res.status(200).json({
  //         'status': 'error',
  //         'message': 'Invalid user or password',
  //         'total': result
  //       })
  //     } else {
  //       bcrypt.compare(user.password, result.rows[0].password, function (err, check) {
  //         if (err) {
  //           console.log(err)
  //           return res.status(200).json({'status': 'error', 'message': 'error hashing'})
  //         }
  //
  //         if (check === true) {
  //           var request = `
  //           UPDATE trig_users SET
  //           session_created = NOW(),
  //           session_expires = TIMESTAMP 'tomorrow',
  //           session_id = '${user.session}',
  //           last_login = NOW()
  //           WHERE username = '${user.username}';
  //
  //           SELECT * FROM trig_users
  //           WHERE username = '${user.username}';`
  //
  //           client.query(request, function (err, result) {
  //             if (err) {
  //               return res.status(500).json({
  //                 'status': 'error',
  //                 'message': err
  //               })
  //             }
  //
  //             return res.status(200).json({
  //               'status': 'success',
  //               'message': result.rows[0]
  //             })
  //           })
  //         } else {
  //           return res.status(200).json({
  //             'status': 'error',
  //             'message': 'Invalid user or password'
  //           })
  //         }
  //       })
  //     }
  //   })
  // })
})

module.exports = router

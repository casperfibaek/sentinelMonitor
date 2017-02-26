const express = require('express')
const pg = require('pg')

const database = require('./database.js')
const connectionString = database.connectionString
const router = express.Router()

var arr2sql = function (arr) {
  var rstr = ''
  for (var i = 0; i < arr.length; i++) {
    if (i === arr.length - 1) {
      rstr += `(siteid = ${arr[i]})`
    } else {
      rstr += `(siteid = ${arr[i]}) OR `
    }
  }
  return rstr
}

// Get all the sites of a user
router.post('/api/getSites', function (req, res) {
  if (!req.body.uuid) {
    return res.status(500).json({'status': 'error', 'message': 'uuid not found'})
  } else {
    var client = new pg.Client(connectionString)
    var uuid = req.body.uuid
    var findUser = `SELECT * FROM trigusers WHERE user_uuid = '${uuid}'`

    client.connect(function (err) {
      if (err) console.log(err)

      // Query the database
      client.query(findUser, function (err, result) {
        if (err) console.log(err)

        var sites = JSON.parse(result.rows[0].sites)

        if (sites.length !== 0) {
          var findSite = `SELECT * FROM trigsites WHERE ${arr2sql(sites)}`

          client.query(findSite, function (err, result) {
            if (err) console.log(err)

            return res.status(200).json({
              'status': 'success',
              'sites': result.rows
            })
          })

          client.end(function (err) {
            if (err) console.log(err)
          })
        } else {
          client.end(function (err) {
            if (err) console.log(err)
          })

          return res.status(200).json({
            'status': 'success',
            'sites': sites,
            'message': 'User has no sites'
          })
        }
      })
    })
  }
})

router.post('/api/getImagesFromSite', function (req, res) {
  var client = new pg.Client(connectionString)
  // var uuid = req.body.uuid
  var site = req.body.site

  client.connect(function (err) {
    if (err) console.log(err)

    // Query the database
    var imgSQL = `SELECT * FROM trigsites WHERE siteid = ${site}`
    client.query(imgSQL, function (err, result) {
      if (err) console.log(err)
      var siteResult = {
        'geom': result.rows[0].geom,
        'images': result.rows[0].images
      }

      client.end(function (err) {
        if (err) console.log(err)
      })

      return res.status(200).json({
        'status': 'success',
        'images': siteResult.images,
        'geom': siteResult.geom
      })
    })
  })
})

router.post('/api/getImage', function (req, res) {
  var client = new pg.Client(connectionString)
  var imageuuid = req.body.imageuuid

  client.connect(function (err) {
    if (err) console.log(err)

    // Query the database
    // TODO: CHANGE TO trigimages
    var imgSQL = `SELECT * FROM trigprojects WHERE imageuuid = '${imageuuid}'`
    console.log(imgSQL)
    client.query(imgSQL, function (err, result) {
      if (err) console.log(err)

      client.end(function (err) {
        if (err) console.log(err)
      })

      return res.status(200).json({
        'status': 'success',
        'message': result
      })
    })
  })
})

module.exports = router

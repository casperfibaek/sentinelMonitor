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

// create site: INSERT INTO trigsites (sitename, geom, created_on, images) VALUES ('København', 'coordinates{}', NOW(), '[]')

module.exports = router

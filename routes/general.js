const express = require('express')
const pg = require('pg')

const database = require('./database.js')
const connectionString = database.connectionString
const router = express.Router()

router.post('/api/sites', function (req, res) {
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

        client.end(function (err) {
          if (err) console.log(err)
        })

        if (sites.length !== 0) {
          return res.status(200).json({
            'status': 'success',
            'sites': sites
          })
        } else {
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

module.exports = router

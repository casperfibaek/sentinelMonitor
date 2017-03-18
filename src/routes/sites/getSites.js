const express = require('express')
const router = express.Router()
const pg = require('pg')
const database = require('../database')
const connectionString = database.connectionString
const errMsg = require('../errorMessages')

router.post('/api/getSites', function (req, res) {
  var user = {
    username: req.body.username || 'undefined',
    session: req.body.session || 'undefined'
  }

  if (user.session === 'undefined' || user.username === 'undefined') {
    return res.status(200).json({
      'status': 'error',
      'message': 'session key or username invalid'
    })
  }

  var client = new pg.Client(connectionString)
  client.connect(function (err) {
    if (err) { errMsg.serverError(err, res) }

    var request = `
    SELECT sitename, latest_image_time, latest_image_uuid, timezone
    FROM (
      SELECT
        UNNEST(trig_users.sites) AS arr_sitename,
        trig_sites.latest_image_time AS latest_image_time,
        trig_sites.latest_image_uuid AS latest_image_uuid,
        trig_sites.sitename AS sitename,
        trig_sites.timezone AS timezone,
        trig_users.username AS username,
        trig_users.session_id AS session_id,
        trig_images.image_uuid as image_uuid
      FROM trig_sites, trig_users, trig_images
    ) AS b
    WHERE arr_sitename = sitename
    AND latest_image_uuid = image_uuid
    AND username = '${user.username}'
    AND session_id = '${user.session}';`

    client.query(request, function (err, result) {
      if (err) { errMsg.queryError(err, res) }

      errMsg.endConnection(client, err, res)

      if (result && result.rowCount > 0) {
        return res.status(200).json({
          'status': 'success',
          'message': result.rows
        })
      } else if (result.rowCount === 0) {
        return res.status(200).json({'status': 'success', 'message': []})
      }
    })
  })
})

module.exports = router

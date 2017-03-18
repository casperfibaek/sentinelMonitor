const express = require('express')
const database = require('../database')
const errMsg = require('../errorMessages')
const connectionString = database.connectionString
const router = express.Router()
const pg = require('pg')

router.post('/api/deleteSite', function (req, res) {
  if (
    typeof (req.body.username) === 'undefined' ||
    typeof (req.body.session) === 'undefined' ||
    typeof (req.body.site) === 'undefined'
  ) {
    return res.status(200).json({
      'status': 'error',
      'message': 'invalid delete request'
    })
  }

  var userRequest = {
    'username': req.body.username,
    'session': req.body.session,
    'site': req.body.site
  }

  var client = new pg.Client(connectionString)
  client.connect(function (err) {
    if (err) { errMsg.serverError(err, res) }

    var request = `
    UPDATE trig_users SET sites = array_remove(sites, '${userRequest.site}')
    WHERE username = '${userRequest.username}' AND session_id = '${userRequest.session}';

    DELETE FROM trig_sites
    WHERE sitename = '${userRequest.site}' AND username = '${userRequest.username}';
    `

    client.query(request, function (err, result) {
      if (err) { errMsg.queryError(err, res) }

      errMsg.endConnection(client, err, res)

      return res.status(200).json({
        'status': 'success',
        'message': `${userRequest.site} deleted`
      })
    })
  })
})

module.exports = router

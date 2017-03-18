const express = require('express')
const router = express.Router()
const pg = require('pg')
const database = require('../database')
const connectionString = database.connectionString
const errMsg = require('../errorMessages')

router.post('/api/getImages', function (req, res) {
  if (typeof (req.body.username) === 'undefined' || typeof (req.body.site) === 'undefined') {
    return res.status(200).json({
      'status': 'error',
      'message': 'invalid delete request'
    })
  }

  var userRequest = {
    'username': req.body.username,
    'site': req.body.site
  }

  var client = new pg.Client(connectionString)
  client.connect(function (err) {
    if (err) { errMsg.serverError(err, res) }

    var request = `
    SELECT
      sitename,
      image_uuid,
      link_main,
      link_alt,
      link_thumb,
      clouds,
      footprint,
      sun_altitude,
      sun_azimuth,
      identifier,
      platformname,
      platform_id,
      time_begin,
      time_end,
      time_ingestion
    FROM (
      SELECT
        trig_sites.sitename AS sitename,
        trig_sites.username AS username,
        UNNEST(trig_sites.images) AS sites_images,
        trig_images.image_uuid AS image_uuid,
        trig_images.link_main AS link_main,
        trig_images.link_alt AS link_alt,
        trig_images.link_thumb AS link_thumb,
        trig_images.clouds AS clouds,
        trig_images.footprint AS footprint,
        trig_images.sun_altitude AS sun_altitude,
        trig_images.sun_azimuth AS sun_azimuth,
        trig_images.identifier AS identifier,
        trig_images.platformname AS platformname,
        trig_images.platform_id AS platform_id,
        trig_images.time_begin AS time_begin,
        trig_images.time_end AS time_end,
        trig_images.time_ingestion AS time_ingestion
      FROM trig_sites, trig_images
    ) AS b
    WHERE sites_images = image_uuid
    AND username = '${userRequest.username}'
    AND sitename = '${userRequest.site}'
    ORDER BY time_begin DESC
    `

    client.query(request, function (err, result) {
      if (err) { errMsg.queryError(err, res) }

      errMsg.endConnection(client, err, res)

      return res.status(200).json({
        'status': 'success',
        'message': result.rows
      })
    })
  })
})

module.exports = router

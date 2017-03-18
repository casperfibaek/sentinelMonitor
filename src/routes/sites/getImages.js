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
      sat_name
      sat_sensor,
      sat_producttype,
      sat_sensormode,
      sat_polarisation,
      time_utc,
      time_local,
      footprint,
      clouds,
      radar,
      sun_altitude,
      sun_azimuth
    FROM (
      SELECT
        trig_sites.sitename AS sitename,
        trig_sites.username AS username,
        UNNEST(trig_sites.images) AS sites_images,
        trig_images.image_uuid AS image_uuid,
        trig_images.sat_name AS sat_name,
        trig_images.sat_sensor AS sat_sensor,
        trig_images.sat_producttype AS sat_producttype,
        trig_images.sat_sensormode AS sat_sensor,
        trig_images.sat_polarisation AS sat_polarisation,
        trig_images.time_utc AS time_utc,
        trig_images.time_local AS time_local,
        trig_images.footprint AS footprint,
        trig_images.clouds AS clouds,
        trig_images.radar AS radar,
        trig_images.sun_altitude AS sun_altitude,
        trig_images.sun_azimuth AS sun_azimuth,
      FROM trig_sites, trig_images
    ) AS b
    WHERE sites_images = image_uuid
    AND username = '${userRequest.username}'
    AND sitename = '${userRequest.site}'
    ORDER BY time_utc DESC
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

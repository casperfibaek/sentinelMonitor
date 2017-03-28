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
      sat_name,
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
        sites.sitename AS sitename,
        sites.username AS username,
        UNNEST(sites.images) AS sites_images,
        images.image_uuid AS image_uuid,
        images.sat_name AS sat_name,
        images.sat_sensor AS sat_sensor,
        images.sat_producttype AS sat_producttype,
        images.sat_sensormode AS sat_sensormode,
        images.sat_polarisation AS sat_polarisation,
        images.time_utc AS time_utc,
        images.time_local AS time_local,
        images.footprint AS footprint,
        images.clouds AS clouds,
        images.radar AS radar,
        images.sun_altitude AS sun_altitude,
        images.sun_azimuth AS sun_azimuth
      FROM sites, images
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

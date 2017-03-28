const express = require('express')
const router = express.Router()
const request = require('request')
const database = require('./database')
const credentials = database.credentials.secondary

router.get('/', function (req, res, next) {
  req.session.cookie.expires = new Date(Date.now() + 3600000) // 1 hour
  req.session.cookie.maxAge = 3600000 // 1 hour
  res.render('index', {
    session: req.session.id
  })
  console.log('sessionID: ' + req.session.id)
})

router.get('/image', function (req, res, next) {
  if (req.query.uuid) {
    var link = `https://scihub.copernicus.eu/dhus/odata/v1/Products('${encodeURI(req.query.uuid)}')/Products('Quicklook')/$value`
    request(link, {
      'auth': credentials,
      'timeout': 900000,
      'gzip': true
    })
      .on('error', function (err) {
        console.log(err)
      })
      .pipe(res)
  } else {
    return res.status(200).json({status: 'success', message: 'bad link'})
  }
})

router.get('/landsat', function (req, res, next) {
  if (req.query.uuid) {
    var link = `${encodeURI(req.query.uuid)}`
    request(link, {
      'timeout': 900000,
      'gzip': true
    })
      .on('error', function (err) {
        console.log(err)
      })
      .pipe(res)
  } else {
    return res.status(200).json({status: 'success', message: 'bad link'})
  }
})

module.exports = router

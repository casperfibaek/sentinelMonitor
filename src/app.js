const path = require('path')
const express = require('express')
const port = process.env.PORT || 3000
const session = require('express-session')
const routes = require('./routes/userControl')
const landsat = require('./routes/landsat')
const database = require('./routes/database')
const credentials = database.credentials.secondary
const request = require('request')
const esaRoute = require('./routes/getSites')
const bodyParser = require('body-parser')
const morgan = require('morgan')
const cors = require('cors')
const app = express()

app.use(cors()) // Allow crossOrigin (remove after testing)
app.use(morgan('dev')) // Logs (remove after testing)
app.use(bodyParser.urlencoded({
  extended: true,
  parameterLimit: 10000,
  limit: 1024 * 1024 * 10 // 10mb
}))
app.use(bodyParser.json({
  extended: true,
  parameterLimit: 10000,
  limit: 1024 * 1024 * 10 // 10mb
}))
app.use(session({
  secret: 'un vie de file dleau',
  saveUninitialized: true,
  resave: true,
  name: 'sessionID'
}))
app.use(express.static(path.join(__dirname, 'public')))
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'hbs')
app.use('/', routes)
app.use('/', landsat)
app.use('/', esaRoute)

app.get('/', function (req, res, next) {
  req.session.cookie.expires = new Date(Date.now() + 3600000) // 1 hour
  req.session.cookie.maxAge = 3600000 // 1 hour
  res.render('index', {
    session: req.session.id
  })
  console.log('sessionID: ' + req.session.id)
})

app.get('/logout', function (req, res, next) {
  req.session.destroy()
  res.redirect('/')
  console.log('session destroyed')
})

app.get('/image', function (req, res, next) {
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

app.use(function (req, res, next) {
  res.status(404).render('error', {
    title: 'Page not found'
  })
})

app.listen(port, function () {
  console.log('The Sentinel Monitor API has been started')
})

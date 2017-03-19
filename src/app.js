const path = require('path')
const express = require('express')
const port = process.env.PORT || 80
const session = require('express-session')

const basic = require('./routes/index')
const auth = require('./routes/auth')
const getSites = require('./routes/sites/getSites')
const createSite = require('./routes/sites/createSite')
const deleteSite = require('./routes/sites/deleteSite')
const getImages = require('./routes/sites/getImages')

const bodyParser = require('body-parser')
const cors = require('cors')
const app = express()

app.use(cors()) // Allow crossOrigin (remove after testing)
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
app.use('/', basic)
app.use('/', auth)
app.use('/', getSites)
app.use('/', createSite)
app.use('/', deleteSite)
app.use('/', getImages)
app.use(function (req, res, next) {
  res.status(404).render('error', {
    title: 'Page not found'
  })
})
app.set('port', port)
app.listen(app.get('port'), '0.0.0.0')

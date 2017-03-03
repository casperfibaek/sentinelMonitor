const path = require('path')
const express = require('express')
const port = process.env.PORT || 3000
const session = require('express-session')
const routes = require('./routes/userControl')
const esaRoute = require('./routes/createSite')
const bodyParser = require('body-parser')
const morgan = require('morgan')
const cors = require('cors')
const app = express()

app.use(cors()) // Allow crossOrigin (remove after testing)
app.use(morgan('dev')) // Logs (remove after testing)
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))
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

app.use(function (req, res, next) {
  res.status(404).render('error', {
    title: 'Page not found'
  })
})

app.listen(port, function () {
  console.log('The Sentinel Monitor API has been started')
})

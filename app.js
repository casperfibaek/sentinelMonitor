const path = require('path')
const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')
const hbs = require('hbs')
const myRoutes = require('./routes/index')
const app = express()

// Allow crossOrigin (remove after testing)
app.use(cors())
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

// Set basic views (concate and uglify)
app.set('views', path.join(__dirname, 'views'))

// Name a public folder (referenced in the views)
app.use(express.static(path.join(__dirname, 'public')))

// use routes
app.use('/', myRoutes)

// Change from jade to HBS (Stylistic choice)
app.set('view engine', 'hbs')

// extend the hbs templates
var blocks = {}

hbs.registerHelper('extend', function (name, context) {
  var block = blocks[name]
  if (!block) {
    block = blocks[name] = []
  }

  block.push(context.fn(this))
})

hbs.registerHelper('block', function (name) {
  var val = (blocks[name] || []).join('\n')

    // clear the block
  blocks[name] = []
  return val
})

app.get('/', function (req, res, next) {
  res.render('index', {
    title: 'Sentinel-Monitor (login)'
  })
})

app.get('/create', function (req, res, next) {
  res.render('createSite', {
    title: 'Sentinel-Monitor (create)'
  })
})

app.get('/overview', function (req, res, next) {
  res.render('siteOverview', {
    title: 'Sentinel-Monitor (overview)'
  })
})

app.use(function (err, req, res, next) {
  res.status(err.status || 500)
  res.render('error', {
    message: err.message,
    error: {}
  })
})

app.listen(3000, function () {
  console.log('The Sentinel Monitor API has been started')
})

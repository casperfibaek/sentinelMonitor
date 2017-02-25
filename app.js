const path = require('path')
const express = require('express')
const port = process.env.PORT || 3000
const bodyParser = require('body-parser')
const cors = require('cors')
const hbs = require('hbs')
const morgan = require('morgan')
const myRoutes = require('./routes/index')
const myAuths = require('./routes/auth')
const pg = require('pg')
const database = require('./routes/database.js')
const connectionString = database.connectionString
const app = express()

// LOG EVERYTHING
app.use(morgan('dev'))

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

// use auth routes
app.use('/', myAuths)

// changed from jade(default) to HBS
app.set('view engine', 'hbs')

var checkSessions = function () {
  let client = new pg.Client(connectionString)
  let userRequest = `DELETE from trigsessions WHERE created_on < NOW() - INTERVAL '60 minutes'`
  client.connect(function (err) {
    if (err) console.log(err)

      // Query the database
    client.query(userRequest, function (err, result) {
      if (err) console.log(err)

      console.log('checked old sessions')

        // Disconnect the client
      client.end(function (err) {
        if (err) console.log(err)
      })
    })
  })
}
setInterval(checkSessions, 5 * 60000)
checkSessions()

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

app.get('/:uuid', function (req, res, next) {
  res.render('index', {
    title: 'Sentinel-Monitor'
  })
  console.log(req.params.uuid)
})

app.get('/login', function (req, res, next) {
  res.render('login', {
    title: 'Sentinel-Monitor (login)'
  })
})

app.get('/signup', function (req, res, next) {
  res.render('signup', {
    title: 'Sentinel-Monitor (signup)'
  })
})

app.get('/create', function (req, res, next) {
  res.render('createSite', {
    title: 'Sentinel-Monitor (create)'
  })
})

app.use(function (req, res, next) {
  res.status(404).render('error', {
    title: 'Page not found'
  })
})

app.listen(port, function () {
  console.log('The Sentinel Monitor API has been started')
})

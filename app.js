const path = require('path')
const express = require('express')
const port = process.env.PORT || 3000
const bodyParser = require('body-parser')
const cors = require('cors')
const hbs = require('hbs')
const morgan = require('morgan')
const esaRoute = require('./routes/esa')
const routes = require('./routes/general')
const app = express()
const database = require('./routes/database')
const connectionString = database.connectionString
const pg = require('pg')
const uuid = require('uuid/v1')

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
app.use('/', esaRoute)

// use auth routes
app.use('/', routes)

// changed from jade(default) to HBS
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
  var client = new pg.Client(connectionString)
  var suppliedUUID = req.query.uuid
  var generatedUUID = uuid()

  // check if uuid is in the database
  var findUser = `SELECT * FROM trigusers WHERE user_uuid = '${suppliedUUID}'`
  var createUser = `INSERT INTO trigusers (user_uuid, sites, created_on, last_login) VALUES ('${generatedUUID}', '[2, 6, "bob"]', NOW(), NOW())`

  client.connect(function (err) {
    if (err) console.log(err)

    // Query the database
    client.query(findUser, function (err, result) {
      if (err) console.log(err)

      if (result.rows.length !== 0) {
        if (result.rows[0].user_uuid === suppliedUUID) {
          var sites = JSON.parse(result.rows[0].sites)
          console.log('uuid found')

          client.end(function (err) {
            if (err) console.log(err)
          })

          if (sites.length === 0) {
            console.log('user has no sites')
          }

          res.render('index', {
            title: 'Sentinel-Monitor'
          })
        }
      } else {
        client.query(createUser, function (err, result) {
          if (err) console.log(err)

          console.log('created uuid')

          client.end(function (err) {
            if (err) console.log(err)
          })

          return res.redirect('/?uuid=' + encodeURIComponent(generatedUUID))
        })
      }
    })
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

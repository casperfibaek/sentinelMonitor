const path = require('path')
const request = require('request')
const pg = require('pg')
const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')
const users = require('./users/connection')
const nrs = require('./methods/baseAPI')
const connectionString = users.connectionString
const credentials = users.credentials
const app = express()

// Allow any crossOrigin
app.use(cors())
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

// Set basic views (concate and uglify)
app.set('views', path.join(__dirname, 'views'))

// Name a public folder (referenced in the views)
app.use(express.static(path.join(__dirname, 'public')))

// Change from jade to HBS (Stylistic choice)
app.set('view engine', 'hbs')

app.get('/', function (req, res, next) {
  res.render('index', {
    title: 'Sentinel-Monitor'
  })
})

console.log(nrs.test())

app.listen(3000, function () {
  console.log('The Sentinel Monitor API has been started')
})

/* ---------------------------------
 * END POINT FOR USER AUTHENTICATION
 * ---------------------------------
 */
app.post('/account', function (req, res) {
  if (!req.body.username || !req.body.password) {
    return res.send({
      'status': 'error', 'message': 'missing a parameter'
    })
  } else {
    let user = {
      username: req.body.username,
      password: req.body.password
    }

    // Open a connection to the user database
    let client = new pg.Client(connectionString)
    // SQL Request for the database
    let dbRequest = `SELECT * FROM trigusers WHERE username = '${user.username}' AND password = '${user.password}'`

    // Connect to our database
    client.connect(function (err) {
      if (err) throw err

      // Query the database
      client.query(dbRequest, function (err, result) {
        if (err) throw err

        // Disconnect the client
        client.end(function (err) {
          if (err) throw err
        })

        // Check if any rows are returned
        if (result.rows.length > 0) {
          return res.send(result.rows[0])
        } else {
          return res.send({'status': 'error', 'message': 'User not found'})
        }
      })
    })
  }
})

/* ---------------------------------
 * END POINT ESA DATA REQUEST
 * ---------------------------------
 */
app.post('/ESA_Request', function (req, res) {
  let body = req.body
  let params = nrs.getParamObj(body.form, body.geom)
  let esaString = nrs.getESAString(params)

  request.get(esaString, {auth: credentials}, function (error, response, result) {
    if (!error && response.statusCode === 200) {
      return res.send(nrs.makeSense(JSON.parse(result)))
    } else {
      return res.send({
        status: 'error',
        message: 'could not connect to ESA'
      })
    }
  })
})

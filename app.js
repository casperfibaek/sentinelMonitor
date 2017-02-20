const pg = require('pg')
const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')
const path = require('path')
const users = require('./users/connection')
const connectionString = users
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

app.listen(3000, function () {
  console.log('The Sentinel Monitor API has been started')
})

/* GET home page. */
app.get('/', function (req, res, next) {
  res.sendFile(path.join(__dirname, '/interface/index.html'))
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

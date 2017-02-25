const express = require('express')
const pg = require('pg')
const database = require('./database.js')
const connectionString = database.connectionString
const bcrypt = require('bcrypt-nodejs')
const uuid = require('uuid/v1')
const router = express.Router()

// crypt users
var passwordHash = function (password) {
  return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null)
}
var validPassword = function (password, hash) {
  return bcrypt.compareSync(password, hash)
}

/* ---------------------------------
 * END POINTS FOR USER AUTHENTICATION
 * ---------------------------------
 */

var createSession = function (user) {
  let client = new pg.Client(connectionString)
  let generatedUUID = uuid()
  let dbReq = `INSERT INTO trigsessions (sessionID, username, password, created_on) VALUES ('${generatedUUID}', '${user.username}', '${user.password}', NOW())`
  client.connect(function (err) {
    if (err) console.log(err)

    // Query the database
    client.query(dbReq, function (err, result) {
      if (err) console.log(err)

      console.log('created session')

      // Disconnect the client
      client.end(function (err) {
        if (err) console.log(err)
      })

      return generatedUUID
    })
  })
}

// CREATE USER
router.post('/api/createUser', function (req, res) {
  if (!req.body.username) {
    return res.send({
      'status': 'error', 'message': 'No username specified'
    })
  } else if (!req.body.password) {
    return res.send({
      'status': 'error', 'message': 'No password specified'
    })
  } else {
    let user = {
      'username': req.body.username,
      'password': passwordHash(req.body.password)
    }
    // Open a connection to the user database
    let client = new pg.Client(connectionString)
    // SQL Request for the database
    let userRequest = `SELECT * FROM trigusers WHERE username = '${user.username}'`

    client.connect(function (err) {
      if (err) throw err

      // Query the database
      client.query(userRequest, function (err, result) {
        if (err) throw err

        // Check if user already exists
        if (result.rows.length > 0) {
          // Disconnect the client
          client.end(function (err) {
            if (err) throw err
          })

          return res.send({'status': 'error', 'message': 'Username already exists'})
        } else {
          let userCreation = `INSERT INTO trigusers (username, password, created_on, last_login) VALUES ('${user.username}', '${user.password}', NOW(), NOW()) `

          // Query the database
          client.query(userCreation, function (err, result) {
            if (err) throw err

            res.send({
              'status': 'success',
              'message': String(createSession(user))
            })
          })

          // Disconnect the client
          client.end(function (err) {
            if (err) throw err
          })
        }
      })
    })
  }
})

// Authenticate User
router.post('/api/auth', function (req, res) {
  if (!req.body.username) {
    return res.send({
      'status': 'error', 'message': 'Invalid username'
    })
  } else if (!req.body.password) {
    return res.send({
      'status': 'error', 'message': 'Invalid password'
    })
  } else {
    let user = {
      'username': req.body.username,
      'password': req.body.password
    }

    // Open a connection to the user database
    let client = new pg.Client(connectionString)
    // SQL Request for the database
    var dbRequest = `SELECT * FROM trigusers WHERE username = '${user.username}'`

    // Connect to our database
    client.connect(function (err) {
      if (err) throw err

      // Query the database
      client.query(dbRequest, function (err, result) {
        if (err) throw err

        // Check if any rows are returned
        if (result.rows.length > 0) {
          var reply = result.rows[0]

          if (validPassword(user.password, reply.password) === true) {
            let updateLogin = `UPDATE trigusers SET last_login = NOW() WHERE username = '${user.username}'`

            client.query(updateLogin, function (err, result) {
              if (err) throw err
            })

            var sessionUser = {
              'username': reply.username,
              'password': reply.password
            }

            // Disconnect the client
            client.end(function (err) {
              if (err) throw err
            })

            return res.send({
              'status': 'success',
              'message': String(createSession(sessionUser))
            })
          } else {
            // Disconnect the client
            client.end(function (err) {
              if (err) throw err
            })

            return res.send({'status': 'error', 'message': 'username or password invalid (err 1)'})
          }
        } else {
          // Disconnect the client
          client.end(function (err) {
            if (err) throw err
          })
          return res.send({'status': 'error', 'message': 'username or password invalid (err 2)'})
        }
      })
    })
  }
})

module.exports = router

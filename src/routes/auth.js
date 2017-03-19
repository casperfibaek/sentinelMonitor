const express = require('express')
const database = require('./database')
const connectionString = database.connectionString
const errMsg = require('./errorMessages')
const bcrypt = require('bcrypt')
const router = express.Router()
const pg = require('pg')

router.get('/auth/logout', function (req, res, next) {
  req.session.destroy()
  res.redirect('/')
  console.log('session destroyed')
})

router.post('/auth/login', function (req, res) {
  var client = new pg.Client(connectionString)
  var user = {
    'username': req.body.username || 'undefined',
    'password': req.body.password || 'undefined',
    'session': req.body.session || 'undefined'
  }

  if (user.username === 'undefined' || user.password === 'undefined' || user.session === 'undefined') {
    return res.status(200).json({
      'status': 'error',
      'message': 'session key or username invalid (here)'
    })
  }

  client.connect(function (err) {
    if (err) { errMsg.serverError(err, res) }

    // Query the database
    var request = `
      SELECT * FROM users
      WHERE username = '${user.username}';`

    client.query(request, function (err, result) {
      if (err) { errMsg.queryError(err, res) }

      if (result.rowCount === 0) {
        errMsg.endConnection(client, err, res)

        return res.status(200).json({
          'status': 'error',
          'message': 'Invalid user or password',
          'total': result
        })
      } else {
        bcrypt.compare(user.password, result.rows[0].password, function (err, check) {
          if (err) {
            console.log(err)
            return res.status(200).json({'status': 'error', 'message': 'error hashing'})
          }

          if (check === true) {
            var request = `
            UPDATE users SET
              session_id = '${user.session}',
              last_login = NOW()
            WHERE username = '${user.username}';

            SELECT * FROM users
            WHERE username = '${user.username}';`

            client.query(request, function (err, result) {
              if (err) { errMsg.queryError(err, res) }

              console.log(`${user.username} logged in`)
              return res.status(200).json({
                'status': 'success',
                'message': result.rows[0]
              })
            })
          } else {
            return res.status(200).json({
              'status': 'error',
              'message': 'Invalid user or password'
            })
          }
        })
      }
    })
  })
})

router.post('/auth/signup', function (req, res) {
  var client = new pg.Client(connectionString)
  var user = {
    'username': req.body.username || 'undefined',
    'email': req.body.email || 'undefined',
    'session': req.body.session || 'undefined'
  }

  if (user.projectname === 'undefined' || user.startdate === 'undefined' || user.geom === 'undefined') {
    return res.status(200).json({
      'status': 'error',
      'message': 'session key or username invalid (here)'
    })
  }

  bcrypt.hash(req.body.password, 8, function (err, hash) {
    if (err) {
      console.log(err)
      return res.status(200).json({'status': 'error', 'message': 'error hashing'})
    }
    user.password = hash
  })

  client.connect(function (err) {
    if (err) { errMsg.serverError(err, res) }

    var request = `
    SELECT * FROM users
    WHERE username = '${user.username}' OR email = '${user.email}';`

    client.query(request, function (err, result) {
      if (err) { errMsg.queryError(err, res) }

      if (result.rowCount > 0) {
        errMsg.endConnection(client, err, res)

        return res.status(200).json({
          'status': 'error',
          'message': 'User or email invalid',
          'total': result
        })
      } else {
        var request = `
        INSERT INTO users (username, password, email, created_on, last_login, session_id)
        VALUES ('${user.username}', '${user.password}', '${user.email}', NOW(), NOW(), '${user.session}');

        SELECT * FROM users
        WHERE username = '${user.username}' AND password = '${user.password}';`

        client.query(request, function (err, result) {
          if (err) { errMsg.queryError(err, res) }

          errMsg.endConnection(client, err, res)

          return res.status(200).json({
            'status': 'success',
            'message': result
          })
        })
      }
    })
  })
})

router.post('/auth/session', function (req, res) {
  var session = req.body.session || 'undefined'
  if (session === 'undefined' || session === 'NULL') {
    return res.status(200).json({
      'status': 'error',
      'message': 'session key invalid'
    })
  }

  var client = new pg.Client(connectionString)
  client.connect(function (err) {
    if (err) { errMsg.serverError(err, res) }

    var request = `SELECT * FROM users WHERE session_id = '${session}';`

    client.query(request, function (err, result) {
      if (err) { errMsg.queryError(err, res) }

      errMsg.endConnection(client, err, res)

      if (result.rowCount > 0) {
        return res.status(200).json({
          'status': 'success',
          'username': result.rows[0].username,
          'session': result.rows[0].session_id,
          'message': result
        })
      } else {
        return res.status(200).json({'status': 'error', 'message': result})
      }
    })
  })
})

module.exports = router

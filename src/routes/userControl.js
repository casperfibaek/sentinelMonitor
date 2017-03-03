const express = require('express')
const database = require('./database.js')
const connectionString = database.connectionString
const bcrypt = require('bcrypt')
const router = express.Router()
const pg = require('pg')

router.post('/api/login', function (req, res) {
  var client = new pg.Client(connectionString)
  var user = {
    'username': req.body.username,
    'password': req.body.password,
    'session': req.body.session
  }

  client.connect(function (err) {
    if (err) {
      return res.status(500).json({
        'status': 'error',
        'message': err
      })
    }

    // Query the database
    var request = `
      SELECT * FROM trig_users
      WHERE username = '${user.username}';`

    client.query(request, function (err, result) {
      if (err) {
        return res.status(500).json({
          'status': 'error',
          'message': err
        })
      }

      if (result.rowCount === 0) {
        client.end(function (err) {
          if (err) {
            return res.status(500).json({
              'status': 'error',
              'message': err
            })
          }
        })

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
            UPDATE trig_users SET
            session_created = NOW(),
            session_expires = TIMESTAMP 'tomorrow',
            session_id = '${user.session}',
            last_login = NOW()
            WHERE username = '${user.username}';

            SELECT * FROM trig_users
            WHERE username = '${user.username}';`

            client.query(request, function (err, result) {
              if (err) {
                return res.status(500).json({
                  'status': 'error',
                  'message': err
                })
              }

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

router.post('/api/signup', function (req, res) {
  var client = new pg.Client(connectionString)
  var user = {
    'username': req.body.username,
    'email': req.body.email
  }

  bcrypt.hash(req.body.password, 8, function (err, hash) {
    if (err) {
      console.log(err)
      return res.status(200).json({'status': 'error', 'message': 'error hashing'})
    }
    user.password = hash
  })

  client.connect(function (err) {
    if (err) {
      return res.status(500).json({
        'status': 'error',
        'message': err
      })
    }

    var request = `
    SELECT * FROM trig_users
    WHERE username = '${user.username}' OR email = '${user.email}'`

    client.query(request, function (err, result) {
      if (err) {
        console.log(err)
        return res.status(500).json({
          'status': 'error',
          'message': err
        })
      }

      if (result.rowCount > 0) {
        client.end(function (err) {
          if (err) {
            console.log(err)
            return res.status(500).json({
              'status': 'error',
              'message': err
            })
          }
        })

        return res.status(200).json({
          'status': 'error',
          'message': 'User or email invalid',
          'total': result
        })
      } else {
        var request = `
        INSERT INTO trig_users (
          username,
          password,
          email,
          created_on,
          last_login,
          session_id,
          session_created,
          session_expires)
        VALUES (
          '${user.username}',
          '${user.password}',
          '${user.email}',
          NOW(),
          NOW(),
          '${user.session}',
          NOW(),
          TIMESTAMP 'tomorrow');

        SELECT * FROM trig_users
        WHERE username = '${user.username}' AND password = '${user.password}';`

        client.query(request, function (err, result) {
          if (err) {
            console.log(err)
            return res.status(500).json({
              'status': 'error',
              'message': err
            })
          }

          client.end(function (err) {
            if (err) {
              console.log(err)
              return res.status(500).json({
                'status': 'error',
                'message': err
              })
            }
          })

          return res.status(200).json({
            'status': 'success',
            'message': result
          })
        })
      }
    })
  })
})

router.post('/api/session', function (req, res) {
  var session = req.body.session
  var client = new pg.Client(connectionString)

  if (session === 'undefined' || session === 'NULL') {
    return res.status(200).json({
      'status': 'error',
      'message': 'session key invalid'
    })
  }

  client.connect(function (err) {
    if (err) {
      return res.status(500).json({
        'status': 'error',
        'message': err
      })
    }

    var request = `
    SELECT * FROM trig_users WHERE session_id = '${session}'`

    client.query(request, function (err, result) {
      if (err) {
        return res.status(500).json({
          'status': 'error',
          'message': err
        })
      }

      client.end(function (err) {
        if (err) {
          console.log(err)
          return res.status(500).json({
            'status': 'error',
            'message': err
          })
        }
      })

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

router.post('/api/siteOverview', function (req, res) {
  var cookie = req.body.cookie
  var user = {
    username: cookie.username,
    session: cookie.session
  }

  var client = new pg.Client(connectionString)

  if (user.session === 'undefined' || user.username === 'NULL') {
    return res.status(200).json({
      'status': 'error',
      'message': 'session key or username invalid'
    })
  }

  client.connect(function (err) {
    if (err) {
      return res.status(500).json({
        'status': 'error',
        'message': err
      })
    }

    var request = `
    SELECT UNNEST(sites) FROM trig_users
    WHERE username = '${user.username}' AND session_id = '${user.session}'`

    client.query(request, function (err, result) {
      if (err) {
        return res.status(500).json({
          'status': 'error',
          'message': err
        })
      }

      client.end(function (err) {
        if (err) {
          console.log(err)
          return res.status(500).json({
            'status': 'error',
            'message': err
          })
        }
      })

      if (result.rowCount > 0) {
        var arr = []
        for (var i = 0; i < result.rows.length; i += 1) {
          arr.push(Number(result.rows[i].unnest))
        }

        return res.status(200).json({
          'status': 'success',
          'message': result,
          'sites': arr
        })
      } else {
        return res.status(200).json({'status': 'error', 'message': result})
      }
    })
  })
})

  // SELECT UNNEST(sites) FROM trig_users WHERE username = 'casperfibaek' AND session_id = '82h-1X0HQQWX_cKL99DKZ1XVa127a83G'

  // update whole array
  // UPDATE trig_users SET sites = '{1, 3, 5}'
  // WHERE username = 'casperfibaek';

  // select from array
  // OBS indeces start at one not zero
  // SELECT sites[2] FROM trig_users WHERE username = 'casperfibaek'

  // select all users that has a site
  // SELECT * FROM trig_users WHERE '5' = ANY(sites)

  // select sites as rows that match username
  // select unnest(sites) from trig_users WHERE username = 'casperfibaek'

  // APPEND TO ARRAY =
  // UPDATE trig_users
  // SET sites = array_append(sites, '9')
  // WHERE username = 'casperfibaek'

  // REMOVE FROM ARRAY =
  // UPDATE trig_users SET sites = array_remove(sites, '9') WHERE username = 'casperfibaek'

module.exports = router

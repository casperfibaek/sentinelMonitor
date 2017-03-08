const express = require('express')
const database = require('./database')
const turf = require('turf')
const utc = require('./utc')
const connectionString = database.connectionString
const bcrypt = require('bcrypt')
const router = express.Router()
const pg = require('pg')

router.post('/api/login', function (req, res) {
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
    if (err) { db.serverError(err, res) }

    // Query the database
    var request = `
      SELECT * FROM trig_users
      WHERE username = '${user.username}';`

    client.query(request, function (err, result) {
      if (err) { db.queryError(err, res) }

      if (result.rowCount === 0) {
        db.endConnection(client, err, res)

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
              if (err) { db.queryError(err, res) }

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
    if (err) { db.serverError(err, res) }

    var request = `
    SELECT * FROM trig_users
    WHERE username = '${user.username}' OR email = '${user.email}';`

    client.query(request, function (err, result) {
      if (err) { db.queryError(err, res) }

      if (result.rowCount > 0) {
        db.endConnection(client, err, res)

        return res.status(200).json({
          'status': 'error',
          'message': 'User or email invalid',
          'total': result
        })
      } else {
        var request = `
        INSERT INTO trig_users (username, password, email, created_on, last_login, session_id, session_created, session_expires)
        VALUES ('${user.username}', '${user.password}', '${user.email}', NOW(), NOW(), '${user.session}', NOW(), TIMESTAMP 'tomorrow');

        SELECT * FROM trig_users
        WHERE username = '${user.username}' AND password = '${user.password}';`

        client.query(request, function (err, result) {
          if (err) { db.queryError(err, res) }

          db.endConnection(client, err, res)

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
  var session = req.body.session || 'undefined'
  if (session === 'undefined' || session === 'NULL') {
    return res.status(200).json({
      'status': 'error',
      'message': 'session key invalid'
    })
  }

  var client = new pg.Client(connectionString)
  client.connect(function (err) {
    if (err) { db.serverError(err, res) }

    var request = `SELECT * FROM trig_users WHERE session_id = '${session}';`

    client.query(request, function (err, result) {
      if (err) { db.queryError(err, res) }

      db.endConnection(client, err, res)

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

router.post('/api/fetchUserSites', function (req, res) {
  var user = {
    username: req.body.username || 'undefined',
    session: req.body.session || 'undefined'
  }

  if (user.session === 'undefined' || user.username === 'undefined') {
    return res.status(200).json({
      'status': 'error',
      'message': 'session key or username invalid'
    })
  }

  var client = new pg.Client(connectionString)
  client.connect(function (err) {
    if (err) { db.serverError(err, res) }

    var request = `
    SELECT sitename, latest_image, latest_image_uuid, identifier, thumbnail, timezone
    FROM (
      SELECT
        UNNEST(trig_users.sites) AS arr_sitename,
        trig_sites.latest_image AS latest_image,
        trig_sites.latest_image_uuid AS latest_image_uuid,
        trig_sites.sitename AS sitename,
        trig_sites.timezone AS timezone,
        trig_users.username AS username,
        trig_users.session_id AS session_id,
        trig_images.identifier as identifier,
        trig_images.link_thumb as thumbnail,
        trig_images.image_uuid as image_uuid
      FROM trig_sites, trig_users, trig_images
    ) AS b
    WHERE arr_sitename = sitename
    AND latest_image_uuid = image_uuid
    AND username = '${user.username}'
    AND session_id = '${user.session}';`

    client.query(request, function (err, result) {
      if (err) { db.queryError(err, res) }

      db.endConnection(client, err, res)

      if (result || result.rowCount > 0) {
        return res.status(200).json({
          'status': 'success',
          'message': result.rows
        })
      } else if (result.rowCount === 0) {
        return res.status(200).json({'status': 'error', 'message': 'User has no sites'})
      }
    })
  })
})

router.post('/api/createUserSite', function (req, res) {
  var project = req.body

  if (project.projectname === 'undefined' || project.startdate === 'undefined' || project.geom === 'undefined' ||
      project.satellites === 'undefined' || project.user === 'undefined') {
    return res.status(200).json({
      'status': 'error',
      'message': 'session key or username invalid (here)'
    })
  }

  var center = turf.centroid(JSON.parse(project.geom))
  var timezone
  for (var i = 0; i < utc.features.length; i += 1) {
    if (turf.inside(center, utc.features[i]) === true) {
      timezone = utc.features[i].properties.zone
    }
  }

  // first we verify the user
  var client = new pg.Client(connectionString)
  client.connect(function (err) {
    if (err) { db.serverError(err, res) }

    var request = `SELECT * FROM trig_users WHERE session_id = '${project.user.session}';`

    client.query(request, function (err, result) {
      if (err) { db.queryError(err, res) }

      if (result.rowCount > 0) {
        checkUnique(function () { createSites() })
      } else {
        db.endConnection(client, err, res)
        return res.status(200).json({'status': 'error', 'message': result})
      }
    })
  })

  var checkUnique = function (callback) {
    var request = `
      SELECT * FROM trig_sites
      WHERE sitename = '${project.projectname}' AND username = '${project.user.username}';
    `
    client.query(request, function (err, result) {
      if (err) { db.queryError(err, res) }

      if (result.rowCount > 0) {
        db.endConnection(client, err, res)

        return res.status(200).json({
          'status': 'error',
          'message': 'please choose a unique name'
        })
      } else {
        callback()
      }
    })
  }

  var createSites = function () {
    var request = `
    INSERT INTO trig_sites (
      sitename,
      geom,
      platform,
      username,
      startdate,
      created_on,
      timezone
    ) VALUES (
      '${project.projectname}',
      '${project.geom}',
      'Sentinel-2',
      '${project.user.username}',
      '${project.startdate}',
      NOW(),
      ${timezone}
    );

    UPDATE trig_users SET sites = array_append(sites, '${project.projectname}')
    WHERE username = '${project.user.username}' AND session_id = '${project.user.session}';

    SELECT * FROM trig_sites
    WHERE sitename = '${project.projectname}' AND username = '${project.user.username}';
    `
    client.query(request, function (err, result) {
      if (err) { db.queryError(err, res) }

      db.endConnection(client, err, res)

      return res.status(200).json({
        'status': 'success',
        'message': result
      })
    })
  }
})

router.post('/api/postEsaImages', function (req, res) {
  var cookie = req.body.cookie
  var user = {
    username: cookie.username || 'undefined',
    session: cookie.session || 'undefined'
  }

  var images = req.body.images || 'undefined'

  if (user.session === 'undefined' || user.username === 'undefined') {
    return res.status(200).json({
      'status': 'error',
      'message': 'session key or username invalid'
    })
  }

  if (images === 'undefined') {
    return res.status(200).json({
      'status': 'error',
      'message': 'Image array invalid'
    })
  }

  var client = new pg.Client(connectionString)
  client.connect(function (err) {
    if (err) { db.serverError(err, res) }

    var request = `
    SELECT * FROM trig_users
    WHERE username = '${user.username}' AND session_id = '${user.session}';`

    client.query(request, function (err, result) {
      if (err) { db.queryError(err, res) }

      db.endConnection(client, err, res)

      if (result.rowCount > 0) {
        return res.status(200).json({
          'status': 'success',
          'message': images
        })
      } else if (result.rowCount === 0) {
        return res.status(200).json({'status': 'error', 'message': 'User has no sites'})
      }
    })
  })
})

router.post('/api/deleteSite', function (req, res) {
  if (
    typeof (req.body.username) === 'undefined' ||
    typeof (req.body.session) === 'undefined' ||
    typeof (req.body.site) === 'undefined'
  ) {
    return res.status(200).json({
      'status': 'error',
      'message': 'invalid delete request'
    })
  }

  var userRequest = {
    'username': req.body.username,
    'session': req.body.session,
    'site': req.body.site
  }

  var client = new pg.Client(connectionString)
  client.connect(function (err) {
    if (err) { db.serverError(err, res) }

    var request = `
    UPDATE trig_users SET sites = array_remove(sites, '${userRequest.site}')
    WHERE username = '${userRequest.username}' AND session_id = '${userRequest.session}';

    DELETE FROM trig_sites
    WHERE sitename = '${userRequest.site}' AND username = '${userRequest.username}';
    `

    client.query(request, function (err, result) {
      if (err) { db.queryError(err, res) }

      db.endConnection(client, err, res)

      return res.status(200).json({
        'status': 'success',
        'message': `${userRequest.site} deleted`
      })
    })
  })
})

router.post('/api/getSite', function (req, res) {
  if (typeof (req.body.username) === 'undefined' || typeof (req.body.site) === 'undefined') {
    return res.status(200).json({
      'status': 'error',
      'message': 'invalid delete request'
    })
  }

  var userRequest = {
    'username': req.body.username,
    'site': req.body.site
  }

  var client = new pg.Client(connectionString)
  client.connect(function (err) {
    if (err) { db.serverError(err, res) }

    var request = `
    SELECT
      sitename,
      image_uuid,
      link_main,
      link_alt,
      link_thumb,
      clouds,
      footprint,
      sun_altitude,
      sun_azimuth,
      identifier,
      platformname,
      platform_id,
      time_begin,
      time_end,
      time_ingestion
    FROM (
      SELECT
        UNNEST(trig_sites.images) AS sites_images,
        trig_sites.sitename AS sitename,
        trig_sites.username AS username,
        trig_images.image_uuid AS image_uuid,
        trig_images.link_main AS link_main,
        trig_images.link_alt AS link_alt,
        trig_images.link_thumb AS link_thumb,
        trig_images.clouds AS clouds,
        trig_images.footprint AS footprint,
        trig_images.sun_altitude AS sun_altitude,
        trig_images.sun_azimuth AS sun_azimuth,
        trig_images.identifier AS identifier,
        trig_images.platformname AS platformname,
        trig_images.platform_id AS platform_id,
        trig_images.time_begin AS time_begin,
        trig_images.time_end AS time_end,
        trig_images.time_ingestion AS time_ingestion
      FROM trig_sites, trig_images
    ) AS b
    WHERE sites_images = image_uuid
    AND username = '${userRequest.username}'
    AND sitename = '${userRequest.site}'
    ORDER BY time_begin DESC
    `

    client.query(request, function (err, result) {
      if (err) { db.queryError(err, res) }

      db.endConnection(client, err, res)

      return res.status(200).json({
        'status': 'success',
        'message': result.rows
      })
    })
  })
})

var db = {
  endConnection: function (client, err, res) {
    client.end(function (err) {
      if (err) {
        console.log(err)
        return res.status(500).json({
          'status': 'error',
          'message': err
        })
      }
    })
  },
  queryError: function (err, res) {
    console.log('Error while querying database: ', err)
    return res.status(500).json({
      'status': 'error',
      'message': err
    })
  },
  serverError: function (err, res) {
    console.log('Error while connecting to database: ', err)
    return res.status(500).json({
      'status': 'error',
      'message': err
    })
  }
}

  // Create array
  // text[]

  // NEWEST ENTRY
  // SELECT * FROM trig_images
  // ORDER BY time_begin DESC LIMIT 1

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

  // EMPTY ARRAY
  // UPDATE trig_users SET sites = '{}' WHERE username = 'casperfibaek'

  // DELETE all
  // UPDATE trig_users SET sites = '{}' WHERE username = 'casperfibaek';
  // DELETE FROM trig_sites WHERE username = 'casperfibaek';
  // DELETE FROM trig_images;
  // DELETE FROM trig_users WHERE username != 'casperfibaek';

module.exports = router

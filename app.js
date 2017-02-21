const path = require('path')
const request = require('request')
const fs = require('fs')
const pg = require('pg')
const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')
const users = require('./users/connection')
const nrs = require('./methods/baseAPI')
const connectionString = users.connectionString
const credentials = users.credentials.secondary
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

app.listen(3000, function () {
  console.log('The Sentinel Monitor API has been started')
})

/* ---------------------------------
 * END POINT FOR USER AUTHENTICATION
 * ---------------------------------
 */
app.post('/account', function (req, res) {
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
      username: req.body.username,
      password: req.body.password
    }

    // Open a connection to the user database
    let client = new pg.Client(connectionString)
    // SQL Request for the database
    var dbRequest = `SELECT * FROM trigusers WHERE username = '${user.username}' AND password = '${user.password}'`

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
  // let login = body.user

  request.get(esaString, {
    'auth': credentials,
    'timeout': 900000,
    'gzip': true
  }, function (error, response, result) {
    if (!error && response.statusCode === 200) {
      let ESAreply = JSON.parse(result) // STRING --> json
      let aoi = nrs.toGeoJSON(body.geom) // WKT --> GeoJSON0

      // Format the ESA reply to Humanreadable JSON
      let sense = nrs.makeSense(ESAreply, aoi)

      // Open a connection to the user database
      let client = new pg.Client(connectionString)

      // Connect to our database
      client.connect(function (err) {
        if (err) throw err

        const totalImages = sense.images.length
        let uploaded = 0

        for (let i = 0; i < sense.images.length; i++) {
          let curr = sense.images[i]
          let thumb = curr.thumbnail.href
          let imgID = curr.information.identifier + '-ql'

          request.get(thumb, {auth: credentials})
            .on('error', function (err) {
              console.log(err)
            })
            .pipe(fs.createWriteStream(`./public/thumbs/${imgID}.jpeg`))

            // SQL Request for the database
          let dbInsert = `INSERT INTO trigprojects (
            geomfootprint,
            userid,
            alternativelink,
            clouds,
            cover,
            datebegin,
            dateend,
            dateingestion,
            primarylink,
            geomintersect,
            sunaltitude,
            sunazimuth,
            filename,
            identifier,
            platformname,
            platformident,
            producttype,
            imageuuid)
            VALUES (
              '${JSON.stringify(curr.footprint)}',
               1,
              '${curr.alternativeLink.href.replace(/'/g, "''")}',
               ${curr.clouds},
               ${curr.cover},
              '${curr.date.beginposition}',
              '${curr.date.endposition}',
              '${curr.date.ingestiondate}',
              '${curr.link.href.replace(/'/g, "''")}',
              '${JSON.stringify(curr.intersection.geom)}',
               ${curr.sunAngle.altitude},
               ${curr.sunAngle.azimuth},
              '${curr.information.filename}',
              '${curr.information.identifier}',
              '${curr.information.platformname}',
              '${curr.information.platformserialidentifier}',
              '${curr.information.producttype}',
              '${curr.information.uuid}'
            )`

          // Query the database
          client.query(dbInsert, function (err, result) {
            console.log(result)
            if (err) throw err

            // disconnect if done
            uploaded += 1
            if (uploaded === totalImages) {
              client.end(function (err) {
                if (err) throw err
              })
            }
          })
        }
      }
    )
      return res.status(200).json(sense)
    } else {
      return res.status(500).json({
        status: 'error',
        message: 'could not connect to ESA'
      })
    }
  })
})

/* ------------------------------
 * END POINT FOR IMAGES
 * -----------------------------
 */
app.get('/images/:imageID', function (req, res) {
  let imgID = req.param('imageID')
  res.sendFile(`./public/thumbs/${imgID}.jpeg`)
})

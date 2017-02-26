const express = require('express')
const request = require('request')
const fs = require('fs')
const pg = require('pg')

const nrs = require('./methods/baseAPI')
const database = require('./database.js')
const connectionString = database.connectionString
const credentials = database.credentials.secondary
const router = express.Router()

/* ---------------------------------
 * END POINT ESA DATA REQUEST
 * ---------------------------------
 */
router.post('/api/createSite', function (req, res) {
  let body = req.body
  let params = nrs.getParamObj(body.form, body.geom)
  let esaString = nrs.getESAString(params)
  let uuid = body.uuid

  let site = {
    'geom': body.geom,
    'name': body.name
  }

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

      let totalImages = sense.images.length
      let uploaded = 0
      let imagesToAddToSites = []

      // Open a connection to the user database
      let client = new pg.Client(connectionString)

      // Connect to our database
      client.connect(function (err) {
        if (err) throw err

        // create the site
        let createSiteSQL = `INSERT INTO trigsites (sitename, geom, created_on, images) VALUES ('${site.name}', '${JSON.stringify(aoi)}', NOW(), '[]')`
        client.query(createSiteSQL, function (err, result) {
          if (err) throw err
          console.log(`created site with sitename: ${site.name}`)
          let getSiteIDSQL = `SELECT * FROM trigsites ORDER BY siteid DESC LIMIT 1`
          client.query(getSiteIDSQL, function (err, result) {
            if (err) throw err
            site.id = Number(result.rows[0].siteid)
            console.log(`site recieved id: ${site.id}`)

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
                // TODO CHANGE TO trigimages
              let dbInsert = `INSERT INTO trigprojects (
                geomfootprint,
                userid,
                alternativelink,
                clouds,
                datebegin,
                dateend,
                dateingestion,
                primarylink,
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
                  '${curr.date.beginposition}',
                  '${curr.date.endposition}',
                  '${curr.date.ingestiondate}',
                  '${curr.link.href.replace(/'/g, "''")}',
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
                if (err) throw err
                imagesToAddToSites.push(curr.information.uuid)

                // disconnect if done
                uploaded += 1
                if (uploaded === totalImages) {
                  let updateSiteSQL = `SELECT * FROM trigsites WHERE siteid = ${site.id}`
                  client.query(updateSiteSQL, function (err, result) {
                    if (err) throw err
                    var currSiteImages = JSON.parse(result.rows[0].images)

                    for (var i = 0; i < imagesToAddToSites.length; i++) {
                      currSiteImages.push(imagesToAddToSites[i])
                    }

                    let insertSiteSQL = `UPDATE trigsites SET images = '${JSON.stringify(currSiteImages)}' WHERE siteid = ${site.id}`
                    client.query(insertSiteSQL, function (err, result) {
                      if (err) throw err

                      // update the user with the new site
                      let findUUID = `SELECT * FROM trigusers WHERE user_uuid = '${uuid}'`
                      client.query(findUUID, function (err, result) {
                        if (err) throw err
                        var sites = JSON.parse(result.rows[0].sites)
                        sites.push(site.id)
                        var strSites = JSON.stringify(sites)

                        // replace uuid arr
                        let updateUUID = `UPDATE trigusers SET sites = '${strSites}' WHERE user_uuid = '${uuid}'`
                        client.query(updateUUID, function (err, result) {
                          if (err) throw err

                          console.log(`updated ${uuid} with sites: ${sites}`)

                          client.end(function (err) {
                            if (err) throw err
                          })

                          return res.status(200).json({
                            'status': 'success',
                            'message': sense,
                            'siteID': site.id
                          })
                        })
                      })
                    })
                  })
                }
              })
            }
          })
        })
      })
    } else {
      return res.status(500).json({
        status: 'error',
        message: 'could not connect to ESA'
      })
    }
  })
})

module.exports = router

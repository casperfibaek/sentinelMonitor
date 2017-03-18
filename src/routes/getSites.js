const express = require('express')
const router = express.Router()
const external = require('./external.js')
// const database = require('./database.js')
// const credentials = database.credentials.main
// const connectionString = database.connectionString
// const pg = require('pg')

router.post('/api/fetch', function (req, res) {
  var post = req.body
  external(post, function (result) { res.status(200).json(result) })

  // console.log(external(post))
})

// var insertImages = function (res, arr, siteRequest) {
//   var client = new pg.Client(connectionString)
//   var imageCount = arr.length
//   var count = 0
//   var latest = 0
//   var latestUuid = ''
//
//   client.connect(function (err) {
//     if (err) { db.serverError(client, err, res) }
//
//     for (var i = 0; i < imageCount; i += 1) {
//       var image = arr[i]
//       var beginTime = arr[i].date.beginposition.after
//       var imageTime = new Date(Date.parse(beginTime + '+00:00')).getTime()
//       if (imageTime > latest) {
//         latest = imageTime
//         latestUuid = arr[i].info.uuid
//       }
//       var request = `
//       DO LANGUAGE plpgsql
//       $$
//       BEGIN
//         INSERT INTO trig_images (
//             image_uuid,
//             link_main,
//             link_alt,
//             link_thumb,
//             clouds,
//             footprint,
//             sun_altitude,
//             sun_azimuth,
//             identifier,
//             platformname,
//             platform_id,
//             time_begin,
//             time_end,
//             time_ingestion
//         ) VALUES (
//             '${image.info.uuid}',
//             '${image.link.replace(/'/g, "''")}',
//             '${image.altLink.replace(/'/g, "''")}',
//             '${image.thumbnail.replace(/'/g, "''")}',
//              ${image.clouds},
//             '${JSON.stringify(image.footprint)}',
//              ${image.sun.altitude},
//              ${image.sun.azimuth},
//             '${image.info.identifier}',
//             '${image.info.platformname}',
//             '${image.info.platformserialidentifier}',
//             '${image.date.beginposition.after}',
//             '${image.date.endposition.after}',
//             '${image.date.ingestiondate.after}'
//         );
//
//         UPDATE trig_sites SET
//           images = array_append(images, '${image.info.uuid}'),
//           latest_image = '${new Date(latest).toISOString().replace('T', ' ').replace('Z', '')}',
//           latest_image_uuid = '${latestUuid}'
//         WHERE username = '${siteRequest.user.username}' AND sitename = '${siteRequest.projectname}';
//
//       EXCEPTION
//         WHEN unique_violation THEN
//         UPDATE trig_images SET image_uuid = '${image.info.uuid}' WHERE image_uuid = '${image.info.uuid}';
//
//       END;
//       $$;
//       `
//
//       client.query(request, function (err, result) {
//         if (err) {
//           db.queryError(client, err, res)
//         }
//
//         count += 1
//
//         if (count === imageCount) {
//           db.endConnection(client, err, res)
//           return res.status(200).json({
//             'status': 'success',
//             'message': `Prepared database`
//           })
//         }
//       })
//     }
//   })
// }
//
// var db = {
//   endConnection: function (client, err, res) {
//     client.end(function (err) {
//       if (err) {
//         console.log(err)
//         return res.status(500).json({
//           'status': 'error',
//           'message': err
//         })
//       }
//     })
//   },
//   queryError: function (client, err, res) {
//     console.log('Error while querying database: ', err)
//     this.endConnection(client, err, res)
//     return res.status(500).json({
//       'status': 'error',
//       'message': err
//     })
//   },
//   serverError: function (client, err, res) {
//     console.log('Error while connecting to database: ', err)
//     this.endConnection(client, err, res)
//     return res.status(500).json({
//       'status': 'error',
//       'message': err
//     })
//   }
// }

module.exports = router

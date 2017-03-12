const express = require('express')
const request = require('request')
const router = express.Router()

router.post('/api/landsat', function (req, res) {
  var arr = req.body.arr || 'undefined'
  console.log('arr: ' + arr)
  console.log('arr[0]: ' + arr[0])

  var getImages = function (arr) {  //eslint-disable-line
    var all = []
    var key = '4VMM8Rp44kR5KU1zkiHTuOS4PrYUbPel5ePfE114'
    var begin = '2016-06-01'
    var count1 = 0 //eslint-disable-line

    for (var i = 0; i < arr.length; i += 1) {
      var link = `https://api.nasa.gov/planetary/earth/assets?lon=${arr[i][0]}&lat=${arr[i][1]}&begin=${begin}&api_key=${key}`

      request({
        method: 'GET',
        uri: link
      }, function (error, response, body) {
        console.log(body)
        if (error) { console.log(error) }
        for (var j = 0; j < body.results.length; j += 1) {
          var post = body.results[j].id.split('/')[1]
          if (all.indexOf(post) === -1) {
            all.push(post)
          }
        }
        count1 += 1

        if (count1 === arr.length) {
          console.log('image list: ' + all)
          var retArr = []
          var count2 = 0

            var parseMeta = function (data) { //eslint-disable-line
              var retObj = {}

              var topics = [
                'METADATA_FILE_INFO',
                'PRODUCT_METADATA',
                'IMAGE_ATTRIBUTES'
              ]

              var meta = function (metadata, param) { //eslint-disable-line
                var start = metadata.indexOf(param)
                var end = metadata.lastIndexOf(param) + param.length
                var arr = metadata.slice(start, end)
                arr = arr.split('\n')
                arr.shift()
                arr.pop()

                var str = `{"${param}": {`
                for (var i = 0; i < arr.length; i += 1) {
                  var trim = arr[i].trim()
                  var pass

                  var key = trim.split('=')[0].trim()
                  var value = trim.split('=')[1].trim()

                  if (key === 'FILE_DATE' || key === 'DATE_ACQUIRED') {
                    pass = `"${key}": "${value}"`
                  } else if (isNaN(value) === true) {
                    pass = `"${key}": ${value}`
                  } else {
                    pass = `"${key}": ${value.replace(/"/g, '')}`
                  }

                  if (i !== arr.length - 1) {
                    pass += ', '
                  } else {
                    pass += '}}'
                  }

                  str += pass
                }

                return JSON.parse(str)
              }

              for (var i = 0; i < topics.length; i += 1) {
                Object.assign(retObj, meta(data, topics[i]))
              }

              return retObj
            }

          for (var i = 0; i < all.length; i += 1) {
            var id = all[i]
            var row = id.slice(3, 6)
            var path = id.slice(6, 9)

            var link = `http://landsat-pds.s3.amazonaws.com/L8/${row}/${path}/${id}/${id}_MTL.txt`

            request({
              url: link,
              function (error, response, body) {
                if (error) { console.log(error) }
                console.log(body)

                retArr.push(parseMeta(body))
                count2 += 1
                if (count2 === all.length) {
                  return res.status(200).json({message: retArr})
                }
              }
            })
          }
        }
      })
    }
  }
  getImages(arr)
})

module.exports = router

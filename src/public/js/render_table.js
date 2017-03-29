/* globals $ app turf L Image */
app.render.table = function (info) {
  // console.log('rendered: sites')
  var setup
  if (typeof (info) === 'undefined') {
    app.render.sites()
    console.log('error reading site information')
  } else {
    setup = `
      <div class='tableScreen'>
        <h2>${info.sitename}</h2>
        <div class="container">
          <div class="tableHolder">
            <table class="fixed_headers sortable">
              <thead>
                <tr class="tableHeaders">
                  <th name="time_local" sorted="down" title="Date of capture (Local)"><i class="fa fa-calendar" aria-hidden="true"></i></th>
                  <th name="time_local" sorted="down" title="Time of Capture (Local)"><i class="fa fa-clock-o" aria-hidden="true"></i></th>
                  <th name="clouds" sorted="down" title="Percent cloudcover"><i class="fa fa-cloud" aria-hidden="true"></i></th>
                  <th name="overlap" sorted="down" title="How much of the image overlaps the project area"><img src="css/images/overlap.png" /></th>
                  <th name="sun_altitude" sorted="down" title="Altitude of the sun (degrees)"><i class="fa fa-sun-o" aria-hidden="true"></i> al</th>
                  <th name="sun_azimuth" sorted="down" title="Azimuth of the sun (degrees)"><i class="fa fa-sun-o" aria-hidden="true"></i> az</th>
                  <th name="sat_name" sorted="down" title="The satellite that took the image"><img src="css/images/favicon_white.png" /></th>
                  <th name="main" sorted="down" title="Main download link"><i class="fa fa-link" aria-hidden="true"></i></th>
                </tr>
              </thead>
              <tbody></tbody>
            </table>
          </div>
          <div class="mapHolder">
            <div id="map"></div>
          </div>
        </div>
        <div class="buttonHolder">
          <input type="button" name="edit" class="button" value="Edit">
          <input type="button" name="export" class="button" value="Export">
          <input type="button" name="back" class="button" value="Back">
          <input type="button" name="filter" class="button" value="Filter">
          <input type="button" name="reset" class="button" value="Reset">
        </div>
      </div>
    `
    $('#app').empty().append(setup)
    $('#app').prepend(`<canvas id="viewport" width="auto" height="auto"></canvas>`)

    // window.location.hash = info.sitename
    var imgArray = info.images

    var round = function (num, roundTo) {
      return Math.round(num * Math.pow(10, roundTo)) / Math.pow(10, roundTo)
    }

    var isLandsat = function (id) {
      if (id.indexOf('LC8') === 0 && id.length === 21) { return true } else { return false }
    }

    var L8Index = function (id) {
      var path = id.slice(6, 9)
      var row = id.slice(3, 6)
      return `https://landsat-pds.s3.amazonaws.com/L8/${row}/${path}/${id}/index.html`
    }

    var L8Thumb = function (id) {
      var path = id.slice(6, 9)
      var row = id.slice(3, 6)
      return `http://landsat-pds.s3.amazonaws.com/L8/${row}/${path}/${id}/${id}_thumb_large.jpg`
    }

    var ESAIndex = function (id) {
      return `https://scihub.copernicus.eu/dhus/odata/v1/Products('${id}')/$value`
    }

    var projectGeom = JSON.parse(info.siteFootprint)
    var projectGeomArea = turf.area(projectGeom) || 100

    var map = L.map('map', {
      center: [ 55.3322691334024, 10.3491210937499 ],
      zoom: 6,
      maxZoom: 12,
      minZoom: 3,
      editable: true,
      zoomControl: false,
      attributionControl: false
    })

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors,' +
        '<a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>',
      maxZoom: 21,
      maxNativeZoom: 18
    }).addTo(map)

    var projectLayerStyle = {
      'weight': 2,
      'color': '#099c59',
      'fillOpacity': 0
    }

    var intersectionStyle = {
      'weight': 0,
      'fillColor': 'rgb(244, 67, 54)',
      'fillOpacity': 0.20
    }

    var footprintStyle = {
      'weight': 2.5,
      'color': 'rgb(244, 67, 54)',
      'fillOpacity': 0
    }

    var invisibleStyle = {
      'weight': 0,
      'opacity': 0,
      'fillOpacity': 0
    }

    var projectLayer = L.geoJSON(projectGeom, {style: projectLayerStyle}).addTo(map)
    map.fitBounds(projectLayer.getBounds({'padding': [250, 250]}))

    var footprintsGroup = L.featureGroup().addTo(map)

    var addRows = function (obj) {
      for (var i = 0; i < obj.length; i += 1) {
        var image = obj[i]

        var day = image.time_local.slice(0, 10)
        var hours = image.time_local.slice(11, 16)
        if (typeof image.footprint === 'string') { image.footprint = JSON.parse(image.footprint) }
        image.intersection = turf.intersect(image.footprint, projectGeom)

        // TODO: Figure out why i sometimes get images that dont overlap properly.
        // TODO: fix the hack below
        if (typeof image.intersection === 'undefined') { continue }

        image.overlap = (turf.area(image.intersection) / projectGeomArea) * 100
        if (isLandsat(image.image_uuid)) {
          image.link = L8Index(image.image_uuid)
        } else {
          image.link = ESAIndex(image.image_uuid)
        }

        var row = `
        <tr type="info" uuid="${image.image_uuid}">
          <td name="date" align="center">${day}</td>
          <td name="time" align="center">${hours}</td>
          <td name="clouds" align="right">${round(image.clouds, 2)}%</td>
          <td name="overlap" align="center">${round(image.overlap, 2)}%</td>
          <td name="sun_alt" align="right">${round(image.sun_altitude, 2)}\xB0</td>
          <td name="sun_azi" align="right">${round(image.sun_azimuth, 2)}\xB0</td>
          <td name="platform" align="center">${image.sat_name}</td>
          <td name="main" align="center">
            <a href="${image.link}" target="_blank">
              <i class="fa fa-external-link" aria-hidden="true"></i>
            </a>
          </td>
        </tr>
        `
        $('tbody').append(row)
        if (app.filter.indexOf(image.image_uuid) !== -1) { $(`tr[uuid="${image.image_uuid}"]`).hide() }
      }
      $('tr[type="info"]').click(function () {
        $('tr[type="info"]').removeClass('selected')
        $(this).addClass('selected')
        var uid = $(this).attr('uuid')
        footprintsGroup.eachLayer(function (layer) {
          footprintsGroup.removeLayer(layer)
        })
        var thisImage = imgArray.filter(function (fl) { return fl.image_uuid === uid })[0]
        var thisIntersection = L.geoJSON(thisImage.intersection, {style: intersectionStyle})
        var thisFootprint = L.geoJSON(thisImage.footprint, {style: footprintStyle})

        var lineOffset = 0
        thisFootprint.setStyle({dashArray: '5'})
        var loadingImage = setInterval(function () {
          thisFootprint.setStyle({dashOffset: String(lineOffset)})
          lineOffset += 1
          if (lineOffset === 10) { lineOffset = 0 }
        }, 100)

        footprintsGroup.addLayer(thisIntersection)
        footprintsGroup.addLayer(thisFootprint)
        footprintsGroup.addLayer(L.geoJSON(projectGeom, {style: invisibleStyle}))
        map.fitBounds(footprintsGroup.getBounds({'padding': [250, 250]}))

        var source
        if (isLandsat(uid)) { source = `/landsat?uuid=${L8Thumb(uid)}` } else { source = `/image?uuid=${uid}` }

        var canvas = document.getElementById('viewport')
        var context = canvas.getContext('2d')

        var img = new Image()
        img.crossOrigin = 'Anonymous'
        img.onload = function () {
          clearInterval(loadingImage)
          thisFootprint.setStyle({dashArray: '0', dashOffset: '0', weight: '0'})
          thisIntersection.setStyle({fillOpacity: '0'})

          $('#viewport').attr('height', img.height)
          $('#viewport').attr('width', img.width)

          context.drawImage(img, 0, 0, img.width, img.height)
          var canvasData = context.getImageData(0, 0, img.width, img.height)
          var pix = canvasData.data
          var cutoff = 10

          // remove black
          for (var i = 0, n = pix.length; i < n; i += 4) {
            if (pix[i] <= cutoff && pix[i + 1] <= cutoff && pix[i + 2] <= cutoff) {
              pix[i + 3] = 0
            }
          }

          context.putImageData(canvasData, 0, 0)
          var imageURL = canvas.toDataURL('image/png')
          var imageOverlay = L.imageOverlay(imageURL, thisFootprint.getBounds())
          footprintsGroup.addLayer(imageOverlay)
        }
        img.src = source
      })
    }
    addRows(imgArray)

    // Sort numbers
    $('th[name="clouds"], th[name="sun_altitude"], th[name="sun_azimuth"], th[name="overlap"]').click(function () {
      var self = $(this)
      var clicked = $(this).attr('name')
      var sorted = $(this).attr('sorted')

      imgArray.sort(function (a, b) {
        if (sorted === 'down') {
          $(self).attr('sorted', 'up')
          return a[clicked] - b[clicked]
        } else {
          $(self).attr('sorted', 'down')
          return b[clicked] - a[clicked]
        }
      })
      $('.fixed_headers > tbody').mCustomScrollbar('destroy')
      $('tr[type="info"]').remove()
      addRows(imgArray)
      $('.fixed_headers > tbody').mCustomScrollbar({ theme: 'light-thick' })
    })

    // Sort dates
    $('th[name="time_local"]').click(function () {
      var self = $(this)
      var clicked = $(this).attr('name')
      var sorted = $(this).attr('sorted')

      imgArray.sort(function (a, b) {
        if (sorted === 'down') {
          $(self).attr('sorted', 'up')
          return Date.parse(a[clicked]) - Date.parse(b[clicked])
        } else {
          $(self).attr('sorted', 'down')
          return Date.parse(b[clicked]) - Date.parse(a[clicked])
        }
      })
      $('.fixed_headers > tbody').mCustomScrollbar('destroy')
      $('tr[type="info"]').remove()
      addRows(imgArray)
      $('.fixed_headers > tbody').mCustomScrollbar({ theme: 'light-thick' })
    })
    // Sort strings
    $('th[name="sat_name"]').click(function () {
      var self = $(this)
      var clicked = $(this).attr('name')
      var sorted = $(this).attr('sorted')

      imgArray.sort(function (a, b) {
        var nameA = a[clicked].toLowerCase()
        var nameB = b[clicked].toLowerCase()
        if (sorted === 'down') {
          $(self).attr('sorted', 'up')
          if (nameA < nameB) { return -1 }
          if (nameA > nameB) { return 1 }
          return 0
        } else {
          $(self).attr('sorted', 'down')
          if (nameA < nameB) { return 1 }
          if (nameA > nameB) { return -1 }
          return 0
        }
      })

      $('.fixed_headers > tbody').mCustomScrollbar('destroy')
      $('tr[type="info"]').remove()
      addRows(imgArray)
      $('.fixed_headers > tbody').mCustomScrollbar({ theme: 'light-thick' })
    })

    $('.fixed_headers th').each(function (key) {
      var tdWidth = $('tr').last().children(`:eq(${key})`).width()
      $(this).css('width', `${tdWidth}px`)
    })

    $('.fixed_headers > tbody').mCustomScrollbar({
      theme: 'light-thick'
    })

    $('.tableScreen > .buttonHolder > input[name="back"]').click(function () {
      app.render.sites()
    })

    $('input[name="filter"]').click(function () {
      app.render.popup.filter()
    })

    $('.tableScreen > .buttonHolder > input[name="reset"]').click(function () {
      app.filter = []
      $('tr[type="info"]').show()
    })

    $(document).on('mousemove', function (e) {
      $('.mouseFollow').css({
        'left': e.pageX + 15,
        'top': e.pageY + 20
      })
    })
  }
}

// _BR.2.VNIR.jpg Thumbnail
// aster link: https://e4ftl01.cr.usgs.gov/ASTT/AST_L1T.003/2000.04.12/
// var getAster = function () {
//   var options = {
//     'token': '23FFE8BF-CDC1-486B-B5E3-F2B7F55CE151',
//     'center': 'LPDAAC_ECS',
//     'shortname': 'AST_L1T',
//     'version': '003',
//     'begin': '2017-03-01',
//     'end': '2017-03-20',
//     'mode': 'coordinates',
//     'urlat': 60,
//     'urlon': 16,
//     'lllat': 51,
//     'lllon': 6,
//     'minhoriz': 0,
//     'maxhoriz': 35,
//     'minvert': 0,
//     'maxvert': 17,
//     'metadata': 'on'
//   }
//
//   var testMeta = function (arr) {
//     var totalCount = arr.length
//     var count = 0
//     var dayImages = []
//     for (var i = 0; i < arr.length; i += 1) {
//       var metadataLink = arr[i]
//
//       $.ajax({
//         'url': metadataLink,
//         'type': 'get',
//         'dataType': 'xml',
//         'crossDomain': true
//       })
//          .done(function (xml) {
//            count += 1
//            $(xml).find('DayNightFlag').each(function () {
//              var dayOrNight = $(this).text()
//              if (dayOrNight === 'day') {
//                dayImages.push(metadataLink)
//              }
//            })
//            if (count === totalCount) { return dayImages }
//          })
//          .fail(function (jqxhr, textStatus, errorThrown) {
//            alert('ERROR: ' + textStatus + ' | ' + errorThrown)
//          })
//     }
//   }
//
//   var data = ''
//   for (var prop in options) {
//     if (options.hasOwnProperty(prop)) {
//       data += prop + '=' + options[prop] + '&'
//     }
//   }
//   data = data.slice(0, data.length - 1)
//
//   $.ajax({
//     'url': 'https://dartool.cr.usgs.gov/cgi-bin/Daac2Disk.cgi',
//     'type': 'POST',
//     'data': data,
//     'dataType': 'xml',
//     'crossDomain': true,
//     'timeout': 600000,
//     'accepts': {
//       'xml': 'text/xml',
//       'text': 'text/xml'
//     }
//   })
//      .done(function (xml) {
//        var metadata = []
//        $(xml).find('metadata').each(function () {
//          metadata.push($(this).text())
//        })
//        testMeta(metadata)
//      })
//      .fail(function (jqxhr, textStatus, errorThrown) {
//        alert('ERROR: ' + textStatus + ' | ' + errorThrown)
//      })
// }
// var bob = getAster()

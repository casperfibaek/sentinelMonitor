/* globals $ app */
app.render.table = function (info) {
  console.log('rendered: sites')
  var setup
  if (typeof (info) === 'undefined') {
    app.render.sites()
    console.log('error reading site information')
  } else {
    setup = `
      <div class='tableScreen'>
        <h2>${info.sitename}</h2>
        <div class="tableHolder">
          <table class="fixed_headers sortable">
            <thead>
              <tr class="tableHeaders">
                <th name="time_local" sorted="down" title="Date of capture"><i class="fa fa-calendar" aria-hidden="true"></i></th>
                <th name="time_local" sorted="down" title="Time of Capture"><i class="fa fa-clock-o" aria-hidden="true"></i></th>
                <th name="clouds" sorted="down" title="Percent cloudcover"><i class="fa fa-cloud" aria-hidden="true"></i></th>
                <th name="sun_altitude" sorted="down" title="Altitude of the sun (degrees)"><i class="fa fa-sun-o" aria-hidden="true"></i> al</th>
                <th name="sun_azimuth" sorted="down" title="Azimuth of the sun (degrees)"><i class="fa fa-sun-o" aria-hidden="true"></i> az</th>
                <th name="sat_name" sorted="down" title="The satellite that took the image">Platform</th>
                <th name="uuid" sorted="down" title="Unique image ID">UUID</th>
                <th name="main" sorted="down" title="Main download link">Main</th>
              </tr>
            </thead>
            <tbody>
            </tbody>
          </table>
        </div>
        <div class="buttonHolder">
          <input type="button" name="edit" class="button" value="Edit">
          <input type="button" name="export" class="button" value="Export">
          <input type="button" name="back" class="button" value="Back">
          <input type="button" name="filter" class="button" value="Filter">
        </div>
      </div>
    `
    $('#app').empty().append(setup)
    $('#app').prepend(`
    <div class='mouseFollow'>
      <img name="default"/>
    </div>
    `)

    window.location.hash = info.sitename
    var imgArray = info.images
    bob = imgArray

    var round = function (num, roundTo) {
      return Math.round(num * Math.pow(10, roundTo)) / Math.pow(10, roundTo)
    }

    var addRows = function (obj) {
      for (var i = 0; i < obj.length; i += 1) {
        var image = obj[i]

        var day = image.time_local.slice(0, 10)
        var hours = image.time_local.slice(11, 16)

        var row = `
        <tr type="info" uuid="${image.image_uuid}">
          <td name="date" align="center">${day}</td>
          <td name="time" align="center">${hours}</td>
          <td name="clouds" align="right">${round(image.clouds, 2)}</td>
          <td name="sun_alt" align="right">${round(image.sun_altitude, 2)}</td>
          <td name="sun_azi" align="right">${round(image.sun_azimuth, 2)}</td>
          <td name="platform" align="center">${image.sat_name}</td>
          <td name="uuid" align="center">${image.image_uuid}</td>
          <td name="main" align="center">
            <a href="linkFrom:${image.image_uuid}">
              <i class="fa fa-external-link" aria-hidden="true"></i>
            </a>
          </td>
        </tr>
        `
        $('tbody').append(row)
      }
      var L8Url = function (id) {
        var path = id.slice(6, 9)
        var row = id.slice(3, 6)
        return `http://landsat-pds.s3.amazonaws.com/L8/${row}/${path}/${id}/${id}_thumb_large.jpg`
      }

      var timeout
      $('tr[type="info"]').hover(function () {
        var rowUUID = $(this).attr('uuid')
        timeout = setTimeout(function () {
          if (rowUUID.indexOf('LC8') === 0) {
            $('.mouseFollow > img').attr('src', L8Url(rowUUID))
          } else {
            $('.mouseFollow > img').attr('src', `/image?uuid=${rowUUID}`)
          }
          $('.mouseFollow').show()
        }, 250)
      }, function () {
        clearTimeout(timeout)
        $('.mouseFollow > img[name="default"]').removeAttr('src')
        $('.mouseFollow').hide()
      })
    }
    addRows(imgArray)

    // Sort numbers
    $('th[name="clouds"], th[name="sun_altitude"], th[name="sun_azimuth"]').click(function () {
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

    $('img').on('load', function () {
      $(this).attr('cached', 'true')
    })

    $('.tableScreen > .buttonHolder > input[name="back"]').click(function () {
      app.render.sites()
    })

    $('input[name="filter"]').click(function () {
      app.render.popup.filter(info.images)
    })

    $(document).on('mousemove', function (e) {
      $('.mouseFollow').css({
        'left': e.pageX + 15,
        'top': e.pageY + 20
      })
    })

    $(document).on('keydown', function (event) {
      if (event.keyCode === 17) {
        $('.mouseFollow').css({
          height: '400px',
          width: '400px'
        })
        $('.mouseFollow > img').css({
          height: '406px',
          width: '406px',
          filter: 'saturate(105%) contrast(110%)'
        })
      }
    })

    $(document).on('keyup', function (event) {
      if (event.keyCode === 17) {
        $('.mouseFollow').css({
          height: '200px',
          width: '200px'
        })
        $('.mouseFollow > img').css({
          height: '206px',
          width: '206px',
          filter: 'saturate(100%) contrast(100%)'
        })
      }
    })
  }
}

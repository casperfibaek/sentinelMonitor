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
                <th name="date" sorted="down" title="Date of capture"><i class="fa fa-calendar" aria-hidden="true"></i></th>
                <th name="time" sorted="down" title="Time of Capture"><i class="fa fa-clock-o" aria-hidden="true"></i></th>
                <th name="clouds" sorted="down" title="Percent cloudcover"><i class="fa fa-cloud" aria-hidden="true"></i></th>
                <th name="sun_alt" sorted="down" title="Altitude of the sun (degrees)"><i class="fa fa-sun-o" aria-hidden="true"></i> al</th>
                <th name="sun_azi" sorted="down" title="Azimuth of the sun (degrees)"><i class="fa fa-sun-o" aria-hidden="true"></i> az</th>
                <th name="platform" sorted="down" title="The satellite that took the image">Platform</th>
                <th name="uuid" sorted="down" title="Unique image ID">UUID</th>
                <th name="main" sorted="down" title="Main download link">Main</th>
                <th name="alternative" sorted="down" title="Alternative download link">Alt</th>
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
      <img/>
    </div>
    `)
    window.location.hash = info.sitename

    var addRows = function (obj) {
      for (var i = 0; i < obj.length; i += 1) {
        var image = obj[i]
        var row = `
        <tr type="info" uuid="${image.image_uuid}">
          <td name="date" align="center">${image.time_begin.slice(0, 10)}</td>
          <td name="time" align="center">${image.time_begin.slice(11, 16)}</td>
          <td name="clouds" align="right">${image.clouds}</td>
          <td name="sun_alt" align="right">${image.sun_altitude}</td>
          <td name="sun_azi" align="right">${image.sun_azimuth}</td>
          <td name="platform" align="center">${image.platform_id}</td>
          <td name="uuid" align="center">${image.image_uuid}</td>
          <td name="main" align="center">
            <a href="${image.link_main}">
              <i class="fa fa-external-link" aria-hidden="true"></i>
            </a>
          </td>
          <td name="alternative" align="center">
            <a href="${image.link_alt}">
              <i class="fa fa-external-link" aria-hidden="true"></i>
            </a>
          </td>
        </tr>
        `
        $('tbody').append(row)
      }
    }

    addRows(info.images)

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

    var timeout
    $('tr[type="info"]').hover(function () {
      var rowUUID = $(this).attr('uuid')
      timeout = setTimeout(function () {
        $('.mouseFollow > img').attr('src', `/image?uuid=${rowUUID}`)
        $('.mouseFollow').show()
      }, 500)
    }, function () {
      clearTimeout(timeout)
      $('.mouseFollow > img').removeAttr('src')
      $('.mouseFollow').hide()
    })
  }
}

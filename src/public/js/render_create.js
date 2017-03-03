/* globals $ app L cookies */
app.render.createScreen = function (user) {
  var setup = `
  <div class='createScreen'>
      <div class='formHolder'>
        <h2>Create new site</h2>
        <form>
          <p>Project Name</p>
          <input class="text" type="text" name="projectname" value="" autofocus/>
          <p>Start date</p>
          <input class="date" type="date" name="startdate" value="2016-06-01"/>
          <p>Satellites</p>
          <div class="satelliteHolder">
            <div class="checkbox"><input class="checkButton" type="checkbox" name="satellite-1" value="sentinel-1"><p>Sentinel 1</p></div>
            <div class="checkbox"><input class="checkButton" type="checkbox" name="satellite-2" value="sentinel-2" checked><p>Sentinel 2</p></div>
            <div class="checkbox"><input class="checkButton" type="checkbox" name="satellite-3" value="sentinel-3"><p>Sentinel 3</p></div>
          </div>
          <div class="buttonHolder">
              <input type="button" name="back" class="button" value="Back">
              <input type="button" name="create" class="button" value="Create New">
          </div>
          <div class="message"><p></p></div>
        </form>
      </div>
      <div id='map'></div>
    </div>`

  $('#app').empty().append(setup)

  window.location.hash = 'create'

  $('input[name="projectname"]').focus()

  var map = L.map('map', {
    center: [ 55.3322691334024, 10.3491210937499 ],
    zoom: 6,
    maxZoom: 12,
    minZoom: 3,
    editable: true,
    zoomControl: false,
    attributionControl: false
  })

  L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors,' +
      '<a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>',
    maxZoom: 21,
    maxNativeZoom: 18
  }).addTo(map)

  var defaultGeometry = [
    [54.575245800783310, 9.52514648437500],
    [54.575245800783310, 11.1126708984375],
    [55.936894769039434, 11.1126708984375],
    [55.936894769039434, 9.52514648437500],
    [54.575245800783310, 9.52514648437500]
  ]

  var defaultLayer = L.polygon(defaultGeometry, {draggable: true}).addTo(map)

  defaultLayer.enableEdit()

  defaultLayer
    .on('dblclick', L.DomEvent.stop)
    .on('dblclick', defaultLayer.toggleEdit)

  function boundsToPolygon (latLngBounds) {
    var latlngs = []

    latlngs.push(latLngBounds.getSouthWest())// bottom left
    latlngs.push(latLngBounds.getSouthEast())// bottom right
    latlngs.push(latLngBounds.getNorthEast())// top right
    latlngs.push(latLngBounds.getNorthWest())// top left

    return new L.polygon(latlngs) // eslint-disable-line
  }

  map.on('click', function (e) {
    var location = e.latlng
    var currentPoint = map.latLngToContainerPoint(location)
    var width = 60
    var height = 80
    var xDifference = width / 2
    var yDifference = height / 2
    var southWest = L.point(
      (currentPoint.x - xDifference), (currentPoint.y - yDifference))
    var northEast = L.point(
      (currentPoint.x + xDifference), (currentPoint.y + yDifference))
    var bounds = L.latLngBounds(
      map.containerPointToLatLng(southWest),
      map.containerPointToLatLng(northEast))

    map.removeLayer(defaultLayer)

    defaultLayer = boundsToPolygon(bounds).addTo(map)
    defaultLayer.enableEdit()

    defaultLayer
        .on('dblclick', L.DomEvent.stop)
        .on('dblclick', defaultLayer.toggleEdit)
  })

  $('.satelliteHolder > .checkbox').on('click', function () {
    $(this).children().each(function () {
      if ($(this).hasClass('checkButton')) {
        $(this).click()
      }
    })
  })

  $('input[name="back"]').on('click', function () {
    app.render.loading()

    setTimeout(function () {
      app.render.sites()
    }, 500)
  })

  var message = function (str) {
    $('form > .message').text(str).css('opacity', 1)

    setTimeout(function () {
      $('form > .message').css('opacity', 0)
    }, 3000)
  }

  $('input[name="create"]').on('click', function () {
    if ($('input[name="projectname"]').val().length < 3) {
      message('Please provide a projectname')

      $('input[name="projectname"]').focus()
    } else if (
      $('.checkButton[value="sentinel-1"]').is(':checked') === false &&
      $('.checkButton[value="sentinel-2"]').is(':checked') === false &&
      $('.checkButton[value="sentinel-3"]').is(':checked') === false) {
      message('Please select a satellite')
    } else {
      var post = {
        'projectname': $('input[name="projectname"]').val(),
        'startdate': $('input[name="startdate"]').val(),
        'geom': JSON.stringify(defaultLayer.toGeoJSON()),
        'satellites': {
          'sentinel-1': $('.checkButton[value="sentinel-1"]').is(':checked'),
          'sentinel-2': $('.checkButton[value="sentinel-2"]').is(':checked'),
          'sentinel-3': $('.checkButton[value="sentinel-3"]').is(':checked')
        },
        'user': cookies
      }
      console.log(post)
    }
  })

  $(document).on('keypress', function (event) {
    if (!($('input').is(':focus')) && $('input[name="projectname"]').val().length < 3) {
      $('input[name="projectname"]').focus()
    }

    if (event.keyCode === 13) {
      $('input[name="create"]').click()
    }
  })
}

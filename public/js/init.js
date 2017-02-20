/* globals $ L Wkt */
let map = L.map('map', {
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

/*
 * Default Geometry
 */

// Fionia, Denmark
const defGeomLatLng = [
  [54.575245800783310, 9.52514648437500],
  [54.575245800783310, 11.1126708984375],
  [55.936894769039434, 11.1126708984375],
  [55.936894769039434, 9.52514648437500],
  [54.575245800783310, 9.52514648437500]
]
let defGeomLayer = L.polygon(defGeomLatLng, {
  color: '#ff0033',
  draggable: true
}).addTo(map)
defGeomLayer.enableEdit()
defGeomLayer
  .on('dblclick', L.DomEvent.stop)
  .on('dblclick', defGeomLayer.toggleEdit)

/*
 * EVENT LISTENERS
 */
$('.getSat').click(function () {
  if (validateForm() === true) {
    let formData = $('.paramForm').serializeArray()
    let wkt = new Wkt.Wkt()
    wkt.read(JSON.stringify(defGeomLayer.toGeoJSON()))

    let push = {
      form: formData,
      geom: wkt.write()
    }
    $.ajax({
      type: 'POST',
      url: 'http://127.0.0.1:3000/ESA_Request',
      dataType: 'json',
      data: push
    })
      .done(function (res) {
        console.log(res)
        bob = res
      })
      .fail(function (xhr, status, error) {
        console.log('AJAX call failed: ', xhr, JSON.parse(xhr.responseText).message)
      })
  }
})

$('.formBox.satellite > p').click(function () {
  $(this).prev().click()
})

$('.reset').click(function () {
  map.panTo([55.33226, 10.34912])
  defGeomLayer
    .setLatLngs(defGeomLatLng)
    .redraw()
    .toggleEdit()
  defGeomLayer.toggleEdit()
})

/*
 * Basic functions
 */
const validateForm = function () {
  let cloudsFrom = Number($("input[name='clouds-from']").val())
  let cloudsTo = Number($("input[name='clouds-to']").val())
  if (cloudsFrom >= cloudsTo) {
    alert('Clouds cover from >= to')
    return false
  }

  let dateFrom = new Date($("input[name='date-from']").val()).getTime()
  let dateTo = new Date($("input[name='date-to']").val()).getTime()
  let dateToday = new Date().getTime()
  let dateSentinel = new Date('2015-06-23').getTime()
  if (dateFrom >= dateTo) {
    alert('Start date before end date')
    return false
  } else if (dateFrom > dateToday || dateTo > dateToday) {
    alert("You've selected a date in the future.")
    return false
  } else if (dateFrom < dateSentinel || dateTo < dateSentinel) {
    alert('Sentinel-2A was launced the 23rd of June 2015')
    return false
  }

  return true
}

$('.getLogin').click(function () {
  let user = {
    username: $('.login-input[name="username"]').val(),
    password: $('.login-input[name="password"]').val()
  }

  $.ajax({
    type: 'POST',
    url: 'http://127.0.0.1:3000/account',
    dataType: 'json',
    data: user
  })
    .done(function (res) {
      if (res.status === 'error') {
        console.log(res)
        $('.serverMessage > p').text(res.message)
        $('.serverMessage').show()
      } else {
        $('.user-loader').show()
        setTimeout(function () {
          $('.overlay').remove()
        }, 2000)
      }
    })
    .fail(function (jqXHR, status, error) {
      console.log('AJAX call failed: ' + status + ', ' + error)
    })
})

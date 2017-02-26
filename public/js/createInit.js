/* globals location window $ L Wkt */
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

let globalContainer = new function () {
  this.getParam = function (name) {
    var results = new RegExp('[?&]' + name + '=([^&#]*)').exec(window.location.href)
    if (results == null) {
      return null
    } else {
      return results[1] || 0
    }
  }

  this.defaultGeometry = [
    [54.575245800783310, 9.52514648437500],
    [54.575245800783310, 11.1126708984375],
    [55.936894769039434, 11.1126708984375],
    [55.936894769039434, 9.52514648437500],
    [54.575245800783310, 9.52514648437500]
  ]

  this.defaultLayer = L.polygon(this.defaultGeometry, {
    color: '#ff0033',
    draggable: true
  })

  this.validateForm = function () {
    return true
  }
}()
globalContainer.defaultLayer.addTo(map)
globalContainer.defaultLayer.enableEdit()

/*
 * EVENT LISTENERS
 */
globalContainer.defaultLayer
   .on('dblclick', L.DomEvent.stop)
   .on('dblclick', globalContainer.defaultLayer.toggleEdit)

$('.formBox.satellite > p').click(function () {
  $(this).prev().click()
})

$('.goback').click(function () {
  var uuid = globalContainer.getParam('uuid')
  $(location).attr('href', `/?uuid=${uuid}`)
})

$('.reset').click(function () {
  map.panTo([55.33226, 10.34912])
  globalContainer.defaultLayer
     .setLatLngs(globalContainer.defaultGeometry)
     .redraw()
     .toggleEdit()
  globalContainer.defaultLayer.toggleEdit()
})

// Request Sentinel API Hub for SAT information
$('.getSat').click(function () {
  if (globalContainer.validateForm() === true) {
    let formData = $('.paramForm').serializeArray()
    let wkt = new Wkt.Wkt()
    wkt.read(JSON.stringify(globalContainer.defaultLayer.toGeoJSON()))

    let push = {
      'form': formData,
      'name': $('.sitename > input').val(),
      'uuid': globalContainer.getParam('uuid'),
      'geom': wkt.write()
    }

    $.ajax({
      type: 'POST',
      url: 'http://127.0.0.1:3000/api/createSite',
      dataType: 'json',
      timeout: 90000,
      data: push
    })
      .done(function (res) {
        $(location).attr('href', `/?uuid=${globalContainer.getParam('uuid')}`)
      })
      .fail(function (xhr, status, error) {
        console.log('AJAX call failed: ', xhr)
      })
  }
})

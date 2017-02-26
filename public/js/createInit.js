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

let globalContainer = new function () {
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

  this.addProject = function (obj) {
    let str = `<div class="project"><p>${obj.title}</p></div>`
    $('.projects').append(str)
  }

  this.validateForm = function () {
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

$('.reset').click(function () {
  map.panTo([55.33226, 10.34912])
  globalContainer.defaultLayer
     .setLatLngs(globalContainer.defaultGeometry)
     .redraw()
     .toggleEdit()
  globalContainer.defaultLayer.toggleEdit()
})

$(document).keypress(function (e) {
  if (e.which === 13) {
    if ($('.getLogin').length > 0) {
      $('.getLogin').click()
    } else {
      $('.getSat').click()
    }
  }
})

// Request Sentinel API Hub for SAT information
$('.getSat').click(function () {
  if (globalContainer.validateForm() === true) {
    let formData = $('.paramForm').serializeArray()
    let wkt = new Wkt.Wkt()
    wkt.read(JSON.stringify(globalContainer.defaultLayer.toGeoJSON()))

    let push = {
      'form': formData,
      'geom': wkt.write(),
      'user': globalContainer.user
    }
    $.ajax({
      type: 'POST',
      url: 'http://127.0.0.1:3000/api/esa',
      dataType: 'json',
      timeout: 90000,
      data: push
    })
      .done(function (res) {
        console.log(res)
        // bob = res
      })
      .fail(function (xhr, status, error) {
        console.log('AJAX call failed: ', xhr)
      })
  }
})

// Request login from user database
$('.getLogin').click(function () {
  let user = {
    username: $('.login-input[name="username"]').val(),
    password: $('.login-input[name="password"]').val()
  }
  globalContainer.user = user

  $.ajax({
    type: 'POST',
    url: 'http://127.0.0.1:3000/account',
    dataType: 'json',
    timeout: 10000,
    data: user
  })
    .done(function (res) {
      if (res.status === 'error') {
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
      console.log('AJAX call failed: ', jqXHR, status, error)
    })
})

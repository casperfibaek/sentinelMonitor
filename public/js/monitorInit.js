/* global $ window */

$.urlParam = function (name) {
  var results = new RegExp('[?&]' + name + '=([^&#]*)').exec(window.location.href)
  if (results == null) {
    return null
  } else {
    return results[1] || 0
  }
}

// GET GEOM AND IMAGES
$.ajax({
  type: 'POST',
  url: 'http://127.0.0.1:3000/api/getImagesFromSite',
  dataType: 'json',
  data: {'site': $.urlParam('site')}
})
  .done(function (res) {
    var images = JSON.parse(res.images)
    var geom = JSON.parse(res.geom)
    console.log(images)
    console.log(geom)
    console.log('firstImage: ', getImage(images[0]))
  })
  .fail(function (xhr, status, error) {
    console.log('AJAX call failed: ', xhr)
  })

var getImage = function (uuid) {
  $.ajax({
    type: 'POST',
    url: 'http://127.0.0.1:3000/api/getImage',
    dataType: 'json',
    data: {'imageuuid': uuid}
  })
    .done(function (res) {
      console.log(res)
    })
    .fail(function (xhr, status, error) {
      console.log('AJAX call failed: ', xhr)
    })
}

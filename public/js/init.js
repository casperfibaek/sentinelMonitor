/* global $ window location */
$.urlParam = function (name) {
  var results = new RegExp('[?&]' + name + '=([^&#]*)').exec(window.location.href)
  if (results == null) {
    return null
  } else {
    return results[1] || 0
  }
}

var getSitesIDs = function (str) {
  $.ajax({
    type: 'POST',
    url: 'http://127.0.0.1:3000/api/getSites',
    dataType: 'json',
    data: {'uuid': str}
  })
    .done(function (res) {
      var sites = res.sites
      for (var i = 0; i < sites.length; i++) {
        $('.projects').append(`
          <div siteid="${sites[i].siteid}" class="project">
            <p>${sites[i].sitename}</p>
          </div>
        `)
      }

      $('.project').on('click', function () {
        console.log($(this).attr('siteid'))
      })
    })
    .fail(function (jqXHR, status, error) {
      console.log('AJAX call failed: ' + status + ', ' + error)
    })
}

const uuid = $.urlParam('uuid')

getSitesIDs(uuid)

$('.createSite').on('click', function () {
  $(location).attr('href', `/create?uuid=${uuid}`)
})

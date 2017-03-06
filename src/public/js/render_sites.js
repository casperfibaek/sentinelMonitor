/* globals $ app cookies */
app.render.sites = function () {
  console.log('rendered: sites')
  var setup = `
    <div class='sitesScreen'>
      <h2>Monitoring</h2>
      <div class="buttonHolder">
          <input type="button" name="create" class="button" value="Create New">
      </div>
    </div>`

  $('#app').empty().append(setup)
  window.location.hash = 'sites'

  app.database.fetchUserSites(cookies, function (res) { console.log(res) })

  $(document).on('keypress', function (event) {
    if (event.keyCode === 13) {
      $('input[name="create"]').click()
    }
  })

  $('.sitesScreen > .buttonHolder > input[name="create"]').on('click', function () {
    app.render.loading('Initializing..')
    setTimeout(function () {
      app.render.create()
    }, 300)
  })
}

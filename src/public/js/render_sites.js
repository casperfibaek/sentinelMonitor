/* globals $ app */
app.render.sites = function () {
  var setup = `
    <div class='sitesScreen'>
      <h2>Monitoring</h2>
      <div class="buttonHolder">
          <input type="button" name="create" class="button" value="Create New">
      </div>
    </div>`

  $('#app').empty().append(setup)
  window.location.hash = 'sites'

  $(document).on('keypress', function (event) {
    if (event.keyCode === 13) {
      $('input[name="create"]').click()
    }
  })

  $('.sitesScreen > .buttonHolder > input[name="create"]').on('click', function () {
    app.render.loading()
    setTimeout(function () {
      app.render.createScreen()
    }, 500)
  })
}

/* global $ app */
app.render.loading = function () {
  console.log('rendered: loading')
  $('#app').empty().append(`<div class="loader"></div>`)
  $(document).off() // remove all added event listeners
}

/* global $ app */
app.render.loading = function () {
  $('#app').empty().append(`<div class="loader"></div>`)
  $(document).off() // remove all added event listeners
}

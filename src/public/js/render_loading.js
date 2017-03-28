/* global $ app */
app.render.loading = function (text) {
  // console.log('rendered: loading')
  var message = ''
  if (text) {
    if (text !== 'undefined') {
      message = text
    }
  }
  $('#app').empty().append(`<div class="loader"></div><p class="loadingMessage">${text}</p>`)
  if (message !== '') { $('.loader > .loadingMessage').css('margin-top', '26px') }
  $(document).off() // remove all added event listeners
}

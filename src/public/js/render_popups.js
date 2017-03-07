/* globals $ app cookies */
app.render.popup = {
  deleteSite: function (sitename) {
    console.log('rendered: popup(delete site?)')

    if (typeof (sitename) === 'undefined') { console.log('Unable to get site identity') } else {
      var setup = `
        <div class='popup'>
          <h4>Do you want to delete site: '${sitename}'?</h4>
          <div class="buttonHolder">
              <input type="button" name="back" class="button" value="Back">
              <input type="button" name="delete" class="button" value="Delete">
          </div>
        </div>
        `

      $('body').prepend(setup)
      $('.content').append('<div class="overlay"></div>')

      $('.content').one('mousedown', function (event) { $('.popup, .overlay').remove() })

      $(document).on('keypress', function (event) {
        if (event.keyCode === 27) { $('input[name="back"]').click() } // esc
        if (event.keyCode === 13) { $('input[name="delete"]').click() } // enter
      })

      $('.popup > .buttonHolder > input[name="delete"]').on('click', function () {
        $('.popup, .overlay').remove()
        $(document).off()
        $('.content').off()

        app.render.loading(`Deleting: ${sitename}..`)
        app.database.deleteSite({
          'session': cookies.session,
          'username': cookies.username,
          'site': sitename
        }, function (res) {
          console.log(res)
          app.render.sites()
        })
      })

      $('.popup > .buttonHolder > input[name="back"]').on('click', function () {
        $('.popup, .overlay').remove()
      })
    }
  }
}

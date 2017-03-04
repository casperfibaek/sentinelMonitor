/* globals $ app location */
app.render.logout = {
  'addMessage': function () {
    console.log('rendered: logoutMessage')
    var setup = `
    <div class='logoutMessage'>
      <p>Signout<i class="fa fa-sign-out" aria-hidden="true"></i></p>
    </div>`

    $('#mainContent').prepend(setup)

    $('.logoutMessage').on('click', function () {
      $('.loggedInAs > a').html(`Not logged in<i class="fa fa-user" aria-hidden="true"></i>`)
      $('.loggedInAs').attr('login', 'false')
      $(this).remove()
      $(location).attr('href', 'http://127.0.0.1:3000/logout')
    })

    $('#mainContent').on('click', function () {
      $('.logoutMessage').remove()
    })
  },

  'removeMessage': function () {
    $('.logoutMessage').remove()
  }
}

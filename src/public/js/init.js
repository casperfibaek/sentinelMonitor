/* globals $ app cookies */
/**************************************************
                INITIALIZE
 **************************************************/
$(document).ready(function () {
  app.render.loading()
  app.database.validateSession(cookies.session, function (res) {
    if (res.status === 'success') {
      $('.navigation > .loggedInAs > a').html(`${res.username}<i class="fa fa-user" aria-hidden="true"></i>`)
      app.render.sites()
      cookies.username = res.username
    } else {
      app.render.login()
    }
  })

  /**************************************************
                  HEADER AND FOOTER
   **************************************************/
  $('.navigation > .loggedInAs').on('click', function () {
    if ($('.loggedInAs').attr('login') === 'true' && $('.logoutMessage').length === 0) {
      app.render.logout.addMessage()
    } else {
      app.render.logout.removeMessage()
      app.render.login()
    }
  })

  $('.logo').on('click', function () {
    window.location.hash = '#home'
  })

  /**************************************************
                  EVENT LISTENERS
   **************************************************/
  window.onhashchange = function () {
    switch (window.location.hash) {
      case ('#login'):
        // app.render.loginScreen({'username': '', 'password': ''})
        break
      case ('#signup'):
        // app.render.signupScreen({'username': '', 'password': ''})
        break
      case ('#sites'):
        // app.render.sitesScreen()
        break
      case ('#home'):
        // app.render.loginScreen()
        console.log('went home')
        break
      case ('#about'):
        // app.render.loginScreen()
        console.log('asked about')
        break
    }
  }
})

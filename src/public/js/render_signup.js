/* globals $ app cookies */
app.render.signup = function (user) {
  // console.log('rendered: signup')
  var setup = `
  <div class='signupScreen'>
    <form>
      <h2>Create new user</h2>
      <p>Username</p><input class="username" type="username" name="username" value="${user.username}" autofocus/>
      <p>Password</p><input class="password" type="password" name="password" value="${user.password}"/>
      <p>Email</p><input class="email" type="text" name="email" value="${user.email}"/>
      <div class="buttonHolder">
          <input type="button" name="signup" class="button" value="Signup">
          <input type="button" name="back" class="button" value="Back">
      </div>
      <div class="message"><p></p></div>
    </form>
  </div>`

  $('#app').empty().append(setup)

  window.location.hash = 'signup'

  app.render.logout.removeMessage()

  $('input[name="back"]').on('click', function () {
    app.render.login()
  })

  $('input[name="signup"]').on('click', function () {
    var user = {
      'username': $('form > .username').val(),
      'password': $('form > .password').val(),
      'email': $('form > .email').val(),
      'session': cookies.session
    }

    var message = function (str) {
      $('form > .message').text(str).css('opacity', 1)
      setTimeout(function () { $('form > .message').css('opacity', 0) }, 3000)
    }

    if (app.validateUser(user) === true) {
      app.render.loading('Validating user..')
      app.database.signup(user, function (result) {
        if (result.status === 'success') {
          cookies.username = user.username

          $('.loggedInAs > a').html(`${user.username}<i class="fa fa-user" aria-hidden="true"></i>`)
          $('.loggedInAs').attr('login', 'true')

          setTimeout(function () { app.render.sites() }, 500)
        } else {
          app.render.signup(user)

          message(result.message || 'User invalid')
        }
      })
    }
  })

  $(document).on('keypress', function (event) {
    if (!($('input').is(':focus')) && $('form > .username').val() !== undefined) {
      if ($('form > .username').val().length === 0) {
        $('form > .username').focus()
      } else if ($('form > .password').val().length) {
        $('form > .password').focus()
      } else if ($('form > .email').val().length) {
        $('form > .email').focus()
      }
    }
    if (event.keyCode === 13) {
      $('input[name="signup"]').click()
    }
  })
}

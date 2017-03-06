/* globals $ app cookies */
app.render.login = function () {
  console.log('rendered: login')
  var setup = `
  <div class='loginScreen'>
    <form>
      <h2>Please login</h2>
      <p>Username</p><input class="username" type="username" name="username" autofocus/>
      <p>Password</p><input class="password" type="password" name="password"/>
      <div class="buttonHolder">
          <input type="button" name="login" class="button" value="Login">
          <input type="button" name="signup" class="button" value="Signup">
      </div>
    <div class="message"><p></p></div>
    </form>
  </div>`

  $('#app').empty().append(setup)

  window.location.hash = 'login'

  $('form > .username').focus()

  app.render.logout.removeMessage()

  $('input[name="login"]').on('click', function () {
    var user = {
      'username': $('form > .username').val(),
      'password': $('form > .password').val(),
      'session': cookies.session
    }

    var message = function (str) {
      $('.loginScreen > form > .message').text(str).css('opacity', 1)

      setTimeout(function () {
        $('.loginScreen > form > .message').css('opacity', 0)
      }, 3000)
    }

    if (app.validateUser(user)) {
      app.render.loading('Validating User')
      app.database.login(user, function (result) {
        if (result.status === 'success') {
          $('.loggedInAs > a').html(`${user.username}<i class="fa fa-user" aria-hidden="true"></i>`)
          $('.loggedInAs').attr('login', 'true')
          cookies.username = user.username

          setTimeout(function () {
            app.render.sites()
          }, 500)
        } else {
          app.render.login(user)

          message('User not found')
        }
      })
    }
  })

  $('input[name="signup"]').on('click', function () {
    var user = {
      'username': $('form > .username').val(),
      'password': $('form > .password').val(),
      'email': ''
    }

    app.render.loading('Initializing..')

    setTimeout(function () {
      app.render.signup(user)
    }, 300)
  })

  $(document).on('keypress', function (event) {
    if (!($('input').is(':focus')) && $('form > .username').val() !== undefined) {
      if ($('form > .username').val().length === 0) {
        $('form > .username').focus()
      } else if ($('form > .password').val().length) {
        $('form > .password').focus()
      }
    }
    if (event.keyCode === 13) {
      $('.buttonHolder > input[name="login"]').click()
    }
  })
}

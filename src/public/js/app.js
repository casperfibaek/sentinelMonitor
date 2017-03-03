/* global $ */
var app = { // eslint-disable-line
  validateUser: function (user) {
    var reEmail = /^\w+@[a-zA-Z_]+?\.[a-zA-Z]{2,3}$/
    var reUser = /^[a-zA-Z0-9_]+$/

    var message = function (str) {
      $('form > .message').text(str).css('opacity', 1)
      setTimeout(function () { $('form > .message').css('opacity', 0) }, 3000)
    }

    if (user.username.length < 4) {
      message('Username too short')
      $('form > .username').focus()
      return false
    } else if (reUser.test(user.username) === false) {
      message('Username has invalid characters')
      $('form > .username').focus()
      return false
    } else if (user.password.length < 4) {
      message('Password too short')
      $('form > .password').focus()
      return false
    } else if (reUser.test(user.password) === false) {
      message('Password has invalid characters')
      $('form > .password').focus()
      return false
    } else if (user.username === user.password) {
      message('Username and password match')
      $('form > .password').focus()
      return false
    }

    if (user.email !== undefined) {
      if (reEmail.test(user.email) === false || user.email.length < 6) {
        message('Email invalid')
        $('form > .email').focus()
        return false
      }
    }

    return true
  },
  render: {},
  database: {}
}

/* global $ db location cookies L */
var app = {
  /**************************************************
                    Renders
   **************************************************/
  /**************************************************
                    LOGIN SCREEN
   **************************************************/
  render: {
    loginScreen: function () {
      var setup = `<div class='loginScreen'>
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
      app.logoutMessageRemove()
      $('form > .username').focus()

      $('.buttonHolder > input[name="login"]').on('click', function () {
        var user = {
          'username': $('form > .username').val(),
          'password': $('form > .password').val(),
          'session': cookies.session
        }

        var message = function (str) {
          $('form > .message').text(str).css('opacity', 1)
          setTimeout(function () { $('form > .message').css('opacity', 0) }, 3000)
        }

        if (app.validateUser(user)) {
          app.render.loadingScreen()
          db.login(user, function (result) {
            if (result.status === 'success') {
              $('.navigation > .loggedInAs > a').html(`${user.username}<i class="fa fa-user" aria-hidden="true"></i>`)
              cookies.username = user.username
              setTimeout(function () { app.render.sitesScreen() }, 500)
            } else {
              app.render.loginScreen(user)
              message('User not found')
              console.log(result)
            }
          })
        }
      })

      $('.buttonHolder > input[name="signup"]').on('click', function () {
        var user = {
          'username': $('form > .username').val(),
          'password': $('form > .password').val(),
          'email': ''
        }
        app.render.loadingScreen()
        setTimeout(function () { app.render.signupScreen(user) }, 500)
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
    },
    'loadingScreen': function () {
      $('#app').empty().append(`<div class="loader">Loading...</div>`)
      $(document).off() // remove all added event listeners
    },

  /**************************************************
                    SIGNUP SCREEN
   **************************************************/
    'signupScreen': function (user) {
      var setup = `<div class='signupScreen'>
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
      app.logoutMessageRemove()

      $('.buttonHolder > .button[name="back"]').on('click', function () {
        app.render.loginScreen()
      })

      $('.buttonHolder > input[name="signup"]').on('click', function () {
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
          app.render.loadingScreen()
          db.signup(user, function (result) {
            if (result.status === 'success') {
              cookies.username = user.username
              $('.navigation > .loggedInAs > a').html(`${user.username}<i class="fa fa-user" aria-hidden="true"></i>`)
              setTimeout(function () { app.render.sitesScreen() }, 500)
              console.log(`User created with username: ${user.username} and password: ${user.password}`)
            } else {
              app.render.signupScreen(user)
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
          $('.buttonHolder > input[name="signup"]').click()
        }
      })
    },
    'sitesScreen': function (user) {
      var setup = `<div class='sitesScreen'>
          <h2>Monitoring</h2>
          <div class="buttonHolder">
              <input type="button" name="create" class="button" value="Create New">
          </div>
        </div>`

      $('#app').empty().append(setup)
      window.location.hash = 'sites'

      $(document).on('keypress', function (event) {
        if (event.keyCode === 13) {
          $('.buttonHolder > input[name="create"]').click()
        }
      })

      $('.sitesScreen > .buttonHolder > input[name="create"]').on('click', function () {
        app.render.loadingScreen()
        setTimeout(function () { app.render.createScreen(user) }, 500)
      })
    },
    'createScreen': function (user) {
      var setup = `<div class='createScreen'>
          <div class='formHolder'>
            <h2>Create new site</h2>
            <form>
              <p>Project Name</p>
              <input class="text" type="text" name="projectname" value="" autofocus/>
              <p>Start date</p>
              <input class="date" type="date" name="startdate" value="2016-06-01"/>
              <p>Satellites</p>
              <div class="satelliteHolder">
                <div class="checkbox"><input class="checkButton" type="checkbox" name="satellite-1" value="sentinel-1"><p>Sentinel 1</p></div>
                <div class="checkbox"><input class="checkButton" type="checkbox" name="satellite-2" value="sentinel-2" checked><p>Sentinel 2</p></div>
                <div class="checkbox"><input class="checkButton" type="checkbox" name="satellite-3" value="sentinel-3"><p>Sentinel 3</p></div>
              </div>
              <div class="buttonHolder">
                  <input type="button" name="back" class="button" value="Back">
                  <input type="button" name="create" class="button" value="Create New">
              </div>
              <div class="message"><p></p></div>
            </form>
          </div>
          <div id='map'></div>
        </div>`

      $('#app').empty().append(setup)
      window.location.hash = 'create'
      $('form > input[name="projectname"]').focus()

      $(document).on('keypress', function (event) {
        if (!($('input').is(':focus')) && $('form > input[name="projectname"]').val().length < 3) {
          $('form > input[name="projectname"]').focus()
        }
        if (event.keyCode === 13) {
          $('.buttonHolder > input[name="create"]').click()
        }
      })

      var map = L.map('map', {
        center: [ 55.3322691334024, 10.3491210937499 ],
        zoom: 6,
        maxZoom: 12,
        minZoom: 3,
        editable: true,
        zoomControl: false,
        attributionControl: false
      })

      L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors,' +
          '<a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>',
        maxZoom: 21,
        maxNativeZoom: 18
      }).addTo(map)

      var defaultGeometry = [
        [54.575245800783310, 9.52514648437500],
        [54.575245800783310, 11.1126708984375],
        [55.936894769039434, 11.1126708984375],
        [55.936894769039434, 9.52514648437500],
        [54.575245800783310, 9.52514648437500]
      ]

      var defaultLayer = L.polygon(defaultGeometry, {draggable: true}).addTo(map)

      defaultLayer.enableEdit()

      defaultLayer
        .on('dblclick', L.DomEvent.stop)
        .on('dblclick', defaultLayer.toggleEdit)

      function boundsToPolygon (latLngBounds) {
        var latlngs = []

        latlngs.push(latLngBounds.getSouthWest())// bottom left
        latlngs.push(latLngBounds.getSouthEast())// bottom right
        latlngs.push(latLngBounds.getNorthEast())// top right
        latlngs.push(latLngBounds.getNorthWest())// top left

        return new L.polygon(latlngs) // eslint-disable-line
      }

      map.on('click', function (e) {
        var location = e.latlng
        var currentPoint = map.latLngToContainerPoint(location)
        var width = 60
        var height = 80
        var xDifference = width / 2
        var yDifference = height / 2
        var southWest = L.point(
          (currentPoint.x - xDifference), (currentPoint.y - yDifference))
        var northEast = L.point(
          (currentPoint.x + xDifference), (currentPoint.y + yDifference))
        var bounds = L.latLngBounds(
          map.containerPointToLatLng(southWest),
          map.containerPointToLatLng(northEast))

        map.removeLayer(defaultLayer)

        defaultLayer = boundsToPolygon(bounds).addTo(map)
        defaultLayer.enableEdit()

        defaultLayer
            .on('dblclick', L.DomEvent.stop)
            .on('dblclick', defaultLayer.toggleEdit)
      })

      $('.createScreen > .formHolder > form > .satelliteHolder > .checkbox').on('click', function () {
        $(this).children().each(function () {
          if ($(this).hasClass('checkButton')) {
            $(this).click()
          }
        })
      })

      $('.createScreen > .formHolder > form > .buttonHolder > input[name="back"]').on('click', function () {
        app.render.loadingScreen()
        setTimeout(function () { app.render.sitesScreen(user) }, 500)
      })

      var message = function (str) {
        $('form > .message').text(str).css('opacity', 1)
        setTimeout(function () { $('form > .message').css('opacity', 0) }, 3000)
      }

      $('.createScreen > .formHolder > form > .buttonHolder > input[name="create"]').on('click', function () {
        if ($('form > input[name="projectname"]').val().length < 3) {
          message('Please provide a projectname')
          $('form > input[name="projectname"]').focus()
        } else if (
          $('.checkButton[value="sentinel-1"]').is(':checked') === false &&
          $('.checkButton[value="sentinel-2"]').is(':checked') === false &&
          $('.checkButton[value="sentinel-3"]').is(':checked') === false) {
          message('Please select a satellite')
        } else {
          var post = {
            'projectname': $('.createScreen > .formHolder > form > input[name="projectname"]').val(),
            'startdate': $('.createScreen > .formHolder > form > input[name="startdate"]').val(),
            'geom': JSON.stringify(defaultLayer.toGeoJSON()),
            'satellites': {
              'sentinel-1': $('.checkButton[value="sentinel-1"]').is(':checked'),
              'sentinel-2': $('.checkButton[value="sentinel-2"]').is(':checked'),
              'sentinel-3': $('.checkButton[value="sentinel-3"]').is(':checked')
            },
            'user': cookies
          }
          console.log(post)
        }
      })
    }
  },

  /**************************************************
                VALIDATION FUNCTIONS
   **************************************************/
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

  /**************************************************
                    SITES SCREEN
   **************************************************/
  'logoutMessage': function () {
    var setup = `<div class='logoutMessage'>
        <p>Signout<i class="fa fa-sign-out" aria-hidden="true"></i></p>
      </div>`

    $('#mainContent').prepend(setup)
    $('.logoutMessage').on('click', function () {
      $('.navigation > .loggedInAs > a').html(`Not logged in<i class="fa fa-user" aria-hidden="true"></i>`)
      $(this).remove()
      $(location).attr('href', 'http://127.0.0.1:3000/logout')
    })
    $('#mainContent').on('click', function () {
      $('.logoutMessage').remove()
    })
  },
  'logoutMessageRemove': function () {
    $('.navigation > .loggedInAs > a').html(`Not logged in<i class="fa fa-user" aria-hidden="true"></i>`)
    $('.logoutMessage').remove()
  }
}

/**************************************************
                HEADER AND FOOTER
 **************************************************/
$('.navigation > .loggedInAs').on('click', function () {
  if ($('.navigation > .loggedInAs > a').text() !== 'Not logged in') {
    app.logoutMessage()
  } else {
    app.render.loginScreen()
  }
})

$('.logo').on('click', function () {
  window.location.hash = '#home'
})

/**************************************************
                INITIALIZE
 **************************************************/
$(document).ready(function () {
  app.render.loadingScreen()
  db.session(cookies.session, function (res) {
    if (res.status === 'success') {
      $('.navigation > .loggedInAs > a').html(`${res.username}<i class="fa fa-user" aria-hidden="true"></i>`)
      app.render.sitesScreen()
      cookies.username = res.username
    } else {
      app.render.loginScreen()
    }
  })
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

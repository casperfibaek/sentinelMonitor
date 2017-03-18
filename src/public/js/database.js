/* global $ app */
app.database = {
  'login': function (user, callback) {
    $.ajax({
      type: 'POST',
      url: 'http://127.0.0.1:3000/auth/login',
      dataType: 'json',
      data: user
    })
      .done(function (response) {
        callback(response)
      })
      .fail(function (xhr, status, error) {
        callback({
          'status': status,
          'message': error,
          'total': xhr
        })
      })
  },
  'signup': function (user, callback) {
    $.ajax({
      type: 'POST',
      url: 'http://127.0.0.1:3000/auth/signup',
      dataType: 'json',
      data: user
    })
      .done(function (response) {
        callback(response)
      })
      .fail(function (xhr, status, error) {
        callback({
          'status': status,
          'message': error,
          'total': xhr
        })
      })
  },
  'validateSession': function (str, callback) {
    $.ajax({
      type: 'POST',
      url: 'http://127.0.0.1:3000/auth/session',
      dataType: 'json',
      data: {'session': str}
    })
      .done(function (response) {
        callback(response)
      })
      .fail(function (xhr, status, error) {
        callback({
          'status': status,
          'message': error,
          'total': xhr
        })
      })
  },
  'getImages': function (request, callback) {
    $.ajax({
      type: 'POST',
      url: 'http://127.0.0.1:3000/api/getImages',
      dataType: 'json',
      data: request
    })
      .done(function (response) {
        callback(response)
      })
      .fail(function (xhr, status, error) {
        callback({
          'status': status,
          'message': error,
          'total': xhr
        })
      })
  },
  'createSite': function (request, callback) {
    $.ajax({
      type: 'POST',
      url: 'http://127.0.0.1:3000/api/createSite',
      dataType: 'json',
      data: request
    })
      .done(function (response) {
        callback(response)
      })
      .fail(function (xhr, status, error) {
        callback({
          'status': status,
          'message': error,
          'total': xhr
        })
      })
  },
  'deleteSite': function (request, callback) {
    $.ajax({
      type: 'POST',
      url: 'http://127.0.0.1:3000/api/deleteSite',
      dataType: 'json',
      data: request
    })
      .done(function (response) {
        callback(response)
      })
      .fail(function (xhr, status, error) {
        callback({
          'status': status,
          'message': error,
          'total': xhr
        })
      })
  },
  'getSites': function (request, callback) {
    $.ajax({
      type: 'POST',
      url: 'http://127.0.0.1:3000/api/getSites',
      dataType: 'json',
      data: request
    })
      .done(function (response) {
        callback(response)
      })
      .fail(function (xhr, status, error) {
        callback({
          'status': status,
          'message': error,
          'total': xhr
        })
      })
  }
}

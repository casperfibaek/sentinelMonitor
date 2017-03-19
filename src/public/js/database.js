/* global $ app */
app.database = {
  'login': function (user, callback) {
    $.ajax({
      type: 'POST',
      url: '/auth/login',
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
      url: '/auth/signup',
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
      url: '/auth/session',
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
      url: '/api/getImages',
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
      url: '/api/createSite',
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
      url: '/api/deleteSite',
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
      url: '/api/getSites',
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

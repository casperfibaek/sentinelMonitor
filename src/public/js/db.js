/* global $ */
/* eslint-disable no-unused-vars */
var db = {
  'login': function (user, callback) {
    $.ajax({
      type: 'POST',
      url: 'http://127.0.0.1:3000/api/login',
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
      url: 'http://127.0.0.1:3000/api/signup',
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
  'session': function (str, callback) {
    $.ajax({
      type: 'POST',
      url: 'http://127.0.0.1:3000/api/session',
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
  }
}

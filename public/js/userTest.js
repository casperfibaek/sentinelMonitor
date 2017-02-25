/* eslint-disable */

var bob = {username: 'bob', password: 'critical'}
var astrid = {username: 'astrid', password: 'elefant'}
var casper = {username: 'casper', password: 'guldfisk'}
var wrong = {username: 'charles', password: 'theThird'}

var createUser = function (obj) {
  $.ajax({
    type: 'POST',
    url: 'http://127.0.0.1:3000/api/createUser',
    dataType: 'json',
    data: obj
  })
    .done(function (res) {
      console.log(res)
    })
    .fail(function (jqXHR, status, error) {
      console.log('AJAX call failed: ' + status + ', ' + error)
    })
}

var authUser = function (obj) {
  $.ajax({
    type: 'POST',
    url: 'http://127.0.0.1:3000/api/auth',
    dataType: 'json',
    data: obj
  })
    .done(function (res) {
      $(location).attr('href', '/uuid=' + res.message)
      console.log(res)
      bob = res
    })
    .fail(function (jqXHR, status, error) {
      console.log('AJAX call failed: ' + status + ', ' + error)
    })
}

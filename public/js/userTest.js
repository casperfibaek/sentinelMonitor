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

var site = {uuid: '7c5b16c0-fc26-11e6-8a72-fb7ec6b2881b'}
var getSites = function (obj) {
  $.ajax({
    type: 'POST',
    url: 'http://127.0.0.1:3000/api/sites',
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

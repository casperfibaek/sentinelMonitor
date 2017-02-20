var bob1 = {username: 'casperfibaek', password: 'goldfish'}
var bob2 = {username: 'casperfiek', password: 'goldfi2sh'}

var testUser = function (obj) {
  $.ajax({
    type: 'POST',
    url: 'http://127.0.0.1:3000/account',
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

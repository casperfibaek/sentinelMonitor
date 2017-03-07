/* globals $ app */
app.render.sites = function (siteinfo) {
  console.log('rendered: sites')
  var setup = `
    <div class='tableScreen'>
      <h2>${siteinfo.name}</h2>
    </div>`

  $('#app').empty().append(setup)
  window.location.hash = siteinfo.name
}

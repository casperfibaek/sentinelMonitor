/* globals $ app cookies */
app.render.sites = function () {
  window.location.hash = 'sites'
  app.render.loading('Loading sites..')
  app.database.getSites(cookies, function (res) {
    console.log('rendered: sites')
    var setup = `
      <div class='sitesScreen'>
        <h2>Monitoring</h2>
        <div class="siteHolder"></div>
        <div class="buttonHolder">
            <input type="button" name="create" class="button" value="Create New">
        </div>
      </div>`

    $('#app').empty().append(setup)

    // console.log(res)
    if (res.status === 'success' && res.message.length !== 0) {
      var allSites = res.message
      for (var i = 0; i < allSites.length; i += 1) {
        var site = allSites[i]
        $('.sitesScreen > .siteHolder').append(`
          <div class="site" name="${site.sitename}" timezone="${site.timezone}">
            <div class="head">
              <p class="name">${site.sitename}</p>
              <p class="date_top">${site.latest_image_time.slice(0, 10)}</p>
              <p class="date_bottom">${site.latest_image_time.slice(11, 16)} GMT</p>
            </div>
            <div class="foot">
              <div class="remove"><i class="fa fa-trash" aria-hidden="true"></i></div>
              <div class="options"><i class="fa fa-cog" aria-hidden="true"></i></div>
            </div>
            <img src="/image?uuid=${site.latest_image_uuid}" />
          </div>
          `)
      }

      $('.site').hover(function () {
        $(this).children('.foot').css('opacity', 1)
      }, function () {
        $(this).children('.foot').css('opacity', 0)
      })

      $('.site > .head, .site > img').click(function () {
        var sitename = `${$(this).parent().attr('name')}`
        var timezone = `${$(this).parent().attr('timezone')}`
        app.render.loading('Loading site..')
        app.database.getSite({
          'username': cookies.username,
          'site': sitename
        }, function (res) {
          if (res.status === 'success') {
            app.render.table({
              'sitename': sitename,
              'timezone': timezone,
              'images': res.message
            })
          } else {
            app.render.sites()
          }
        })
      })

      $('.site > .foot > .remove').on('click', function () {
        app.render.popup.deleteSite($(this).parent().parent().attr('name'))
      })

      $(document).on('keypress', function (event) {
        if (event.keyCode === 13) {
          $('input[name="create"]').click()
        }
      })

      $('.sitesScreen > .buttonHolder > input[name="create"]').on('click', function () {
        app.render.loading('Initializing..')
        setTimeout(function () {
          app.render.create()
        }, 300)
      })
    } else {
      app.render.create()
    }
  })
}

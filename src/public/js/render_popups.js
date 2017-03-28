/* globals $ app cookies */
app.render.popup = {
  deleteSite: function (sitename) {
    // console.log('rendered: popup(delete site?)')

    if (typeof (sitename) === 'undefined') { console.log('Unable to get site identity') } else {
      var setup = `
        <div class='popup'>
          <h4>Do you want to delete site: '${sitename}'?</h4>
          <div class="buttonHolder">
              <input type="button" name="back" class="button" value="Back">
              <input type="button" name="delete" class="button" value="Delete">
          </div>
        </div>
        `

      $('body').prepend(setup)
      $('.content').append('<div class="overlay"></div>')

      $('.content').one('mousedown', function (event) { $('.popup, .overlay').remove() })

      $(document).on('keypress', function (event) {
        if (event.keyCode === 27) { $('input[name="back"]').click() } // esc
        if (event.keyCode === 13) { $('input[name="delete"]').click() } // enter
      })

      $('.popup > .buttonHolder > input[name="delete"]').on('click', function () {
        $('.popup, .overlay').remove()
        $(document).off()
        $('.content').off()

        app.render.loading(`Deleting: ${sitename}..`)
        app.database.deleteSite({
          'session': cookies.session,
          'username': cookies.username,
          'site': sitename
        }, function (res) {
          console.log(res)
          app.render.sites()
        })
      })

      $('.popup > .buttonHolder > input[name="back"]').on('click', function () {
        $('.popup, .overlay').remove()
      })
    }
  },
  filter: function () {
    var today = new Date().toISOString().split('T')[0]
    var todayMinusThreeMonths = new Date().setMonth(new Date().getMonth() - 3)
    todayMinusThreeMonths = new Date(todayMinusThreeMonths).toISOString().split('T')[0]
    var setup = `
      <div class='popup filter'>
        <h2>Filter</h4>
        <div class="container">
          <form>
            <p>From:<input class="date" type="date" name="startdate" value="${todayMinusThreeMonths}"/></p>
            <p>To:<input class="date" type="date" name="enddate" value="${today}"/></p>
            <p class="clouds">Max Clouds (%) <i class="fa fa-cloud" aria-hidden="true"></i><input class="number" type="number" max="100" min="0" name="cloudcover" value="15"/></p>
            <p class="overlap">Min Overlap (%) <img src="css/images/overlap.png" /><input class="number" type="number" max="100" min="0" name="coverage" value="50"/></p>
          </form>
          <div class="buttonHolder">
            <input type="button" name="apply" class="button" value="Apply">
            <input type="button" name="back" class="button" value="Back">
          </div>
        </div>
      </div>
      `

    $('body').prepend(setup)
    $('.content').append('<div class="overlay"></div>')

    $('.content').one('mousedown', function (event) { $('.popup, .overlay').remove() })

    $(document).on('keypress', function (event) {
      if (event.keyCode === 27) { $('input[name="back"]').click() } // esc
      if (event.keyCode === 13) { $('input[name="delete"]').click() } // enter
    })

    $('.filter > .container > .buttonHolder > input[name="back"]').on('click', function () {
      $('.popup, .overlay').remove()
    })

    $('.filter > .container > .buttonHolder > input[name="apply"]').on('click', function () {
      $('tr[type="info"]').show()
      app.filter = []
      var startDate = new Date($('.filter > .container > form > p > input[name="startdate"]').val()).getTime()
      var endDate = new Date($('.filter > .container > form > p > input[name="enddate"]').val()).getTime()
      var cloudcover = Number($('.filter > .container > form > p > input[name="cloudcover"]').val())
      var coverage = Number($('.filter > .container > form > p > input[name="coverage"]').val())

      $('tr[type="info"]').each(function () {
        var imgRow = this
        var imgProps = {
          date: new Date($(this).find('[name="date"]').text()).getTime(),
          clouds: Number($(this).find('[name="clouds"]').text().slice(0, -1)),
          cover: Number($(this).find('[name="overlap"]').text().slice(0, -1))
        }
        if (imgProps.date > endDate || imgProps.date < startDate) { $(imgRow).hide() }
        if (imgProps.clouds > cloudcover) { $(imgRow).hide() }
        if (imgProps.cover < coverage) { $(imgRow).hide() }
        if (!$(imgRow).is(':visible')) { app.filter.push($(imgRow).attr('uuid')) }
      })

      $('.popup, .overlay').remove()
    })
  }
}

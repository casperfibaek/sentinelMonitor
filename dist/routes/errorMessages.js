var errorMessages = {
  endConnection: function (client, err, res) {
    client.end(function (err) {
      if (err) {
        console.log(err)
        return res.status(500).json({
          'status': 'error',
          'message': err
        })
      }
    })
  },
  queryError: function (err, res) {
    console.log('Error while querying database: ', err)
    return res.status(500).json({
      'status': 'error',
      'message': err
    })
  },
  serverError: function (err, res) {
    console.log('Error while connecting to database: ', err)
    return res.status(500).json({
      'status': 'error',
      'message': err
    })
  }
}

module.exports = errorMessages

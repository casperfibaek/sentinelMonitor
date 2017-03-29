const path = require('path')
const express = require('express')
const session = require('express-session')

const basic = require('./routes/index')
const auth = require('./routes/auth')
const getSites = require('./routes/sites/getSites')
const createSite = require('./routes/sites/createSite')
const deleteSite = require('./routes/sites/deleteSite')
const getImages = require('./routes/sites/getImages')

const bodyParser = require('body-parser')
const cors = require('cors')
// const port = process.env.PORT || 80
// const app = express()

// returns an instance of node-greenlock with additional helper methods
var lex = require('greenlock-express').create({
  server: 'staging', // set to https://acme-v01.api.letsencrypt.org/directory in production
  challenges: { 'http-01': require('le-challenge-fs').create({ webrootPath: '/tmp/acme-challenges' }) },
  store: require('le-store-certbot').create({ webrootPath: '/tmp/acme-challenges' }),
  approveDomains: approveDomains
})

function approveDomains (opts, certs, cb) {
  if (certs) {
    opts.domains = certs.altnames
  } else {
    opts.approveDomains = ['35.187.84.157']
    opts.email = 'casperfibaek@gmail.com'
    opts.agreeTos = true
  }
  cb(null, { options: opts, certs: certs })
}

require('http').createServer(lex.middleware(require('redirect-https')())).listen(80, function () {
  console.log('Listening for ACME http-01 challenges on', this.address())
})

var app = require('express')()
app.use(cors()) // Allow crossOrigin (remove after testing)
app.use(bodyParser.urlencoded({
  extended: true,
  parameterLimit: 10000,
  limit: 1024 * 1024 * 10 // 10mb
}))
app.use(bodyParser.json({
  extended: true,
  parameterLimit: 10000,
  limit: 1024 * 1024 * 10 // 10mb
}))
app.use(session({
  secret: 'un vie de file dleau',
  saveUninitialized: true,
  resave: true,
  name: 'sessionID'
}))
app.use(express.static(path.join(__dirname, 'public')))
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'hbs')
app.use('/', basic)
app.use('/', auth)
app.use('/', getSites)
app.use('/', createSite)
app.use('/', deleteSite)
app.use('/', getImages)
app.use(function (req, res, next) {
  res.status(404).render('error', {
    title: 'Page not found'
  })
})
// app.set('port', port)
// app.listen(app.get('port'), '0.0.0.0')

// handles your app
require('https').createServer(lex.httpsOptions, lex.middleware(app)).listen(443, function () {
  console.log('Listening for ACME tls-sni-01 challenges and serve app on', this.address())
})

// require('greenlock-express').create({
//   server: 'https://acme-v01.api.letsencrypt.org/directory',
//   email: 'casperfibaek@gmail.com',
//   agreeTos: true,
//   approveDomains: [ 'trig.dk/monitor' ],
//   app: require('express')()
//   .use(cors()) // Allow crossOrigin (remove after testing)
//   .use(bodyParser.urlencoded({
//     extended: true,
//     parameterLimit: 10000,
//     limit: 1024 * 1024 * 10 // 10mb
//   }))
//   .use(bodyParser.json({
//     extended: true,
//     parameterLimit: 10000,
//     limit: 1024 * 1024 * 10 // 10mb
//   }))
//   .use(session({
//     secret: 'un vie de file dleau',
//     saveUninitialized: true,
//     resave: true,
//     name: 'sessionID'
//   }))
//   .use(express.static(path.join(__dirname, 'public')))
//   .set('views', path.join(__dirname, 'views'))
//   .set('view engine', 'hbs')
//   .use('/', basic)
//   .use('/', auth)
//   .use('/', getSites)
//   .use('/', createSite)
//   .use('/', deleteSite)
//   .use('/', getImages)
//   .use(function (req, res, next) {
//     res.status(404).render('error', {
//       title: 'Page not found'
//     })
//   })
//
// }).listen(80, 443)

// app.use(cors()) // Allow crossOrigin (remove after testing)
// app.use(bodyParser.urlencoded({
//   extended: true,
//   parameterLimit: 10000,
//   limit: 1024 * 1024 * 10 // 10mb
// }))
// app.use(bodyParser.json({
//   extended: true,
//   parameterLimit: 10000,
//   limit: 1024 * 1024 * 10 // 10mb
// }))
// app.use(session({
//   secret: 'un vie de file dleau',
//   saveUninitialized: true,
//   resave: true,
//   name: 'sessionID'
// }))
// app.use(express.static(path.join(__dirname, 'public')))
// app.set('views', path.join(__dirname, 'views'))
// app.set('view engine', 'hbs')
// app.use('/', basic)
// app.use('/', auth)
// app.use('/', getSites)
// app.use('/', createSite)
// app.use('/', deleteSite)
// app.use('/', getImages)
// app.use(function (req, res, next) {
//   res.status(404).render('error', {
//     title: 'Page not found'
//   })
// })
// app.set('port', port)
// app.listen(app.get('port'), '0.0.0.0')
console.log('Monitor initialized..')

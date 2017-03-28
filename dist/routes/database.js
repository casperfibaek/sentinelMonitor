const type = 'postgres'
const user = 'postgres'
const password = 'blaahest08'
const ip = '127.0.0.1'
const port = '5432'
const database = 'postgres'

const secrets = {
  connectionString: `${type}://${user}:${password}@${ip}:${port}/${database}`,
  credentials: {
    main: {
      'user': 'casperfibaek',
      'pass': 'Goldfish12',
      'sendImmediately': true
    },
    secondary: {
      'user': 'trigSent',
      'pass': 'elephant',
      'sendImmediately': true
    }
  },
  NASAkey: '4VMM8Rp44kR5KU1zkiHTuOS4PrYUbPel5ePfE114'
}

module.exports = secrets

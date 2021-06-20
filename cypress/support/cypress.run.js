const cypress = require('cypress')

cypress.run({
  config: {
    baseUrl: 'http://localhost:8080'
  },
  env: {
    login_url: '/login',
    products_url: '/products'
  }
})

const { defineConfig } = require('cypress')

module.exports = defineConfig({
  e2e: {
    baseUrl: 'http://localhost:8080',
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
    supportFile: 'test/cypress/support/e2e.js',
    specPattern: 'test/cypress/e2e/**/*.cy.{js,jsx,ts,tsx}'
  },
})
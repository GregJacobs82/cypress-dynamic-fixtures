const { defineConfig } = require('cypress');
const { dynamicFixturePlugin } = require('../src/plugin');

module.exports = defineConfig({
    video: false,
    e2e: {
        supportFile: false,
        specPattern: 'test-e2e/specs/**/*.cy.js',
        fixturesFolder: 'test-e2e/fixtures',
        setupNodeEvents(on, config) {
            return dynamicFixturePlugin(on, config, { fixturesDir: config.fixturesFolder });
        }
    }
});

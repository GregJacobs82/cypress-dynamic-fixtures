const { dynamicFixturePlugin } = require('./plugin'); // Re-export the plugin so user can import it easily
require('./commands'); // commands.js overwrites `cy.fixture`

module.exports = {
    dynamicFixturePlugin
};

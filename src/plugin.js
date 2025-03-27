const path = require("path");
const glob = require("glob");
const {fixtureOverwriteCommand} = require('src/commands');

/**
 * Gathers all .js fixtures from cypress/fixtures (by default) and transforms them
 * into the "dash-to-camel" + "slash-to-$" keys, storing them in config.env.__ALL_JS_FIXTURES__.
 *
 * @param {Function} on - Cypress event hook
 * @param {Object} config - Cypress config object
 * @param {Object} [options] - Optional: in case you want to allow custom fixtureDir
 * @returns {Object} updated config
 */
function dynamicFixturePlugin(on, config, options = {}) {
    fixtureOverwriteCommand(Cypress);

    // By default, assume cypress/fixtures as the fixtures directory
    const fixturesDir = options.fixturesDir
        ? path.resolve(options.fixturesDir)
        : path.join(process.cwd(), "cypress", "fixtures");

    // Gather all .js files recursively
    const files = glob.sync("**/*.js", { cwd: fixturesDir });

    const allJsFixtures = {};

    files.forEach((relativeFilePath) => {
        const absolutePath = path.join(fixturesDir, relativeFilePath);

        // Dynamically require the fixture
        //  - If it has default export, use that; otherwise use the entire exported object
        const requiredExport = require(absolutePath);
        const fixtureData = requiredExport.default || requiredExport;

        // Transform "cards/square/card_invalid_cvv.js" => "cards$square$cardInvalidCvv"
        let noExt = relativeFilePath.replace(/\.js$/, "");
        let replaced = noExt.replace(/\//g, "$");
        let transformedKey = replaced.replace(/-([a-zA-Z])/g, (_, c) => c.toUpperCase());

        allJsFixtures[transformedKey] = fixtureData;
    });

    // Store the dictionary in Cypress env
    config.env.__ALL_JS_FIXTURES__ = allJsFixtures;

    // Return updated config
    return config;
}

module.exports = { dynamicFixturePlugin };

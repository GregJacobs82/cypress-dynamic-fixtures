function fixtureOverwriteCommand(Cypress) {
    Cypress.Commands.overwrite('fixture', (originalFn, filePath, encoding, options) => {
        if (filePath.endsWith('.js')) {
            // The plugin stored all our fixture data here
            const allJsFixtures = Cypress.env('__ALL_JS_FIXTURES__') || {};

            // Optional: some debug logging
            const isDebug = process.env.NODE_ENV !== 'production';
            if (isDebug) {
                console.log('[dynamic-fixtures] filePath =>', filePath);
                console.log('[dynamic-fixtures] allJsFixtures keys =>', Object.keys(allJsFixtures));
            }

            // Transform file path the same way we did in plugin.js
            let noExt = filePath.replace(/\.js$/, '');
            let replaced = noExt.replace(/\//g, '$');
            let transformedKey = replaced.replace(/-([a-zA-Z])/g, (_, c) => c.toUpperCase());

            if (isDebug) {
                console.log('[dynamic-fixtures] transformedKey =>', transformedKey);
            }

            // Return the matching object from the dictionary
            return Cypress.Promise.resolve(allJsFixtures[transformedKey]);
        }

        // For non .js fixtures, call the original fixture function
        return originalFn(filePath, encoding, options);
    });

    return Cypress;
}

module.exports = { fixtureOverwriteCommand };

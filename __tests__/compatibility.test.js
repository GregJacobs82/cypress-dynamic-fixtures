const fs = require('fs');
const os = require('os');
const path = require('path');

jest.mock('cypress/package.json', () => ({ version: '16.0.0' }), { virtual: true });

const { dynamicFixturePlugin } = require('../src/plugin');

describe('Cypress version compatibility', () => {
    let fixturesDir;
    beforeEach(() => {
        fixturesDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dynfix-compat-'));
        fs.writeFileSync(path.join(fixturesDir, 'computed-data.js'), 'module.exports = { answer: 42 };');
    });
    afterEach(() => {
        fs.rmSync(fixturesDir, { recursive: true, force: true });
        delete global.Cypress;
    });

    test.each([['14.0.0', 'env'], ['16.0.0', 'expose']])(
        '%s initializes missing %s storage', (version, storageKey) => {
            require('cypress/package.json').version = version;
            const config = dynamicFixturePlugin(jest.fn(), {}, { fixturesDir });
            expect(config[storageKey].__ALL_JS_FIXTURES__.computedData).toEqual({ answer: 42 });
        }
    );

    test.each([
        ['13.17.0', 'env'], ['14.5.0', 'env'], ['15.9.0', 'env'],
        ['15.10.0', 'expose'], ['15.21.0', 'expose'], ['16.0.0', 'expose']
    ])('%s stores and reads fixtures through %s', async (version, storageKey) => {
        require('cypress/package.json').version = version;
        const config = { env: { existing: true }, expose: { existing: true } };
        expect(dynamicFixturePlugin(jest.fn(), config, { fixturesDir })).toBe(config);
        expect(config[storageKey].existing).toBe(true);
        expect(config[storageKey].__ALL_JS_FIXTURES__).toEqual({ computedData: { answer: 42 } });
        const otherKey = storageKey === 'env' ? 'expose' : 'env';
        expect(config[otherKey]).toEqual({ existing: true });

        let overwrite;
        global.Cypress = {
            Promise,
            Commands: { overwrite: (_, fn) => { overwrite = fn; } },
            [storageKey]: jest.fn((key) => config[storageKey][key])
        };
        if (storageKey === 'expose' && !version.startsWith('16.')) {
            Cypress.env = jest.fn(() => { throw new Error('Removed API called'); });
        }
        jest.isolateModules(() => require('../src/commands'));
        const original = jest.fn();
        await expect(overwrite(original, 'computed-data.js')).resolves.toEqual({ answer: 42 });
        expect(original).not.toHaveBeenCalled();
        if (Cypress.env && storageKey === 'expose') expect(Cypress.env).not.toHaveBeenCalled();
    });
});

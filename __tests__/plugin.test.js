// __tests__/plugin.test.js
const fs = require('fs');
const path = require('path');
const os = require('os');

const { dynamicFixturePlugin } = require('../src/plugin.js');

describe('dynamicFixturePlugin', () => {
    let tmpDir;

    beforeEach(() => {
        tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dynfix-'));

        // Make nested dirs for fixtures
        fs.mkdirSync(path.join(tmpDir, 'cards', 'stripe'), { recursive: true });
        fs.mkdirSync(path.join(tmpDir, 'users'), { recursive: true });

        // Write CommonJS fixtures
        fs.writeFileSync(
            path.join(tmpDir, 'cards', 'stripe', 'card-success.js'),
            'module.exports = { number: "4242", cvc: "123" };'
        );
        fs.writeFileSync(
            path.join(tmpDir, 'users', 'john-doe.js'),
            'module.exports = { id: 7, name: "John Doe" };'
        );
    });

    afterEach(() => {
        // cleanup
        const rm = (p) => {
            if (fs.existsSync(p)) {
                const stat = fs.statSync(p);
                if (stat.isDirectory()) {
                    fs.readdirSync(p).forEach((f) => rm(path.join(p, f)));
                    fs.rmdirSync(p);
                } else {
                    fs.unlinkSync(p);
                }
            }
        };
        rm(tmpDir);
    });

    test('collects .js fixtures and stores them in config.env.__ALL_JS_FIXTURES__ with transformed keys', () => {
        const on = jest.fn();
        const config = { env: {} };

        const updated = dynamicFixturePlugin(on, config, { fixturesDir: tmpDir });
        const all = updated.env.__ALL_JS_FIXTURES__;

        // Key transform rule: remove .js, replace / with $, dash-to-camel
        //   cards/stripe/card-success.js -> cards$stripe$cardSuccess
        //   users/john-doe.js -> users$johnDoe
        expect(all).toBeDefined();
        expect(all['cards$stripe$cardSuccess']).toEqual({ number: '4242', cvc: '123' });
        expect(all['users$johnDoe']).toEqual({ id: 7, name: 'John Doe' });
    });
});

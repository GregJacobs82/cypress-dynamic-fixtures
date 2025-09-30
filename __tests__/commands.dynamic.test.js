const fs = require('fs');
const path = require('path');
const os = require('os');

const { dynamicFixturePlugin } = require('../src/plugin.js'); // adjust path if needed

describe('commands overwrite resolves dynamic JS fixtures', () => {
    let tmpDir;
    let savedOverwrite;

    beforeEach(() => {
        tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dynfix-'));

        fs.mkdirSync(path.join(tmpDir, 'utils'), { recursive: true });
        fs.mkdirSync(path.join(tmpDir, 'stripe'), { recursive: true });

        // Same util as above
        fs.writeFileSync(
            path.join(tmpDir, 'utils', 'futureExpDates.js'),
            `
      function pad2(n){ return String(n).padStart(2, '0'); }
      const now = new Date();
      const month = pad2(now.getMonth() + 1);
      const yearFull = now.getFullYear() + 2;
      const year = String(yearFull).slice(-2);
      const exp_date = month + '/' + year;
      module.exports = { month, year, exp_date };
      `
        );

        fs.writeFileSync(
            path.join(tmpDir, 'stripe', 'cardSuccess.js'),
            `
      const futureExpDates = require('../utils/futureExpDates');
      module.exports = {
        processor: 'stripe',
        name: 'StripeCard Success',
        card_number: '4242424242424242',
        cvv: '522',
        zip_code: '11372',
        ...futureExpDates
      };
      `
        );

        // Build env via the real plugin
        const on = jest.fn();
        const config = { env: {} };
        const updated = dynamicFixturePlugin(on, config, { fixturesDir: tmpDir });

        // Shim Cypress for the overwrite under test
        global.Cypress = {
            env: (k) => (k ? updated.env[k] : updated.env),
            Promise: Promise,
            Commands: {
                overwrite: (name, cb) => {
                    if (name === 'fixture') savedOverwrite = cb;
                }
            }
        };

        // Load the commands file (registers the overwrite)
        jest.resetModules();
        require('../src/commands.js'); // adjust path if needed
    });

    afterEach(() => {
        fs.rmSync(tmpDir, { recursive: true, force: true });
        delete global.Cypress;
        savedOverwrite = undefined;
    });

    test('overwritten cy.fixture returns computed JS object for stripe/cardSuccess.js', async () => {
        const originalFn = jest.fn(() => Promise.resolve({ from: 'original' }));

        // Call the overwritten fixture with the JS path used in real tests
        const result = await savedOverwrite(originalFn, 'stripe/cardSuccess.js');

        // Recompute expected parts
        const now = new Date();
        const pad2 = (n) => String(n).padStart(2, '0');
        const month = pad2(now.getMonth() + 1);
        const year = String(now.getFullYear() + 2).slice(-2);
        const exp_date = `${month}/${year}`;

        expect(result).toMatchObject({
            processor: 'stripe',
            name: 'StripeCard Success',
            card_number: '4242424242424242',
            cvv: '522',
            zip_code: '11372',
            month,
            year,
            exp_date
        });

        // Should NOT hit the original fixture loader for .js
        expect(originalFn).not.toHaveBeenCalled();
    });

    test('falls back to original for non-js fixtures', async () => {
        const originalFn = jest.fn(() => Promise.resolve({ from: 'json' }));
        const out = await savedOverwrite(originalFn, 'foo/bar.json');
        expect(originalFn).toHaveBeenCalledWith('foo/bar.json', undefined, undefined);
        expect(out).toEqual({ from: 'json' });
    });
});

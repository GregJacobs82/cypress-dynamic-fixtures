const fs = require('fs');
const path = require('path');
const os = require('os');

const { dynamicFixturePlugin } = require('../src/plugin.js'); // adjust path if needed

describe('dynamic fixtures via Node-side plugin', () => {
    let tmpDir;

    beforeEach(() => {
        tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dynfix-'));

        // Create nested folders
        fs.mkdirSync(path.join(tmpDir, 'utils'), { recursive: true });
        fs.mkdirSync(path.join(tmpDir, 'stripe'), { recursive: true });

        // Utils: dynamic date (native Date, no deps)
        fs.writeFileSync(
            path.join(tmpDir, 'utils', 'futureExpDates.js'),
            `
      function pad2(n){ return String(n).padStart(2, '0'); }
      const now = new Date();
      const month = pad2(now.getMonth() + 1);
      const yearFull = now.getFullYear() + 2; // +2 years
      const year = String(yearFull).slice(-2);
      const exp_date = month + '/' + year;

      module.exports = { month, year, exp_date };
      `
        );

        // Fixture that requires the util and spreads it
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
    });

    afterEach(() => {
        // Cleanup
        fs.rmSync(tmpDir, { recursive: true, force: true });
    });

    test('plugin loads a dynamic JS fixture that requires another JS module', () => {
        const on = jest.fn();
        const config = { env: {} };

        const updated = dynamicFixturePlugin(on, config, { fixturesDir: tmpDir });
        const all = updated.env.__ALL_JS_FIXTURES__;
        expect(all).toBeDefined();

        // Key transform rule in your plugin/commands:
        //   'stripe/cardSuccess.js' -> 'stripe$cardSuccess'
        const obj = all['stripe$cardSuccess'];
        expect(obj).toBeDefined();

        // Recompute expected date (same logic as util)
        const now = new Date();
        const pad2 = (n) => String(n).padStart(2, '0');
        const month = pad2(now.getMonth() + 1);
        const year = String(now.getFullYear() + 2).slice(-2);
        const exp_date = `${month}/${year}`;

        expect(obj).toMatchObject({
            processor: 'stripe',
            name: 'StripeCard Success',
            card_number: '4242424242424242',
            cvv: '522',
            zip_code: '11372',
            month,
            year,
            exp_date
        });
    });
});

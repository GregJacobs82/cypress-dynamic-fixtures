// __tests__/commands.test.js
const path = require('path');

describe('commands overwrite (fixture)', () => {
    let savedOverwrite;
    const fakeEnv = {
        __ALL_JS_FIXTURES__: {
            // keys mirror plugin transform: path no-ext, / -> $, dash-to-camel
            // e.g. 'fixturecards/stripe/card_success.js' becomes 'fixturecards$stripe$card_success' (no dash to camel since underscore)
            'fixturecards$stripe$card_success': { ok: true, type: 'underscore' },
            // 'cards/stripe/card-success.js' becomes 'cards$stripe$cardSuccess'
            'cards$stripe$cardSuccess': { number: '4242' }
        }
    };

    beforeEach(() => {
        // Provide a minimal Cypress shim
        global.Cypress = {
            env: (k) => (k ? fakeEnv[k] : fakeEnv),
            Promise: Promise,
            Commands: {
                overwrite: (name, cb) => {
                    if (name === 'fixture') savedOverwrite = cb;
                }
            }
        };

        // NODE_ENV !== 'production' to keep console logs ok
        process.env.NODE_ENV = 'test';

        // Require the commands module (this registers the overwrite)
        jest.resetModules();
        require('../src/commands.js');
    });

    afterEach(() => {
        delete global.Cypress;
        savedOverwrite = undefined;
    });

    test('returns JS fixture by transformed key (underscore case)', async () => {
        const originalFn = jest.fn(() => Promise.resolve({ shouldNot: 'happen' }));
        const filePath = 'fixturecards/stripe/card_success.js';

        const result = await savedOverwrite(originalFn, filePath);
        expect(result).toEqual({ ok: true, type: 'underscore' });
        expect(originalFn).not.toHaveBeenCalled();
    });

    test('returns JS fixture by transformed key (dash-to-camel case)', async () => {
        const originalFn = jest.fn();
        const filePath = 'cards/stripe/card-success.js';

        const result = await savedOverwrite(originalFn, filePath);
        expect(result).toEqual({ number: '4242' });
        expect(originalFn).not.toHaveBeenCalled();
    });

    test('falls back to original for non-.js fixtures', async () => {
        const originalFn = jest.fn(() => Promise.resolve({ from: 'json' }));
        const filePath = 'users/list.json';

        const result = await savedOverwrite(originalFn, filePath);
        expect(originalFn).toHaveBeenCalledWith(filePath, undefined, undefined);
        expect(result).toEqual({ from: 'json' });
    });
});

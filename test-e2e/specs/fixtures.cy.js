import '../..';

describe('dynamic fixtures compatibility', () => {
    it('loads computed nested fixtures with assertions and aliases', () => {
        cy.fixture('nested/computed-data.js').as('computed');
        cy.get('@computed').its('answer').should('equal', 42);
        cy.fixture('nested/computed-data.js').then((fixture) => {
            expect(new Date(fixture.generatedAt).getFullYear()).to.equal(new Date().getFullYear());
        });
    });

    it('preserves JSON loading with and without the extension', () => {
        cy.fixture('static.json').should('deep.equal', { source: 'json' });
        cy.fixture('static').should('deep.equal', { source: 'json' });
    });

    it('uses exposed data when the API is available', () => {
        if (typeof Cypress.expose === 'function') {
            expect(Cypress.expose('__ALL_JS_FIXTURES__')['nested$computedData'].answer).to.equal(42);
        }
    });
});

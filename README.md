<!-- BACK TO TOP -->
<a name="readme-top"></a>

# Cypress Dynamic Fixtures
#### by <a href="https://www.gregjacobs.com" target="_blank" rel="noopener">Greg Jacobs</a>

A simple Cypress command overwrite that allows loading `.js` fixture files. It scans your `cypress/fixtures` folder at test runtime and maps them to `cy.fixture('my_fixture.js')`.

View the repository on <a href="https://github.com/GregJacobs82/cypress-dynamic-fixtures" target="_blank" rel="noopener">Github</a>

<!-- TABLE OF CONTENTS -->
<details>
  <summary>Table of Contents</summary>
  <ol>
    <li><a href="#-installation">Installation</a></li>
    <li><a href="#-setup">Setup</a></li>
    <li><a href="#-usage">Usage</a></li>
    <li><a href="#-backwards-compatible">Backwards compatible</a></li>
    <li>
        <a href="#troubleshooting">Troubleshooting</a>
        <ul>
            <li><a href="#module-system-compatibility-commonjs-vs-esm">Module System Compatibility: CommonJS vs ESM</a></li>
            <li><a href="#alias-problems">Alias Problems</a></li>
        </ul>
    </li>
    <li><a href="#-final-notes">Final Notes</a></li>
    <li><a href="#-reference-links">Reference Links</a></li>
  </ol>
</details>

## ⇲ Installation

```bash
npm install --save-dev cypress-dynamic-fixtures
```
<p align="right"><a href="#readme-top">back to top ⬆️</a></p>

---
## ⛭ Setup

> ### 1. Load the plugin in Cypress config
> In your `cypress.config.js` (Cypress 10+), load our plugin so we can scan `.js` fixtures:
> 
> ```js
> // cypress.config.js
> const { defineConfig } = require('cypress');
> const { dynamicFixturePlugin } = require('cypress-dynamic-fixtures/plugin');
> 
> module.exports = defineConfig({
>   e2e: {
>     setupNodeEvents(on, config) {
>       // Hook up the plugin
>       return dynamicFixturePlugin(on, config);
>     },
>   },
> });
> ```
> 
> <blockquote> 
> Note: If you’re on older Cypress (<10), place the dynamicFixturePlugin call in your cypress/plugins/index.js, returning the updated config.
> </blockquote>

> ### 2. Import 
> In your `cypress/support/e2e.js`, just import the package to register the `cy.fixture()` overwrite command:
> ```js
> // cypress/support/e2e.js
> import 'cypress-dynamic-fixtures';
> ```

> ### 3. Done!
> You are all setup to use `.js` files for dynamic fixture data.

<p align="right"><a href="#readme-top">back to top ⬆️</a></p>

---

##  ⃕ Usage

> ### 1. Example Fixture.js 
> Create your new dynamic `.js` fixture file example:
> ```js
> // cypress/fixtures/subfolders_optional/dynamic_date_fixture.js
> const now = new Date();
> 
> module.exports = {
>     todaysDate: now,
> };
> ```

> ### 2. Example Spec.js 
> Use your dynamic data from fixtures in your test files using `cy.fixture()` 
> - **Be sure to include the `.js` extension** 
> ```js
> // ./example_spec.js
> Then('I expect todays date to exist', () => {
>     cy.fixture('dynamic_date_fixture.js') // NOTICE the inclusion of .js
>         .then((fixture) => cy.contains(fixture.todaysDate).should('exist'));
> });
> ```
<p align="right"><a href="#readme-top">back to top ⬆️</a></p>

---


##  ⃔ Backwards compatible

In your existing project, you can use cy.fixture() with static `.json` data just as before. Nothing breaks.
-  `cypress/fixtures/static_data.json`
   ```json
   {
       "staticDate": "2025-03-25"
   }
   ```
- `./existing_spec.js`
  ```js
  Then('I expect a static date to exist', () => {
      cy.fixture('static_data') // NOTICE no file extension required (optional: static_data.json)
          .then((fixture) => cy.contains(fixture.staticDate).should('exist'));
  });
  ```

<p align="right"><a href="#readme-top">back to top ⬆️</a></p>

---

## Troubleshooting
> ### Module System Compatibility: CommonJS vs ESM
> 
> Our package, **cypress-dynamic-fixtures**, is built using CommonJS. This means that all internal modules are loaded using `require()` and exported using `module.exports`. This approach works seamlessly in the default Node.js and Cypress environments.
> 
> > #### For CommonJS Users
> > 
> > If your project is configured with CommonJS (the default for many Node.js projects), you can use our package as shown in the examples without any extra configuration. For example:
> > 
> > - In your **cypress.config.js**:
> >   ```js
> >   const { dynamicFixturePlugin } = require('cypress-dynamic-fixtures/plugin');
> > 
> >   module.exports = defineConfig({
> >     e2e: {
> >       setupNodeEvents(on, config) {
> >         return dynamicFixturePlugin(on, config);
> >       },
> >     },
> >   });
> >   ```
> 
> _
> 
> > #### For ESM Users
> > If your project is using ECMAScript Modules (ESM), you may need to adjust your import statements slightly. For example:
> > 
> > 1. #### Update your package.json:
> >    - Make sure your project’s package.json includes "type": "module" to enable native ESM support.
> > 
> > 
> > 2. #### Importing the Plugin:
> >     - Use the ESM import syntax. For example:
> >     
> >     ```js
> >     // cypress.config.js
> >     import { defineConfig } from 'cypress';
> >     import { dynamicFixturePlugin } from 'cypress-dynamic-fixtures/plugin';
> >         
> >     export default defineConfig({
> >         e2e: {
> >             async setupNodeEvents(on, config) {
> >                 return await dynamicFixturePlugin(on, config);
> >             },
> >          },
> >      });
> >     ```
> > 3. #### If you run into issues, you might try a dynamic import:
> > 
> >     ```js
> >     const { dynamicFixturePlugin } = await import('cypress-dynamic-fixtures/plugin');
> >     ```
> > 4. #### Using in Support Files:
> >    - Similarly, in your support file, use the ESM import:
> > 
> >     ```js
> >     // cypress/support/e2e.js
> >     import 'cypress-dynamic-fixtures';
> >     ```
> 
> > #### Summary: CommonJS vs ESM
> > - CommonJS: Use require() and module.exports as shown in our examples.
> > 
> > - ESM: Ensure your project supports ESM (e.g., via "type": "module" in your package.json) and update your import statements accordingly.
> 
> If you encounter any issues with module resolution or environment configuration, please refer to the <a href="https://nodejs.org/api/esm.html" target="_blank" rel="noopener">Node.js ESM documentation</a> or open an issue on our project repository.

<p align="right"><a href="#readme-top">back to top ⬆️</a></p>

> ### Alias Problems
> 
> If you encounter issues with resolving module aliases (e.g., `Cannot find module '@/utils/someUtil.js'`), here is a possible solution:
> 
> > ### Optional: Use the `module-alias` Package
> > 
> > If you prefer to keep using alias paths (such as `@/utils/someUtil.js`), follow these steps:
> > 
> > 1. **Install module-alias:**
> > ```bash
> > npm install --save-dev module-alias
> > ```
> > 
> > 2. **Configure your `package.json`:**
> > 
> > - Add an _moduleAliases section to map your alias:
> > ```json
> > {
> >     "_moduleAliases": {
> >         "@": "cypress"
> >     }
> > }
> > ```
> > 
> > 3. **Register module-alias at runtime:**
> > - At the very top of your main entry file (e.g., in your `cypress.config.js`), be sure to register module-alias package to use your aliases:
> > 
> > ```js
> > require('module-alias/register'); // NOTE: Registers runtime module aliases (Babel aliases only work during transpilation)
> > const { dynamicFixturePlugin } = require('cypress-dynamic-fixtures/plugin');
> > 
> > module.exports = {
> >     e2e: {
> >         setupNodeEvents(on, config) {
> >             return dynamicFixturePlugin(on, config);
> >         },
> >     },
> > };
> > ```
> > This ensures that when your fixture files use aliases, Node can correctly resolve them at runtime.


<p align="right"><a href="#readme-top">back to top ⬆️</a></p>

---

## 📝 Final Notes:
That’s it! Just install, reference the plugin in cypress.config.js, and import cypress-dynamic-fixtures in your support file. You’re all set to enjoy dynamic .js fixture data in Cypress.

<p align="right"><a href="#readme-top">back to top ⬆️</a></p>

---

## 🔗 Reference Links:

- [Cypress](https://www.cypress.io/)
- [Cypress.io - Plugins & Fixtures](https://docs.cypress.io/guides/core-concepts/plugins-and-fixtures)
- [GitHub - cypress-dynamic-fixtures](https://github.com/gregjacobs/cypress-dynamic-fixtures)
- [Node.js ESM](https://nodejs.org/api/esm.html)

<p align="right"><a href="#readme-top">back to top ⬆️</a></p>


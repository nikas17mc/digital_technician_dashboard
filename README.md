# new_version — Digital Technician Dashboard (work-in-progress)

![Version](https://img.shields.io/badge/version-0.0.1-blue)
![Node.js](https://img.shields.io/badge/node-18%2B-brightgreen)
![License](https://img.shields.io/badge/license-MIT-green)

This folder (new_version/) contains an early-stage refactor of the Digital Technician Dashboard into an ES module (ESM) structure. It is a work-in-progress and is not yet feature-complete. This README documents the current files, known issues, and recommended steps to run, finish the migration and contribute.

Table of Contents
- Overview
- What’s included
- Status & known issues
- Tech stack
- Prerequisites
- Quick start (recommended)
- Minimal app example (ESM)
- Migrating CommonJS → ESM (practical tips)
- Suggested package.json scripts
- Next steps / TODO
- Troubleshooting
- Contributing
- License

Overview
--------
The new_version folder is an in-repo, parallel effort to refactor the application to ES modules, cleaner route separation and modern patterns. It is intentionally separate from the main (CommonJS) codebase so you can iterate without breaking the stable app.

What’s included
---------------
Files present in this folder (based on current snapshot):

- package.json — package metadata: note `"type": "module"` (ESM).
- models/ConfigManager.js — skeleton ESM class (currently incomplete / contains a typo).
- routes/devices.routes.js — very small stub using CommonJS-style exports and unimplemented router logic.
- routes/users.routes.js — another stub similar to devices.routes.js.

Status & known issues
---------------------
This folder is incomplete. Key observations:

- package.json is configured for ESM (type: "module") and lists dependencies. Good for modern Node setups.
- models/ConfigManager.js currently contains an invalid implementation:
  - The file exports a class but the constructor is misspelled (`constroctor`), making it unusable.
- routes/devices.routes.js and routes/users.routes.js are stubbed and still use CommonJS patterns and unfinished code.
- There is no app.js or server entry in this folder. To run, add a minimal ESM entrypoint or integrate into a larger app.

Tech stack
----------
- Node.js (ES Modules — package.json "type": "module")
- Express 5.x (expected)
- Pug (templating) — implied by main app, may be reused
- fs-extra, moment, and others declared in package.json dependencies

Prerequisites
-------------
- Node.js 18+ (recommended)
- npm (or yarn)
- Familiarity with ESM imports/exports and migrating from CommonJS

Quick start (recommended)
-------------------------
1. Open a terminal and change into the new_version folder:
   ```bash
   cd new_version
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Add a minimal entrypoint (app.js) or adapt the provided example below.

4. Create scripts in package.json (see Suggested package.json scripts).

5. Run the app:
   ```bash
   npm run dev   # or npm start after you've added scripts
   ```

Minimal app example (ESM)
-------------------------
Create a minimal `app.js` at new_version/app.js to quickly run and test route/module loading. This example uses ESM imports and a simple Express server:

```js
// new_version/app.js
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

// Example: simple health endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', folder: 'new_version' });
});

// If you implement routes, import them as ESM:
// import devicesRouter from './routes/devices.routes.js';
// app.use('/devices', devicesRouter);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`new_version server listening on http://localhost:${PORT}`);
});
```

Migrating CommonJS → ESM (practical tips)
----------------------------------------
If you decide to finish the ESM migration, follow these practical guidelines.

1. Replace require(...) with import:
   - CommonJS: `const express = require('express');`
   - ESM: `import express from 'express';`

2. Replace module.exports / exports with ESM export:
   - CommonJS: `module.exports = router;`
   - ESM: `export default router;`

3. When using __dirname / __filename, use:
   ```js
   import path from 'path';
   import { fileURLToPath } from 'url';
   const __filename = fileURLToPath(import.meta.url);
   const __dirname = path.dirname(__filename);
   ```

4. For third-party CommonJS-only modules:
   - Most popular packages support ESM or are compatible with Node's interop.
   - If necessary, import them dynamically:
     ```js
     const pkg = await import('some-cjs-package');
     const fn = pkg.default || pkg;
     ```

5. Fix small errors in current files:
   - models/ConfigManager.js currently:
     ```js
     export class ConfigManager {
         constroctor() {

         }
     }
     ```
     Change to a valid ESM class:
     ```js
     export class ConfigManager {
       constructor() {
         // initialize defaults here
       }
     }
     ```
   - Routes should be converted to ESM and exported as default objects.

Suggested package.json scripts
------------------------------
Update new_version/package.json with helpful scripts. Example snippet (merge into existing package.json):

```json
"scripts": {
  "start": "node app.js",
  "dev": "nodemon --watch ./ --exec \"node app.js\"",
  "lint": "eslint . --ext .js",
  "test": "echo \"No tests yet\" && exit 0"
}
```

Next steps / TODO
-----------------
- Implement a proper ConfigManager (constructor, methods) or port the full implementation from the main branch.
- Replace route stubs with real route logic and export as ESM (export default router).
- Add an ESM-compatible app.js bootstrap (see example above).
- Add dotenv support if environment variables are needed (install `dotenv` and load in app.js).
- Add tests and linting rules (ESLint with ESM config).
- Decide whether to keep the rest of the repository CommonJS or fully migrate the entire project to ESM.
- Add documentation and examples inside this folder for how new modules should be authored.

Troubleshooting
---------------
- Unexpected token 'export' or 'import' errors:
  - Ensure package.json contains `"type": "module"` or use .mjs file extensions.
- Route files still using `require` / `module.exports`:
  - Convert them to ESM imports/exports or switch package.json to `"type": "commonjs"` (not recommended if you want ESM).
- Misspelled identifiers (e.g. `constroctor`) cause runtime errors:
  - Fix typos and run `node app.js` again; use `npm run dev` with nodemon for iterative development.

Contributing
------------
This folder is a work-in-progress. If you want to contribute:

- Follow the ESM style (imports, exports).
- Keep changes small and focused: fix one route / module at a time.
- Add tests for behavioral code (ConfigManager behavior, route handlers).
- Document API endpoints in this folder (if they differ from the main app).
- Open a PR against the branch that contains this folder and describe your changes and how to test them.

A suggested small contribution workflow:
1. Fork the repository / checkout a new branch.
2. Implement a single module (e.g., fix ConfigManager).
3. Add a minimal test or manual test instructions in a small README snippet.
4. Open a PR explaining the change and how to run it (example: `cd new_version && npm install && npm run dev`).

License
-------
This folder follows the repository license: MIT. See the top-level LICENSE file for details.

Acknowledgements
----------------
This refactor was started to move the project toward a modular, ESM-based architecture for better interoperability with modern Node.js tooling.

If you'd like, I can:
- Create a complete, runnable new_version example with a working app.js, fixed ConfigManager and at least one working route (devices/users), or
- Provide an automated codemod (small script) that converts CommonJS-style files in this folder to ESM.

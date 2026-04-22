# CLAUDE.md

## Project

**hq** — a minimal, self-hosted browser headquarters. Vanilla JS + HTML + CSS, no build step, no framework.

## Philosophy

- **Suckless**: small, readable, zero unnecessary abstractions. Three similar lines > premature abstraction.
- **TDD**: tests must be written before or alongside any logic. No untested logic ships.
- **Minimal deps**: Deno as runtime only. No npm, no bundler, no framework.

## Structure

```
hq/
├── index.html        SPA shell (<nav id="hq-nav">, <main id="hq-main">)
├── hq.js             Deno HTTP server (static files + /api/pages)
├── hq.css            all styles
├── build.sh          test runner (runs all tests/*.test.js)
├── src/
│   ├── router.js     hash router + app init; imports DOM at module level
│   ├── store.js      localStorage config (load/save/reset); no DOM
│   ├── nav.js        pure logic (activeItems, reorder, toggle) + DOM render()
│   ├── home.js       homepage block renderer; DOM only
│   └── adm.js        admin dashboard; DOM only
├── pages/            user's own pages/apps; auto-discovered by /api/pages
└── tests/
    ├── harness.js    custom harness: test(), assert(), assertEquals(), assertThrows(), summary()
    ├── nav.test.js
    └── store.test.js
```

## Key conventions

- **Pure functions first**: keep logic free of DOM/browser globals so it can be tested in Deno directly.
- **DOM-dependent code** (router, home, adm) is not unit-tested; test the pure functions that feed it.
- `src/store.js` and `src/nav.js` pure exports must remain importable in Deno without a browser shim.
- Config shape: `{ nav: [{id, label, href, active, type?}], home: { blocks: [{title, theme, links:[{label,href,icon}]}] } }`
- Nav item `id:"adm"` is protected — it cannot be removed, only toggled.
- Hash routing: `#adm` → adm page, anything else → home page.

## Running

```sh
deno run --allow-net --allow-read hq.js        # serves on :8000
deno run --allow-net --allow-read hq.js 9000   # custom port
```

## Testing

```sh
./build.sh                                      # full suite
deno run --allow-read --allow-env tests/nav.test.js    # single file
```

All test files live in `tests/`, named `*.test.js`. Each imports from `./harness.js` and calls `summary()` at the end. `build.sh` discovers them via glob.

## Adding tests

Use the custom harness — never use Deno's built-in `Deno.test`. Pattern:

```js
import { test, assert, assertEquals, summary } from "./harness.js";
import { myFn } from "../src/mymodule.js";

test("describes what it checks", () => {
  assertEquals(myFn(input), expected);
});

summary();
```

## Security

Currently assumes a local, trusted network. No auth yet. Do not add authentication scaffolding until explicitly requested.

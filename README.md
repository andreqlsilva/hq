# hq

A minimal, self-hosted browser headquarters. Manage a custom homepage and link it to your own pages and tools.

## Philosophy

- Suckless: small, readable, no unnecessary abstractions
- TDD: tests live alongside code, run before any change ships
- Minimal deps: Deno as runtime, nothing else required

## Structure

```
hq/
├── index.html        main SPA entry
├── hq.js             Deno HTTP server (static files + /api/pages)
├── hq.css            styles
├── build.sh          test runner
├── src/
│   ├── router.js     hash router, app init
│   ├── store.js      config persistence (localStorage)
│   ├── nav.js        nav bar: pure logic + DOM render
│   ├── home.js       homepage block renderer
│   └── adm.js        admin dashboard
├── pages/            drop your pages/apps here
└── tests/
    ├── harness.js    custom test harness
    ├── store.test.js
    └── nav.test.js
```

## Run

```sh
deno run --allow-net --allow-read hq.js        # default port 8000
deno run --allow-net --allow-read hq.js 9000   # custom port
```

## Test

```sh
./test.sh
```

Each `tests/*.test.js` is also runnable directly:

```sh
deno run --allow-read --allow-env tests/nav.test.js
```

## Adding pages

Drop any `.js`, `.ts`, `.html`, or directory into `pages/`. The adm dashboard auto-discovers entries via `/api/pages` and lists them as candidates when adding nav links.

## Config

Stored in `localStorage` under the key `hq:config`. Reset via the browser console:

```js
localStorage.removeItem("hq:config"); location.reload();
```

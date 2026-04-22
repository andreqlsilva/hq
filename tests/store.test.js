// tests/store.test.js

import { test, assert, assertEquals, summary } from "./harness.js";

// Minimal localStorage mock — must be set before importing store.js
globalThis.localStorage = (() => {
  let data = {};
  return {
    getItem:    k    => data[k] ?? null,
    setItem:    (k, v) => { data[k] = String(v); },
    removeItem: k    => { delete data[k]; },
    clear:      ()   => { data = {}; },
    _raw:       ()   => data,
  };
})();

if (typeof globalThis.structuredClone === "undefined") {
  globalThis.structuredClone = obj => JSON.parse(JSON.stringify(obj));
}

const { load, save, reset, DEFAULTS } = await import("../src/store.js");

test("load returns defaults when storage is empty", () => {
  localStorage.clear();
  const cfg = load();
  assertEquals(cfg.nav.length, DEFAULTS.nav.length);
  assertEquals(cfg.nav[0].id, "adm");
  assertEquals(cfg.home.blocks.length, 0);
});

test("load returns a fresh clone each call (no shared reference)", () => {
  localStorage.clear();
  const a = load();
  const b = load();
  a.nav.push({ id: "x" });
  assert(b.nav.length === DEFAULTS.nav.length, "second load should be independent");
});

test("save and load roundtrip", () => {
  localStorage.clear();
  const cfg = { nav: [{ id: "home", label: "home", href: "#", active: true }], home: { blocks: [] } };
  save(cfg);
  const loaded = load();
  assertEquals(loaded.nav[0].id, "home");
});

test("load merges missing top-level keys from DEFAULTS", () => {
  localStorage.clear();
  localStorage.setItem("hq:config", JSON.stringify({ nav: [] }));
  const cfg = load();
  assert("home" in cfg, "home key should be present after merge");
});

test("reset clears config; next load returns defaults", () => {
  save({ nav: [], home: { blocks: [{ title: "x" }] } });
  reset();
  const cfg = load();
  assertEquals(cfg.nav[0].id, "adm");
  assertEquals(cfg.home.blocks.length, 0);
});

test("load handles corrupt JSON gracefully", () => {
  localStorage.setItem("hq:config", "}{not valid json");
  const cfg = load();
  assertEquals(cfg.nav[0].id, "adm");
});

summary();

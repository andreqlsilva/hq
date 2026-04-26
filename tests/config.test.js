// tests/config.test.js
// Requires a running Postgres instance: DATABASE_URL env var

import { test, assert, assertEquals, summary } from "./harness.js";
import { Client } from "jsr:@db/postgres";
import { loadConfig, saveConfig, DEFAULTS, componentClient } from "../src/db.js";

const client = new Client(Deno.env.get("DATABASE_URL"));
await client.connect();

// Clean slate before each run
await client.queryArray("DROP TABLE IF EXISTS hq_config");
await client.queryArray('DROP SCHEMA IF EXISTS "test_comp" CASCADE');
await client.queryArray('DROP SCHEMA IF EXISTS "test_comp2" CASCADE');

const DDL = `
  CREATE TABLE hq_config (
    id      INTEGER PRIMARY KEY DEFAULT 1,
    config  JSONB NOT NULL,
    CONSTRAINT single_row CHECK (id = 1)
  )
`;
await client.queryArray(DDL);

test("loadConfig returns defaults when table is empty", async () => {
  const cfg = await loadConfig(client);
  assertEquals(cfg.nav.length, DEFAULTS.nav.length);
  assertEquals(cfg.nav[0].id, DEFAULTS.nav[0].id);
});

test("loadConfig returns a fresh clone each call", async () => {
  const a = await loadConfig(client);
  const b = await loadConfig(client);
  a.nav.push({ id: "x" });
  assert(b.nav.length === DEFAULTS.nav.length, "second load should be independent");
});

test("saveConfig and loadConfig roundtrip", async () => {
  const cfg = { nav: [{ id: "adm", label: "adm", href: "#adm", active: true }] };
  await saveConfig(client, cfg);
  const loaded = await loadConfig(client);
  assertEquals(loaded.nav[0].id, "adm");
});

test("saveConfig overwrites previous config", async () => {
  await saveConfig(client, { nav: [{ id: "a" }] });
  await saveConfig(client, { nav: [{ id: "b" }] });
  const loaded = await loadConfig(client);
  assertEquals(loaded.nav[0].id, "b");
});

test("loadConfig merges missing top-level keys from DEFAULTS", async () => {
  await client.queryArray("UPDATE hq_config SET config = $1 WHERE id = 1", [JSON.stringify({})]);
  const cfg = await loadConfig(client);
  assert("nav" in cfg, "nav key should be present after merge");
});

test("componentClient sets search_path to component schema", async () => {
  const c = await componentClient("test_comp");
  const r = await c.queryObject("SELECT current_schema() AS s");
  assertEquals(r.rows[0].s, "test_comp");
  await c.end();
});

test("componentClient tables are isolated per component", async () => {
  const c1 = await componentClient("test_comp");
  await c1.queryArray("CREATE TABLE items (id serial PRIMARY KEY)");
  await c1.end();

  const c2 = await componentClient("test_comp2");
  let threw = false;
  try { await c2.queryArray("SELECT * FROM items"); } catch { threw = true; }
  assert(threw, "test_comp2 should not see test_comp tables");
  await c2.end();
});

test("componentClient schema persists across connections", async () => {
  const c1 = await componentClient("test_comp");
  await c1.queryArray("INSERT INTO items DEFAULT VALUES");
  await c1.end();

  const c2 = await componentClient("test_comp");
  const r = await c2.queryObject("SELECT COUNT(*)::int AS n FROM items");
  assertEquals(r.rows[0].n, 1);
  await c2.end();
});

await summary();
await client.queryArray("DROP TABLE IF EXISTS hq_config");
await client.end();

// tests/config.test.js
// Requires a running Postgres instance: DATABASE_URL env var

import { test, assert, assertEquals, summary } from "./harness.js";
import { Client } from "jsr:@db/postgres";
import { loadConfig, saveConfig, DEFAULTS } from "../src/db.js";

const client = new Client(Deno.env.get("DATABASE_URL"));
await client.connect();

// Clean slate before each run
await client.queryArray("DROP TABLE IF EXISTS hq_config");

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
  assertEquals(cfg.nav[0].id, "adm");
  assertEquals(cfg.home.blocks.length, 0);
});

test("loadConfig returns a fresh clone each call", async () => {
  const a = await loadConfig(client);
  const b = await loadConfig(client);
  a.nav.push({ id: "x" });
  assert(b.nav.length === DEFAULTS.nav.length, "second load should be independent");
});

test("saveConfig and loadConfig roundtrip", async () => {
  const cfg = { nav: [{ id: "adm", label: "adm", href: "#adm", active: true }], home: { blocks: [{ title: "test", theme: "", links: [] }] } };
  await saveConfig(client, cfg);
  const loaded = await loadConfig(client);
  assertEquals(loaded.home.blocks[0].title, "test");
});

test("saveConfig overwrites previous config", async () => {
  await saveConfig(client, { nav: [], home: { blocks: [{ title: "a" }] } });
  await saveConfig(client, { nav: [], home: { blocks: [{ title: "b" }] } });
  const loaded = await loadConfig(client);
  assertEquals(loaded.home.blocks[0].title, "b");
});

test("loadConfig merges missing top-level keys from DEFAULTS", async () => {
  await client.queryArray("UPDATE hq_config SET config = $1 WHERE id = 1", [JSON.stringify({ nav: [] })]);
  const cfg = await loadConfig(client);
  assert("home" in cfg, "home key should be present after merge");
});

await summary();
await client.end();

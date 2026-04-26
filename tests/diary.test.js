// tests/diary.test.js
// Requires a running Postgres instance: DATABASE_URL env var

import { test, assert, assertEquals, summary } from "./harness.js";
import { Client } from "jsr:@db/postgres";
import { setup, makeRoutes } from "../pages/diary/server.js";

const client = new Client(Deno.env.get("DATABASE_URL"));
await client.connect();
await client.queryArray('DROP SCHEMA IF EXISTS "diary_test" CASCADE');
await client.queryArray('CREATE SCHEMA "diary_test"');
await client.queryArray('SET search_path TO "diary_test"');
await setup(client);

const tmpUploads = await Deno.makeTempDir();
const routes = makeRoutes(client, tmpUploads + "/");

function req(method, path, body) {
  return new Request(`http://localhost/api/pages/diary${path}`, {
    method,
    headers: body ? { "content-type": "application/json" } : {},
    body: body ? JSON.stringify(body) : undefined,
  });
}

test("GET /schema returns field definitions", async () => {
  const res = await routes["GET /schema"](req("GET", "/schema"));
  assertEquals(res.status, 200);
  const schema = await res.json();
  assert(Array.isArray(schema.fields), "fields should be an array");
  assert(schema.fields.length > 0, "fields should not be empty");
});

test("GET /entries without date returns 400", async () => {
  const res = await routes["GET /entries"](req("GET", "/entries"));
  assertEquals(res.status, 400);
});

test("GET /entries returns empty array for date with no entries", async () => {
  const res = await routes["GET /entries"](req("GET", "/entries?date=2000-01-01"));
  assertEquals(res.status, 200);
  assertEquals(await res.json(), []);
});

test("POST /entries creates an entry", async () => {
  const res = await routes["POST /entries"](req("POST", "/entries", {
    date: "2026-04-26",
    data: { description: "Coffee", value: 3.5, deductible: false },
  }));
  assertEquals(res.status, 201);
  const entry = await res.json();
  assertEquals(entry.date, "2026-04-26");
  assertEquals(entry.data.description, "Coffee");
  assert(entry.id > 0);
});

test("POST /entries without date returns 400", async () => {
  const res = await routes["POST /entries"](req("POST", "/entries", { data: {} }));
  assertEquals(res.status, 400);
});

test("GET /entries returns entries for a date with files array", async () => {
  await routes["POST /entries"](req("POST", "/entries", { date: "2026-04-27", data: { description: "Lunch" } }));
  await routes["POST /entries"](req("POST", "/entries", { date: "2026-04-27", data: { description: "Dinner" } }));
  const res = await routes["GET /entries"](req("GET", "/entries?date=2026-04-27"));
  const entries = await res.json();
  assertEquals(entries.length, 2);
  assert(Array.isArray(entries[0].files), "entry should have a files array");
  assertEquals(entries[0].files.length, 0);
});

test("PATCH /entries/:id updates entry data", async () => {
  const created = await (await routes["POST /entries"](req("POST", "/entries", {
    date: "2026-04-26", data: { description: "Original" },
  }))).json();

  const res = await routes["PATCH /entries/:id"](
    req("PATCH", `/entries/${created.id}`, { data: { description: "Updated", value: 9.99 } }),
    { id: String(created.id) },
  );
  assertEquals(res.status, 200);
  const updated = await res.json();
  assertEquals(updated.data.description, "Updated");
  assertEquals(updated.data.value, 9.99);
});

test("PATCH /entries/:id on missing entry returns 404", async () => {
  const res = await routes["PATCH /entries/:id"](
    req("PATCH", "/entries/999999", { data: {} }),
    { id: "999999" },
  );
  assertEquals(res.status, 404);
});

test("DELETE /entries/:id removes the entry", async () => {
  const created = await (await routes["POST /entries"](req("POST", "/entries", {
    date: "2026-04-26", data: { description: "To delete" },
  }))).json();

  const del = await routes["DELETE /entries/:id"](req("DELETE", `/entries/${created.id}`), { id: String(created.id) });
  assertEquals(del.status, 204);

  const list = await (await routes["GET /entries"](req("GET", "/entries?date=2026-04-26"))).json();
  assert(!list.find(e => e.id === created.id), "entry should be gone");
});

test("POST /entries/:id/files uploads a file and GET /files/:id retrieves it", async () => {
  const entry = await (await routes["POST /entries"](req("POST", "/entries", {
    date: "2026-04-26", data: {},
  }))).json();

  const form = new FormData();
  form.append("file", new File(["receipt content"], "receipt.txt", { type: "text/plain" }));
  const uploadReq = new Request(`http://localhost/api/pages/diary/entries/${entry.id}/files`, {
    method: "POST", body: form,
  });

  const uploadRes = await routes["POST /entries/:id/files"](uploadReq, { id: String(entry.id) });
  assertEquals(uploadRes.status, 201);
  const file = await uploadRes.json();
  assertEquals(file.filename, "receipt.txt");
  assert(file.id > 0);

  const downloadRes = await routes["GET /files/:id"](req("GET", `/files/${file.id}`), { id: String(file.id) });
  assertEquals(downloadRes.status, 200);
  assertEquals(await downloadRes.text(), "receipt content");
});

test("DELETE /files/:id removes file record and disk file", async () => {
  const entry = await (await routes["POST /entries"](req("POST", "/entries", {
    date: "2026-04-26", data: {},
  }))).json();

  const form = new FormData();
  form.append("file", new File(["data"], "invoice.txt", { type: "text/plain" }));
  const uploadReq = new Request(`http://localhost/api/pages/diary/entries/${entry.id}/files`, {
    method: "POST", body: form,
  });
  const file = await (await routes["POST /entries/:id/files"](uploadReq, { id: String(entry.id) })).json();

  const del = await routes["DELETE /files/:id"](req("DELETE", `/files/${file.id}`), { id: String(file.id) });
  assertEquals(del.status, 204);

  const again = await routes["GET /files/:id"](req("GET", `/files/${file.id}`), { id: String(file.id) });
  assertEquals(again.status, 404);
});

test("DELETE /entries/:id cascades to files", async () => {
  const entry = await (await routes["POST /entries"](req("POST", "/entries", {
    date: "2026-04-26", data: {},
  }))).json();

  const form = new FormData();
  form.append("file", new File(["x"], "x.txt", { type: "text/plain" }));
  const uploadReq = new Request(`http://localhost/api/pages/diary/entries/${entry.id}/files`, {
    method: "POST", body: form,
  });
  const file = await (await routes["POST /entries/:id/files"](uploadReq, { id: String(entry.id) })).json();

  await routes["DELETE /entries/:id"](req("DELETE", `/entries/${entry.id}`), { id: String(entry.id) });

  const r = await client.queryObject("SELECT id FROM files WHERE id = $1", [file.id]);
  assertEquals(r.rows.length, 0, "file record should be cascade-deleted");
});

await summary();
await client.queryArray('DROP SCHEMA IF EXISTS "diary_test" CASCADE');
await Deno.remove(tmpUploads, { recursive: true });
await client.end();

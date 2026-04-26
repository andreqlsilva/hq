import { componentClient } from "../../src/db.js";

const dir = new URL(".", import.meta.url).pathname;

export async function setup(client) {
  await client.queryArray(`
    CREATE TABLE IF NOT EXISTS entries (
      id    SERIAL PRIMARY KEY,
      date  DATE NOT NULL,
      data  JSONB NOT NULL DEFAULT '{}'
    )
  `);
  await client.queryArray(`
    CREATE TABLE IF NOT EXISTS files (
      id        SERIAL PRIMARY KEY,
      entry_id  INTEGER NOT NULL REFERENCES entries(id) ON DELETE CASCADE,
      filename  TEXT NOT NULL,
      mime      TEXT NOT NULL,
      path      TEXT NOT NULL
    )
  `);
}

export function makeRoutes(client, uploadsDir = dir + "uploads/") {
  const json = (data, status = 200) =>
    new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json" } });

  return {
    "GET /schema": async () => {
      const schema = JSON.parse(await Deno.readTextFile(dir + "schema.json"));
      return json(schema);
    },

    "GET /entries": async (req) => {
      const date = new URL(req.url).searchParams.get("date");
      if (!date) return new Response("missing date", { status: 400 });
      const r = await client.queryObject(
        `SELECT e.id, e.date::text, e.data,
           COALESCE(
             json_agg(json_build_object('id', f.id, 'filename', f.filename, 'mime', f.mime) ORDER BY f.id)
             FILTER (WHERE f.id IS NOT NULL),
             '[]'::json
           ) AS files
         FROM entries e
         LEFT JOIN files f ON f.entry_id = e.id
         WHERE e.date = $1
         GROUP BY e.id
         ORDER BY e.id`,
        [date],
      );
      return json(r.rows);
    },

    "POST /entries": async (req) => {
      const { date, data = {} } = await req.json();
      if (!date) return new Response("missing date", { status: 400 });
      const r = await client.queryObject(
        "INSERT INTO entries (date, data) VALUES ($1, $2) RETURNING id, date::text, data",
        [date, JSON.stringify(data)],
      );
      return json(r.rows[0], 201);
    },

    "PATCH /entries/:id": async (req, { id }) => {
      const { data } = await req.json();
      const r = await client.queryObject(
        "UPDATE entries SET data = $1 WHERE id = $2 RETURNING id, date::text, data",
        [JSON.stringify(data), id],
      );
      if (!r.rows.length) return new Response("not found", { status: 404 });
      return json(r.rows[0]);
    },

    "DELETE /entries/:id": async (req, { id }) => {
      await client.queryArray("DELETE FROM entries WHERE id = $1", [id]);
      return new Response(null, { status: 204 });
    },

    "POST /entries/:id/files": async (req, { id }) => {
      const form = await req.formData();
      const file = form.get("file");
      if (!file) return new Response("missing file", { status: 400 });
      const entryDir = `${uploadsDir}${id}/`;
      await Deno.mkdir(entryDir, { recursive: true });
      const path = `${entryDir}${file.name}`;
      await Deno.writeFile(path, new Uint8Array(await file.arrayBuffer()));
      const r = await client.queryObject(
        "INSERT INTO files (entry_id, filename, mime, path) VALUES ($1, $2, $3, $4) RETURNING id, filename, mime",
        [id, file.name, file.type || "application/octet-stream", path],
      );
      return json(r.rows[0], 201);
    },

    "GET /files/:id": async (req, { id }) => {
      const r = await client.queryObject(
        "SELECT filename, mime, path FROM files WHERE id = $1",
        [id],
      );
      if (!r.rows.length) return new Response("not found", { status: 404 });
      const { filename, mime, path } = r.rows[0];
      const data = await Deno.readFile(path);
      return new Response(data, {
        headers: {
          "content-type": mime,
          "content-disposition": `attachment; filename="${filename}"`,
        },
      });
    },

    "DELETE /files/:id": async (req, { id }) => {
      const r = await client.queryObject(
        "DELETE FROM files WHERE id = $1 RETURNING path",
        [id],
      );
      if (!r.rows.length) return new Response("not found", { status: 404 });
      try { await Deno.remove(r.rows[0].path); } catch { /* already gone */ }
      return new Response(null, { status: 204 });
    },
  };
}

const client = await componentClient("diary");
await setup(client);
export default makeRoutes(client);

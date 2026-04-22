// src/db.js - Postgres-backed config persistence.
// connect() for server use; loadConfig/saveConfig accept any compatible client.

import { Client } from "jsr:@db/postgres";

export const DEFAULTS = {
  nav: [
    { id: "home", label: "home", href: "#",    active: true },
    { id: "adm",  label: "adm",  href: "#adm", active: true },
  ],
  home: {
    blocks: [],
  },
};

const DDL = `
  CREATE TABLE IF NOT EXISTS hq_config (
    id      INTEGER PRIMARY KEY DEFAULT 1,
    config  JSONB NOT NULL,
    CONSTRAINT single_row CHECK (id = 1)
  )
`;

export async function connect() {
  const client = new Client(Deno.env.get("DATABASE_URL"));
  await client.connect();
  await client.queryArray(DDL);
  return client;
}

export async function loadConfig(client) {
  const result = await client.queryObject("SELECT config FROM hq_config WHERE id = 1");
  if (!result.rows.length) return structuredClone(DEFAULTS);
  return { ...structuredClone(DEFAULTS), ...result.rows[0].config };
}

export async function saveConfig(client, config) {
  await client.queryArray(
    `INSERT INTO hq_config (id, config) VALUES (1, $1)
     ON CONFLICT (id) DO UPDATE SET config = EXCLUDED.config`,
    [JSON.stringify(config)],
  );
}

export async function componentClient(id) {
  const client = new Client(Deno.env.get("DATABASE_URL"));
  await client.connect();
  await client.queryArray(`CREATE SCHEMA IF NOT EXISTS "${id}"`);
  await client.queryArray(`SET search_path TO "${id}"`);
  return client;
}

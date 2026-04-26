#!/usr/bin/env -S deno run --allow-net --allow-read --allow-env --allow-run
// hq.js - HQ development server
// Usage: deno run --allow-net --allow-read --allow-env --allow-run hq.js [port]

import { connect, loadConfig, saveConfig, DEFAULTS } from "./src/db.js";

const port = parseInt(Deno.args[0]) || 8000;
const root = new URL(".", import.meta.url).pathname;
const db   = await connect();

// Load component server modules from pages/*/server.js
const componentRoutes = new Map();
try {
  for await (const entry of Deno.readDir(root + "pages")) {
    if (!entry.isDirectory) continue;
    try {
      const mod = await import(`${root}pages/${entry.name}/server.js`);
      if (mod.default) componentRoutes.set(entry.name, mod.default);
    } catch { /* no server.js */ }
  }
} catch { /* no pages dir */ }

function matchRoute(pattern, actual) {
  const si = pattern.indexOf(" ");
  if (pattern.slice(0, si) !== actual.slice(0, si)) return null;
  const re = new RegExp("^" + pattern.slice(si + 1).replace(/:([^/]+)/g, "(?<$1>[^/]+)") + "$");
  const m = actual.slice(si + 1).match(re);
  return m ? m.groups : null;
}

const MIME = {
  html: "text/html; charset=utf-8",
  js:   "application/javascript",
  css:  "text/css",
  json: "application/json",
  svg:  "image/svg+xml",
  png:  "image/png",
  ico:  "image/x-icon",
};

async function serveFile(path) {
  try {
    const data = await Deno.readFile(path);
    const ext = path.split(".").pop();
    return new Response(data, {
      headers: { "content-type": MIME[ext] ?? "application/octet-stream" },
    });
  } catch {
    return new Response("not found", { status: 404 });
  }
}

async function handler(req) {
  const url = new URL(req.url);
  let path = url.pathname;

  if (path === "/api/config") {
    if (req.method === "GET") {
      const config = await loadConfig(db);
      return new Response(JSON.stringify(config), { headers: { "content-type": MIME.json } });
    }
    if (req.method === "POST") {
      const config = await req.json();
      await saveConfig(db, config);
      return new Response(null, { status: 204 });
    }
    if (req.method === "DELETE") {
      await saveConfig(db, structuredClone(DEFAULTS));
      return new Response(null, { status: 204 });
    }
  }

  const compMatch = path.match(/^\/api\/pages\/([^/]+)(\/.*)?$/);
  if (compMatch) {
    const [, id, subpath = "/"] = compMatch;
    const routes = componentRoutes.get(id);
    if (routes) {
      const key = `${req.method} ${subpath}`;
      if (routes[key]) return routes[key](req, {});
      for (const [pattern, fn] of Object.entries(routes)) {
        const params = matchRoute(pattern, key);
        if (params) return fn(req, params);
      }
    }
    return new Response("not found", { status: 404 });
  }

  if (path === "/api/pages") {
    const pages = [];
    try {
      for await (const entry of Deno.readDir(root + "pages")) {
        if (entry.isDirectory) {
          pages.push({ id: entry.name, label: entry.name, href: `pages/${entry.name}/index.html` });
        } else if (/\.(js|ts|html)$/.test(entry.name) && entry.name !== ".gitkeep") {
          const id = entry.name.replace(/\.(js|ts|html)$/, "");
          pages.push({ id, label: id, href: `pages/${entry.name}` });
        }
      }
    } catch { /* pages dir may be empty */ }
    return new Response(JSON.stringify(pages), {
      headers: { "content-type": MIME.json },
    });
  }

  if (path === "/" || path === "") path = "/index.html";
  if (path.endsWith("/")) path += "index.html";
  return serveFile(root + path.slice(1));
}

console.log(`HQ listening on http://localhost:${port}`);
Deno.serve({ port }, handler);

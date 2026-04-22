#!/usr/bin/env -S deno run --allow-net --allow-read
// hq.js - HQ development server
// Usage: deno run --allow-net --allow-read hq.js [port]

const port = parseInt(Deno.args[0]) || 8000;
const root = new URL(".", import.meta.url).pathname;

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

  if (path === "/api/pages") {
    const pages = [];
    try {
      for await (const entry of Deno.readDir(root + "pages")) {
        if (entry.isDirectory) {
          pages.push({ id: entry.name, label: entry.name, href: `pages/${entry.name}/` });
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
  return serveFile(root + path.slice(1));
}

console.log(`HQ listening on http://localhost:${port}`);
Deno.serve({ port }, handler);

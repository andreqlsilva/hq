// src/store.js - Config persistence via server API.

export async function load() {
  const res = await fetch("/api/config");
  return res.json();
}

export async function save(config) {
  await fetch("/api/config", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(config),
  });
}

export async function reset() {
  await fetch("/api/config", { method: "DELETE" });
}

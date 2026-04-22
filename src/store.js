// src/store.js - Config persistence via localStorage.
// All exported functions are side-effect-free at import time — safe to import in Deno tests.

const KEY = "hq:config";

export const DEFAULTS = {
  nav: [
    { id: "adm", label: "adm", href: "#adm", active: true },
  ],
  home: {
    blocks: [],
  },
};

export function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return structuredClone(DEFAULTS);
    const stored = JSON.parse(raw);
    return { ...structuredClone(DEFAULTS), ...stored };
  } catch {
    return structuredClone(DEFAULTS);
  }
}

export function save(config) {
  localStorage.setItem(KEY, JSON.stringify(config));
}

export function reset() {
  localStorage.removeItem(KEY);
}

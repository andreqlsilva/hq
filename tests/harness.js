// tests/harness.js - Minimal test harness for Deno.
// No dependencies. Call test() for each case, summary() at the end.

let passed = 0;
let failed = 0;
const results = [];

export function test(name, fn) {
  try {
    fn();
    passed++;
    results.push({ ok: true, name });
  } catch (e) {
    failed++;
    results.push({ ok: false, name, error: e.message });
  }
}

export function assert(cond, msg = "assertion failed") {
  if (!cond) throw new Error(msg);
}

export function assertEquals(a, b) {
  const as = JSON.stringify(a);
  const bs = JSON.stringify(b);
  if (as !== bs) throw new Error(`expected ${bs}\n       got ${as}`);
}

export function assertThrows(fn, msgIncludes) {
  try {
    fn();
    throw new Error("expected function to throw, but it did not");
  } catch (e) {
    if (e.message === "expected function to throw, but it did not") throw e;
    if (msgIncludes && !e.message.includes(msgIncludes)) {
      throw new Error(`expected error containing "${msgIncludes}", got: "${e.message}"`);
    }
  }
}

export function summary() {
  for (const r of results) {
    const prefix = r.ok ? "ok  " : "FAIL";
    console.log(`${prefix} ${r.name}${r.error ? "\n     " + r.error : ""}`);
  }
  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) Deno.exit(1);
}

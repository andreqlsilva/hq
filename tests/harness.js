// tests/harness.js - Minimal test harness for Deno.
// No dependencies. Call test() for each case, await summary() at the end.

let passed = 0;
let failed = 0;
const queue = [];

export function test(name, fn) {
  queue.push({ name, fn });
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

export async function summary() {
  for (const { name, fn } of queue) {
    try {
      await fn();
      passed++;
      console.log(`ok   ${name}`);
    } catch (e) {
      failed++;
      console.log(`FAIL ${name}\n     ${e.message}`);
    }
  }
  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) Deno.exit(1);
}

// tests/nav.test.js

import { test, assert, assertEquals, summary } from "./harness.js";
import { activeItems, reorder, toggle } from "../src/nav.js";

const sample = [
  { id: "a", label: "A", href: "#a", active: true  },
  { id: "b", label: "B", href: "#b", active: false },
  { id: "c", label: "C", href: "#c", active: true  },
];

// ---------- activeItems ----------

test("activeItems returns only active entries", () => {
  const items = activeItems(sample);
  assertEquals(items.length, 2);
  assert(items.every(i => i.active), "all returned items should be active");
});

test("activeItems on empty array returns empty array", () => {
  assertEquals(activeItems([]).length, 0);
});

test("activeItems does not mutate source", () => {
  activeItems(sample);
  assertEquals(sample.length, 3);
});

// ---------- reorder ----------

test("reorder moves item forward (a → after c)", () => {
  const result = reorder(sample, "a", "c");
  assertEquals(result[0].id, "b");
  assertEquals(result[1].id, "c");
  assertEquals(result[2].id, "a");
});

test("reorder moves item backward (c → before a)", () => {
  const result = reorder(sample, "c", "a");
  assertEquals(result[0].id, "c");
  assertEquals(result[1].id, "a");
  assertEquals(result[2].id, "b");
});

test("reorder with same fromId and toId returns unchanged order", () => {
  const result = reorder(sample, "a", "a");
  assertEquals(result[0].id, "a");
  assertEquals(result.length, 3);
});

test("reorder with unknown fromId returns copy unchanged", () => {
  const result = reorder(sample, "z", "a");
  assertEquals(result.length, 3);
  assertEquals(result[0].id, "a");
});

test("reorder does not mutate source array", () => {
  reorder(sample, "a", "c");
  assertEquals(sample[0].id, "a");
});

// ---------- toggle ----------

test("toggle flips inactive item to active", () => {
  const result = toggle(sample, "b");
  assertEquals(result.find(i => i.id === "b").active, true);
});

test("toggle flips active item to inactive", () => {
  const result = toggle(sample, "a");
  assertEquals(result.find(i => i.id === "a").active, false);
});

test("toggle leaves other items unchanged", () => {
  const result = toggle(sample, "b");
  assertEquals(result.find(i => i.id === "a").active, true);
  assertEquals(result.find(i => i.id === "c").active, true);
});

test("toggle does not mutate source array", () => {
  toggle(sample, "a");
  assert(sample[0].active === true, "original should be unchanged");
});

test("toggle with unknown id returns array unchanged", () => {
  const result = toggle(sample, "z");
  assertEquals(result.length, 3);
  assertEquals(result[0].active, sample[0].active);
});

await summary();

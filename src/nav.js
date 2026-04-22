// src/nav.js - Nav bar logic and rendering.
// Pure functions (activeItems, reorder, toggle) have no imports — safe to test in Deno.
// render() requires a browser DOM.

export function activeItems(nav) {
  return nav.filter(item => item.active);
}

// Insert the item identified by fromId at the position currently occupied by toId.
export function reorder(nav, fromId, toId) {
  if (fromId === toId) return [...nav];
  const items = [...nav];
  const fromIdx = items.findIndex(i => i.id === fromId);
  const toIdx   = items.findIndex(i => i.id === toId);
  if (fromIdx < 0 || toIdx < 0) return items;
  const [moved] = items.splice(fromIdx, 1);
  items.splice(toIdx, 0, moved);
  return items;
}

// Return a new nav array with item.active flipped for the given id.
export function toggle(nav, id) {
  return nav.map(item => item.id === id ? { ...item, active: !item.active } : item);
}

// Render active nav items into container.
// widgets: optional { [id]: () => HTMLElement } for widget-type items.
export function render(container, nav, widgets = {}) {
  container.innerHTML = "";
  const ul = document.createElement("ul");
  for (const item of activeItems(nav)) {
    const li = document.createElement("li");
    if (item.type === "widget" && widgets[item.id]) {
      li.appendChild(widgets[item.id]());
    } else {
      const a = document.createElement("a");
      a.href = item.href || "#" + item.id;
      a.textContent = item.label;
      li.appendChild(a);
    }
    ul.appendChild(li);
  }
  container.appendChild(ul);
}

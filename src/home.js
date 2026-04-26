// src/home.js - Homepage renderer: auto-discovers pages and shows them as tiles.

export async function render(container) {
  container.innerHTML = "";

  let pages = [];
  try {
    const res = await fetch("/api/pages");
    pages = await res.json();
  } catch { /* pages unavailable */ }

  if (!pages.length) {
    const p = document.createElement("p");
    p.className = "hq-empty";
    p.textContent = "No pages found. Add pages to the pages/ directory.";
    container.appendChild(p);
    return;
  }

  const grid = document.createElement("div");
  grid.className = "hq-grid";
  for (const page of pages) {
    const a = document.createElement("a");
    a.href = page.href;
    a.className = "hq-tile";
    a.textContent = page.label;
    grid.appendChild(a);
  }
  container.appendChild(grid);
}

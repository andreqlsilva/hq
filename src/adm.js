// src/adm.js - Admin dashboard: manage nav links/widgets and homepage blocks.

import { reorder, toggle } from "./nav.js";
import { save } from "./store.js";

export async function render(container, config, onSave) {
  container.innerHTML = "";

  const h1 = document.createElement("h1");
  h1.textContent = "adm";
  container.appendChild(h1);

  let pages = [];
  try {
    const res = await fetch("/api/pages");
    pages = await res.json();
  } catch { /* pages unavailable */ }

  container.appendChild(navSection(config, onSave, pages));
}

// ---------- nav section ----------

function navSection(config, onSave, pages) {
  const section = el("section", "adm-section");
  section.appendChild(heading(2, "Navigation"));

  const list = el("ul", "adm-nav-list");

  function redraw() {
    list.innerHTML = "";
    for (const item of config.nav) {
      list.appendChild(navRow(item, config, onSave, redraw));
    }
  }

  redraw();
  section.appendChild(list);
  section.appendChild(addLinkForm(config, onSave, redraw, pages));
  return section;
}

function navRow(item, config, onSave, redraw) {
  const li = el("li");
  li.dataset.id = item.id;
  li.draggable = true;

  const handle = el("span", "drag-handle");
  handle.textContent = "⠿";
  li.appendChild(handle);

  const label = el("span", "item-label");
  label.textContent = item.label;
  li.appendChild(label);

  const lbl = document.createElement("label");
  const chk = document.createElement("input");
  chk.type = "checkbox";
  chk.checked = item.active;
  chk.addEventListener("change", async () => {
    config.nav = toggle(config.nav, item.id);
    await save(config);
    onSave();
  });
  lbl.appendChild(chk);
  lbl.append(" active");
  li.appendChild(lbl);

  if (item.id !== "adm") {
    const rm = document.createElement("button");
    rm.textContent = "remove";
    rm.addEventListener("click", async () => {
      config.nav = config.nav.filter(n => n.id !== item.id);
      await save(config);
      onSave();
      redraw();
    });
    li.appendChild(rm);
  }

  setupDrag(li, config, onSave);
  return li;
}

function addLinkForm(config, onSave, redraw, pages = []) {
  const form = el("form", "adm-add-form");
  form.appendChild(heading(3, "Add link"));

  if (pages.length) {
    const select = document.createElement("select");
    const placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.textContent = "— add a page —";
    select.appendChild(placeholder);
    for (const page of pages) {
      if (config.nav.find(n => n.id === page.id)) continue;
      const opt = document.createElement("option");
      opt.value = JSON.stringify(page);
      opt.textContent = page.label;
      select.appendChild(opt);
    }
    const addPageBtn = document.createElement("button");
    addPageBtn.type = "button";
    addPageBtn.textContent = "add";
    addPageBtn.addEventListener("click", async () => {
      if (!select.value) return;
      const page = JSON.parse(select.value);
      if (config.nav.find(n => n.id === page.id)) return;
      config.nav.push({ id: page.id, label: page.label, href: page.href, active: true });
      await save(config);
      onSave();
      redraw();
      select.value = "";
    });
    form.append(select, addPageBtn);
    form.appendChild(heading(3, "Add custom link"));
  }

  const labelInput = input("label", "label");
  const hrefInput  = input("href",  "href or #hash");
  const btn = document.createElement("button");
  btn.type = "submit";
  btn.textContent = "add";

  form.append(labelInput, hrefInput, btn);
  form.addEventListener("submit", async e => {
    e.preventDefault();
    const lbl  = labelInput.value.trim();
    const href = hrefInput.value.trim();
    if (!lbl || !href) return;
    const id = lbl.toLowerCase().replace(/\s+/g, "-");
    if (config.nav.find(n => n.id === id)) return;
    config.nav.push({ id, label: lbl, href, active: true });
    await save(config);
    onSave();
    redraw();
    form.reset();
  });
  return form;
}

function setupDrag(li, config, onSave) {
  li.addEventListener("dragstart", e => {
    e.dataTransfer.setData("text/plain", li.dataset.id);
    li.classList.add("dragging");
  });
  li.addEventListener("dragend", () => li.classList.remove("dragging"));
  li.addEventListener("dragover", e => e.preventDefault());
  li.addEventListener("drop", async e => {
    e.preventDefault();
    const fromId = e.dataTransfer.getData("text/plain");
    const toId   = li.dataset.id;
    if (fromId === toId) return;
    config.nav = reorder(config.nav, fromId, toId);
    await save(config);
    onSave();
  });
}

// ---------- helpers ----------

function el(tag, cls) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  return e;
}

function heading(level, text) {
  const h = document.createElement("h" + level);
  h.textContent = text;
  return h;
}

function input(cls, placeholder) {
  const i = document.createElement("input");
  i.className = cls;
  i.placeholder = placeholder;
  return i;
}

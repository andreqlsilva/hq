// src/adm.js - Admin dashboard: manage nav links/widgets and homepage blocks.

import { reorder, toggle } from "./nav.js";
import { save } from "./store.js";

export function render(container, config, onSave) {
  container.innerHTML = "";

  const h1 = document.createElement("h1");
  h1.textContent = "adm";
  container.appendChild(h1);

  container.appendChild(navSection(config, onSave));
  container.appendChild(homeSection(config, onSave));
}

// ---------- nav section ----------

function navSection(config, onSave) {
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
  section.appendChild(addLinkForm(config, onSave, redraw));
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

function addLinkForm(config, onSave, redraw) {
  const form = el("form", "adm-add-form");
  form.appendChild(heading(3, "Add link"));

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

// ---------- home section ----------

function homeSection(config, onSave) {
  const section = el("section", "adm-section");
  section.appendChild(heading(2, "Homepage blocks"));

  const blockList = el("div", "adm-block-list");

  function redraw() {
    blockList.innerHTML = "";
    config.home.blocks.forEach((block, bi) => {
      blockList.appendChild(blockRow(block, bi, config, onSave, redraw));
    });
  }

  redraw();
  section.appendChild(blockList);

  const addBtn = document.createElement("button");
  addBtn.textContent = "add block";
  addBtn.addEventListener("click", async () => {
    config.home.blocks.push({ title: "New block", theme: "", links: [] });
    await save(config);
    onSave();
    redraw();
  });
  section.appendChild(addBtn);
  return section;
}

function blockRow(block, bi, config, onSave, redrawBlocks) {
  const div = el("div", "adm-block");

  const titleIn = input("block-title", "Block title");
  titleIn.value = block.title;
  titleIn.addEventListener("change", async () => { block.title = titleIn.value; await save(config); onSave(); });

  const themeIn = input("block-theme", "theme (css class)");
  themeIn.value = block.theme || "";
  themeIn.addEventListener("change", async () => { block.theme = themeIn.value; await save(config); onSave(); });

  const rmBlock = document.createElement("button");
  rmBlock.textContent = "remove block";
  rmBlock.addEventListener("click", async () => {
    config.home.blocks.splice(bi, 1);
    await save(config);
    onSave();
    redrawBlocks();
  });

  div.append(titleIn, themeIn, rmBlock);

  const linkList = el("ul", "adm-link-list");
  div.appendChild(linkList);

  function redrawLinks() {
    linkList.innerHTML = "";
    block.links.forEach((link, li) => {
      linkList.appendChild(linkRow(link, li, block, config, onSave, redrawLinks));
    });
  }

  redrawLinks();

  const addLink = document.createElement("button");
  addLink.textContent = "add link";
  addLink.addEventListener("click", () => {
    block.links.push({ label: "new", href: "#", icon: "" });
    save(config);
    onSave();
    redrawLinks();
  });
  div.appendChild(addLink);

  return div;
}

function linkRow(link, li, block, config, onSave, redrawLinks) {
  const row = document.createElement("li");

  const labelIn = input("link-label", "label");
  labelIn.value = link.label;
  labelIn.addEventListener("change", async () => { link.label = labelIn.value; await save(config); onSave(); });

  const hrefIn = input("link-href", "href");
  hrefIn.value = link.href;
  hrefIn.addEventListener("change", async () => { link.href = hrefIn.value; await save(config); onSave(); });

  const iconIn = input("link-icon", "icon url");
  iconIn.value = link.icon || "";
  iconIn.addEventListener("change", async () => { link.icon = iconIn.value; await save(config); onSave(); });

  const rm = document.createElement("button");
  rm.textContent = "x";
  rm.addEventListener("click", async () => {
    block.links.splice(li, 1);
    await save(config);
    onSave();
    redrawLinks();
  });

  row.append(labelIn, hrefIn, iconIn, rm);
  return row;
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

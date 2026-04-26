// --- THEME SYSTEM ---
(function() {
  if (!document.documentElement.dataset.theme) {
    document.documentElement.dataset.theme = "light";
  }
  if (document.getElementById("archet-theme-vars")) return;
  const s = document.createElement("style");
  s.id = "archet-theme-vars";
  s.textContent = `
    :root {
      --archet-font: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    }
    :root[data-theme="light"] {
      --archet-bg:         #cccccc;
      --archet-fg:         #1a1a1a;
      --archet-border:     #aaaaaa;
      --archet-surface:    #bfbfbf;
      --archet-surface-alt:#c5c5c5;
      --archet-link:       #005fcc;
      --archet-focus:      #007bff;
      --archet-focus-ring: rgba(0,123,255,0.25);
      --archet-muted:      #888888;
    }
    :root[data-theme="dark"] {
      --archet-bg:         #1e1e1e;
      --archet-fg:         #e0e0e0;
      --archet-border:     #444444;
      --archet-surface:    #2d2d2d;
      --archet-surface-alt:#252525;
      --archet-link:       #4da6ff;
      --archet-focus:      #4da6ff;
      --archet-focus-ring: rgba(77,166,255,0.25);
      --archet-muted:      #999999;
    }
    html[data-theme], html[data-theme] body {
      background-color: var(--archet-bg);
      color: var(--archet-fg);
    }
  `;
  document.head.appendChild(s);
}());

export function setTheme(name) {
  document.documentElement.dataset.theme = name;
}
/* archet - suckless web UI */
/* More info: www.archet.ink */

// --- 0. THE BASE ---
export class Component {
  constructor(tag) {
    this.dom = document.createElement(tag);
  }

  // --- CORE ---
  add(...kids) {
    kids.forEach(k => {
      // 1. Primitives -> Text Component
      if (["string", "number", "boolean"].includes(typeof k)) k = new Text(k);

      // 2. Validate & Append
      if (k instanceof Component) this.dom.appendChild(k.dom);
      else if (k instanceof Node) this.dom.appendChild(k);
      else if (k != null) console.warn(`Archet: Dropped invalid child in <${this.dom.tagName}>:`, k);
    });
    return this;
  }

  // Styles & Attributes
  css(s) { Object.assign(this.dom.style, s); return this; }
  on(e, f) { this.dom.addEventListener(e, f); return this; }

  attr(a, v) {
    if (v === null || v === undefined) this.dom.removeAttribute(a);
    else this.dom.setAttribute(a, String(v));
    return this;
  }

  // --- MACROS ---
  id(v) { this.dom.id = v; return this; }

  cls(...n) {
    const valid = n.filter(x => x);
    if (valid.length) this.dom.classList.add(...valid);
    return this;
  }

  data(k, v) {
    if (v === null || v === undefined) delete this.dom.dataset[k];
    else this.dom.dataset[k] = String(v);
    return this;
  }

  bg(c) { return this.css({ background: c }); }
  fg(c) { return this.css({ color: c }); }

  // Stateful Display
  hide() {
    if (this.dom.style.display !== "none") {
      this._disp = this.dom.style.display;
      this.css({ display: "none" });
    }
    return this;
  }
  show() {
    if (this.dom.style.display === "none") {
      this.css({ display: this._disp || "" });
    }
    return this;
  }

  // Geometry
  size(w, h) {
    if (w != null) this.css({ width: typeof w === 'number' ? `${w}%` : w });
    if (h != null) this.css({ height: typeof h === 'number' ? `${h}%` : h });
    return this;
  }

  // Visuals
  bd(w=1, c="var(--archet-border)", s="solid") { return this.css({ border: `${w}px ${s} ${c}` }); }
  nobd() { return this.css({ border: "none" }); }
  round(px=4) { return this.css({ borderRadius: `${px}px` }); }
  pad(px) { return this.css({ padding: `${px}px` }); }
  gap(px) { return this.css({ gap: `${px}px` }); }

  animate(prop="all", time="0.2s") { return this.css({ transition: `${prop} ${time}` }); }
}

// --- THEME INJECTION ---
(function() {
  if (typeof document === "undefined") return;
  if (document.getElementById("archet-theme")) return;
  const s = document.createElement("style");
  s.id = "archet-theme";
  s.textContent = `
    .archet-button { transition: filter 0.15s, transform 0.1s; }
    .archet-button:hover { filter: brightness(0.9); }
    .archet-button:active { transform: translateY(1px); }
    .archet-input input:focus,
    .archet-input textarea:focus,
    .archet-select:focus { border-color: var(--archet-focus, #007bff) !important; box-shadow: 0 0 0 3px var(--archet-focus-ring, rgba(0,123,255,0.25)); }
    .archet-button.feedback-success { background: #28a745 !important; color: #fff !important; border-color: #28a745 !important; }
    .archet-button.feedback-error   { background: #dc3545 !important; color: #fff !important; border-color: #dc3545 !important; }
  `;
  document.head.appendChild(s);
})();

// --- 1. ROOT ---
export class Root extends Component {
  constructor(targetId) {
    super("div");

    // Inject global reset only once
    if (!document.getElementById("archet-styles")) {
      const s = document.createElement("style");
      s.id = "archet-styles";
      s.textContent = `
        * { box-sizing: border-box; }
        button, input, select, textarea { font-family: inherit; font-size: inherit; }
        button:focus-visible, a:focus-visible, input:focus-visible, textarea:focus-visible {
          outline: 2px solid var(--archet-focus, #005fcc); outline-offset: 2px;
        }
      `;
      document.head.appendChild(s);
    }

    this.css({
      width:"100%",
      height: "100vh",
      display:"flex", flexDirection:"column",
      overflow:"hidden"
    });
    if (globalThis.CSS?.supports?.("height", "100dvh")) this.css({ height: "100dvh" });

    const target = targetId ? document.getElementById(targetId) : document.body;

    if (target === document.body) {
      document.body.style.margin = "0";
      document.body.style.fontFamily = 'var(--archet-font)';
    }

    target.appendChild(this.dom);
  }
}

// --- 2. BOX ---
export class Box extends Component {
  constructor(w=100, h=100) {
    super("div");
    this.cls("archet-box");
    this.size(w, h).css({ display:"flex", flexDirection:"column", position:"relative" });
  }
}

// --- 3. ROW ---
export class Row extends Component {
  constructor(h=null) {
    super("div");
    this.cls("archet-row");
    this.size(100, h).css({ display:"flex", flexDirection:"row", alignItems:"center" });
  }
}

// --- 4. SPLIT ---
export class Split extends Component {
  constructor(...ratios) {
    super("div");
    this.cls("archet-split");
    this.size(100, 100).css({ display:"flex" });
    this.ratios = ratios; this.idx = 0;
  }

  add(...kids) {
    kids.forEach(k => {
      if (["string", "number", "boolean"].includes(typeof k)) k = new Text(k);

      if (!(k instanceof Component)) {
        if (k instanceof Node) {
          const wrapper = new Component("div").css({ display:"flex", flexDirection:"column" }).add(k);
          k = wrapper;
        } else if (k != null) {
          console.warn("Split: Dropped invalid child", k);
          return;
        }
      }

      const r = this.ratios[this.idx++] || 1;
      if (k instanceof Component) k.css({ flex: `${r} 1 0%` });
      super.add(k);
    });
    return this;
  }
}

// --- 5. GRID ---
export class Grid extends Component {
  constructor(cols=2, gapSize="10px") {
    super("div");
    this.cls("archet-grid");
    this.css({ display:"grid", gridTemplateColumns:`repeat(${cols}, 1fr)`, gap:gapSize, width:"100%" });
  }
}

// --- 6. TEXT ---
export class Text extends Component {
  constructor(txt) {
    super("span");
    this.cls("archet-text");
    this.dom.textContent = String(txt);
    this.css({ display:"inline-block" });
  }
}

// --- 7. LINK ---
export class Link extends Component {
  constructor(lbl, href) {
    super("a");
    this.dom.textContent = lbl;
    this.attr("href", href);
    this.css({ color:"var(--archet-link, #005fcc)", textDecoration:"underline", cursor:"pointer" });
    if (href && href.startsWith("http")) this.attr("target", "_blank").attr("rel", "noopener noreferrer");
  }
}

// --- 8. TABLE ---
export class Table extends Component {
  constructor(headers=[]) {
    super("table");
    this.cls("archet-table");
    this.css({ borderCollapse:"collapse", width:"100%", fontFamily:"inherit" });

    const thead = document.createElement("thead");
    const tr    = document.createElement("tr");
    headers.forEach(h => {
      const th = document.createElement("th");
      th.textContent = h;
      th.style.cssText = "text-align:left;padding:8px 10px;border-bottom:2px solid var(--archet-border,#ccc);";
      tr.appendChild(th);
    });
    thead.appendChild(tr);
    this.dom.appendChild(thead);

    this._tbody = document.createElement("tbody");
    this.dom.appendChild(this._tbody);
  }

  addRow(cells=[]) {
    const tr = document.createElement("tr");
    cells.forEach(c => {
      const td = document.createElement("td");
      td.textContent = String(c);
      td.style.cssText = "padding:8px 10px;border-bottom:1px solid var(--archet-border,#eee);";
      tr.appendChild(td);
    });
    this._tbody.appendChild(tr);
    return this;
  }

  clear() {
    this._tbody.innerHTML = "";
    return this;
  }
}

// --- 9. IMAGE ---
export class Image extends Component {
  constructor(src) {
    super("img");
    this.attr("src", src);
    this.css({ maxWidth:"100%", height:"auto", display:"block" });
  }
}

// --- 9. BUTTON ---
export class Button extends Component {
  constructor(content, fn) {
    super("button");
    if (typeof content === "string") this.dom.textContent = content;
    else this.add(content);

    this.cls("archet-button");
    if (fn) this.on("click", (e) => { e.preventDefault(); fn(e); });

    this.css({
      cursor:"pointer", display:"inline-flex", alignItems:"center", justifyContent:"center", gap:"8px",
      border:"1px solid var(--archet-border)", background:"var(--archet-surface)", color:"inherit", fontSize: "inherit"
    }).pad(10).round(4);
  }

  flashSuccess(duration=1500) {
    this.dom.classList.add("feedback-success");
    setTimeout(() => this.dom.classList.remove("feedback-success"), duration);
  }
  flashError(duration=1500) {
    this.dom.classList.add("feedback-error");
    setTimeout(() => this.dom.classList.remove("feedback-error"), duration);
  }
}

// --- 10. INPUT ---
export class Input extends Component {
  static uid = 0;

  constructor(ph="", lines=1, label=null, type="text") {
    if (label) {
      super("div");
      this.cls("archet-input");
      const id = `inp-${Input.uid++}`;
      this.css({ display:"flex", flexDirection:"column", gap:"5px", width:"100%" });

      const lbl = new Component("label").attr("for", id).add(label);
      lbl.css({ fontSize:"0.85rem", fontWeight:"bold", display:"block" });

      this.input = new Input(ph, lines, null, type);
      this.input.id(id);
      this.add(lbl, this.input);
      return;
    }

    super(lines > 1 ? "textarea" : "input");
    this.cls("archet-input");
    this.attr("placeholder", ph);
    this.css({ width:"100%", fontFamily:"inherit", resize:"vertical" }).pad(8).bd(1).round(4);

    if (lines > 1) this.attr("rows", lines);
    else this.attr("type", type);
  }

  get val() {
    if (this.input) return this.input.val;
    return this.dom.type === "number" ? Number(this.dom.value) : this.dom.value;
  }
  set val(v) { if (this.input) this.input.dom.value = v; else this.dom.value = v; }
}

// --- 11. CHECKBOX ---
export class Checkbox extends Component {
  constructor() {
    super("input");
    this.cls("archet-checkbox");
    this.attr("type", "checkbox");
  }

  get val() { return this.dom.checked; }
  set val(v) { if (typeof v === "boolean") this.dom.checked = v; }
}

// --- 12. FILEPICKER ---
export class FilePicker extends Component {
  constructor() {
    super("input");
    this.cls("archet-filepicker");
    this.attr("type", "file").attr("accept", ".json");
  }

  get file() { return this.dom.files[0] ?? null; }
  trigger() { this.dom.click(); }
}

// --- 13. FORM ---
export class Form extends Component {
  constructor() {
    super("div");
    this.cls("archet-form");
    this.css({ display:"flex", flexDirection:"column", gap:"10px" });
    this._fields = {};
  }

  add(name, field) {
    this._fields[name] = field;
    super.add(field);
    return this;
  }

  remove(name) {
    if (!this._fields[name]) return this;
    const field = this._fields[name];
    const el = field.dom ?? field;
    el.parentNode?.removeChild(el);
    delete this._fields[name];
    return this;
  }

  values() {
    const out = {};
    for (const [name, field] of Object.entries(this._fields)) out[name] = field.val;
    return out;
  }

  clear() {
    for (const field of Object.values(this._fields)) field.val = "";
    return this;
  }
}

// --- 14. SELECT ---
export class Select extends Component {
  constructor(options=[]) {
    super("select");
    this.cls("archet-select");
    this.css({ width:"100%", fontFamily:"inherit" }).pad(8).bd(1).round(4);
    options.forEach(([value, label]) => {
      const opt = document.createElement("option");
      opt.value = value;
      opt.textContent = label;
      this.dom.appendChild(opt);
    });
  }

  get val() { return this.dom.value; }
  set val(v) {
    if (Array.from(this.dom.options).some(o => o.value === v)) this.dom.value = v;
  }

  addOption(value, label) {
    const opt = document.createElement("option");
    opt.value = value; opt.textContent = label;
    this.dom.appendChild(opt);
  }
  removeOption(value) {
    const opt = Array.from(this.dom.options).find(o => o.value === value);
    if (opt) this.dom.removeChild(opt);
  }
  updateOption(value, label) {
    const opt = Array.from(this.dom.options).find(o => o.value === value);
    if (opt) opt.textContent = label;
  }
  clearOptions() { this.dom.innerHTML = ""; }
}

// --- 11. DECK ---
export class Deck extends Component {
  constructor() {
    super("div");
    this.cls("archet-deck");
    this.items = []; this.idx = 0;
    this.size(100, 100).css({ display:"flex", flexDirection:"column" });
  }

  add(k) {
    if (!(k instanceof Component)) throw new Error("Deck: Only Archet Components allowed (need .show/.hide methods)");
    this.items.push(k);
    super.add(k);
    this.render();
    return this;
  }

  show(i) {
    if (i < 0) i = this.items.length - 1;
    if (i >= this.items.length) i = 0;
    this.idx = i; this.render();
    return this;
  }

  render() {
    this.items.forEach((item, i) => {
      (i === this.idx) ? item.show() : item.hide();
    });
    return this;
  }
}

// --- 12. PAGER ---
export class Pager extends Component {
  constructor(pages=[]) {
    super("div");
    this.cls("archet-pager");
    this.css({ display:"flex", height:"100%" });
    this._pages = pages;

    this.nav = new Component("nav");
    this.nav.css({ display:"flex", flexDirection:"column", gap:"4px", padding:"10px", borderRight:"1px solid var(--archet-border,#ccc)", minWidth:"120px", overflowY:"auto" });

    this.content = new Box();
    this.content.css({ flex:"1", overflow:"auto" });

    this._links = pages.map(([label], i) => {
      const link = new Component("button").add(label);
      link.css({ background:"none", border:"none", textAlign:"left", cursor:"pointer", padding:"6px 10px", borderRadius:"4px", color:"inherit", fontFamily:"inherit", fontSize:"inherit" });
      link.attr("data-role", "page-link");
      link.on("click", () => this.select(i));
      this.nav.add(link);
      return link;
    });

    super.add(this.nav);
    super.add(this.content);
    this.select(0);
  }

  select(i) {
    this._idx = i;
    this.content.dom.innerHTML = "";
    this.content.dom.appendChild(this._pages[i][1].dom);
    this._links.forEach((l, j) => l.css({ background: j === i ? "var(--archet-surface,#ddd)" : "none", fontWeight: j === i ? "bold" : "normal" }));
    return this;
  }
}

// --- 13. TABBER ---
export class Tabber extends Component {
  constructor(pages=[]) {
    super("div");
    this.cls("archet-tabber");
    this.css({ display:"flex", flexDirection:"column", height:"100%" });
    this._pages = pages;

    this.strip = new Component("nav");
    this.strip.css({ display:"flex", gap:"2px", borderBottom:"1px solid var(--archet-border,#ccc)", padding:"0 10px" });

    this.content = new Box();
    this.content.css({ flex:"1", overflow:"auto" });

    this._tabs = pages.map(([label], i) => {
      const tab = new Component("button").add(label);
      tab.css({ background:"none", border:"none", borderBottom:"2px solid transparent", cursor:"pointer", padding:"8px 14px", color:"inherit", fontFamily:"inherit", fontSize:"inherit" });
      tab.attr("data-role", "tab");
      tab.on("click", () => this.select(i));
      this.strip.add(tab);
      return tab;
    });

    super.add(this.strip);
    super.add(this.content);
    this.select(0);
  }

  select(i) {
    this._idx = i;
    this.content.dom.innerHTML = "";
    this.content.dom.appendChild(this._pages[i][1].dom);
    this._tabs.forEach((t, j) => t.css({ borderBottom: j === i ? "2px solid currentColor" : "2px solid transparent", fontWeight: j === i ? "bold" : "normal" }));
    return this;
  }
}

// --- 14. NAVPAGER ---
export class NavPager extends Component {
  constructor() {
    super("div");
    this.cls("archet-navpager");
    this.css({ display:"flex", height:"100%" });
    this._pages = [];

    this.addBtn = new Button("+");
    this.nav = new Component("nav");
    this.nav.css({ display:"flex", flexDirection:"column", gap:"4px", padding:"10px", borderRight:"1px solid var(--archet-border,#ccc)", minWidth:"120px", overflowY:"auto" });
    this.nav.add(this.addBtn);

    this.content = new Box();
    this.content.css({ flex:"1", overflow:"auto" });

    super.add(this.nav);
    super.add(this.content);
  }

  add(component, onDelete) {
    const entry = new Component("div");
    entry.attr("data-role", "nav-entry");
    entry.css({ display:"flex", alignItems:"center", justifyContent:"space-between", gap:"4px" });

    const label = new Component("span");
    label.css({ flex:"1", cursor:"pointer", padding:"4px 6px" });

    const del = new Component("button").add("×");
    del.attr("data-role", "nav-delete");
    del.css({ background:"none", border:"none", cursor:"pointer", color:"inherit", fontSize:"inherit", padding:"2px 6px" });

    entry.add(label);
    entry.add(del);
    this.nav.add(entry);

    const page = { component, entry, label, del, onDelete };
    this._pages.push(page);

    entry.on("click", (e) => { if (!e.target.closest("[data-role='nav-delete']")) this._show(this._pages.indexOf(page)); });
    del.on("click", () => { if (page.onDelete) page.onDelete(); this._remove(this._pages.indexOf(page)); });

    this._renumber();
    this._show(this._pages.length - 1);
    return this;
  }

  _renumber() {
    this._pages.forEach(({ label }, i) => { label.dom.textContent = String(i + 1); });
  }

  _show(i) {
    if (i < 0 || i >= this._pages.length) return;
    this._idx = i;
    this.content.dom.innerHTML = "";
    this.content.dom.appendChild(this._pages[i].component.dom);
    this._pages.forEach(({ entry }, j) => entry.css({ background: j === i ? "var(--archet-surface,#ddd)" : "none", fontWeight: j === i ? "bold" : "normal" }));
  }

  _remove(i) {
    if (i < 0 || i >= this._pages.length) return;
    this._pages[i].entry.dom.remove();
    this._pages.splice(i, 1);
    this._renumber();
    this.content.dom.innerHTML = "";
    if (this._pages.length > 0) this._show(0);
  }

  empty() {
    this._pages.forEach(({ entry }) => entry.dom.remove());
    this._pages = [];
    this.content.dom.innerHTML = "";
  }
}

// --- 15. CRUD ---
export class Crud extends Box {
  constructor(title, schema=[]) {
    super();
    this.cls("archet-crud");
    this.schema = schema; this.data = [];
    this.onError = alert;

    this.bg("var(--archet-bg,#fff)").bd(1, "var(--archet-border,#ddd)").round(8).pad(20).css({ maxWidth: "800px", margin: "20px auto" });
    this.add(new Text(title).css({ fontSize: "1.5rem", fontWeight: "bold", marginBottom: "15px" }));

    const form = new Row().gap(10).css({ marginBottom: "20px" });
    this.inputs = {};
    schema.forEach(field => {
      const input = new Input(field).css({ flex: 1 });
      this.inputs[field] = input; form.add(input);
    });
    this.add(form.add(new Button("Add", () => this.addItem()).bg("#28a745").fg("#fff").nobd()));

    this.list = new Box().gap(5).css({ overflowY:"auto" });
    this.add(this.list);
  }

  addItem() {
    const rowData = {};
    let valid = true;
    this.schema.forEach(k => {
      const v = this.inputs[k].val;
      if (v === "") valid = false;
      rowData[k] = v;
    });

    if (!valid) return this.onError("Fill all fields");

    this.data.push(rowData);
    Object.values(this.inputs).forEach(i => i.val = "");
    this.renderList();
  }

  renderList() {
    this.list.dom.innerHTML = "";
    this.data.forEach((item, idx) => {
      const row = new Row().bg("var(--archet-surface-alt,#f9f9f9)").pad(10).round(4).bd(1, "var(--archet-border,#eee)");
      this.schema.forEach(k => row.add(new Text(item[k]).css({ flex: 1 })));

      row.add(new Button("×", () => {
        this.data.splice(idx, 1);
        this.renderList();
      }).bg("transparent").fg("#c00").nobd().data("role", "delete"));

      this.list.add(row);
    });
  }
}

// --- 16. TOAST ---
(function() {
  if (document.getElementById("archet-toast-style")) return;
  const s = document.createElement("style");
  s.id = "archet-toast-style";
  s.textContent = `
    .archet-toast-success { background: #28a745; color: #fff; }
    .archet-toast-error   { background: #dc3545; color: #fff; }
  `;
  document.head.appendChild(s);
}());

export class Toast extends Component {
  constructor() {
    super("div");
    this.cls("archet-toast");
    this.css({ display:"flex", flexDirection:"column", gap:"6px" });
  }

  _show(msg, cls, duration) {
    const el = document.createElement("div");
    el.className = cls;
    el.textContent = msg;
    el.style.cssText = "padding:10px 16px;border-radius:4px;font-family:inherit;";
    this.dom.appendChild(el);
    if (duration > 0) setTimeout(() => el.remove(), duration);
    return this;
  }

  success(msg, duration=3000) { return this._show(msg, "archet-toast-success", duration); }
  error(msg,   duration=3000) { return this._show(msg, "archet-toast-error",   duration); }
}

// --- 17. MODAL ---
export class Modal extends Component {
  constructor(title, content) {
    super("div");
    this.cls("archet-modal");
    this.onClose = null;
    this.css({ display:"none", position:"fixed", inset:"0", background:"rgba(0,0,0,0.5)", alignItems:"center", justifyContent:"center", zIndex:"1000" });

    this._dialog = new Component("div");
    this._dialog.css({ background:"var(--archet-bg,#fff)", borderRadius:"6px", padding:"24px", minWidth:"320px", maxWidth:"90vw", maxHeight:"90vh", overflow:"auto", position:"relative" });

    const header = new Row().css({ justifyContent:"space-between", marginBottom:"16px" });
    header.add(new Text(title).css({ fontWeight:"bold", fontSize:"1.1rem" }));
    header.add(new Button("×", () => this.close()).nobd().bg("transparent").css({ fontSize:"1.2rem", lineHeight:"1" }));

    this._dialog.add(header);
    this._dialog.add(content);
    super.add(this._dialog);

    this.dom.addEventListener("click", (e) => { if (e.target === this.dom) this.close(); });
  }

  open()  { this.css({ display:"flex" }); return this; }
  close() { this.css({ display:"none" }); if (this.onClose) this.onClose(); return this; }
}

// --- 18. SPINNER ---
export class Spinner extends Component {
  constructor(size=32) {
    super("div");
    this.cls("archet-spinner");
    this.css({ width:`${size}px`, height:`${size}px`, border:"3px solid var(--archet-border,#ddd)", borderTopColor:"var(--archet-muted,#555)", borderRadius:"50%", display:"inline-block", animation:"archet-spin 0.7s linear infinite" });
    if (!document.getElementById("archet-spinner-style")) {
      const s = document.createElement("style");
      s.id = "archet-spinner-style";
      s.textContent = "@keyframes archet-spin { to { transform: rotate(360deg); } }";
      document.head.appendChild(s);
    }
  }
}

// --- 19. ACCORDION ---
export class Accordion extends Component {
  constructor() {
    super("div");
    this.cls("archet-accordion");
    this.css({ display:"flex", flexDirection:"column", width:"100%" });
  }

  add(label, content) {
    const panel = new Component("div");
    panel.css({ borderBottom:"1px solid var(--archet-border,#ddd)" });

    const header = new Component("button");
    header.attr("data-role", "panel-header");
    header.add(label);
    header.css({ width:"100%", textAlign:"left", background:"none", border:"none", padding:"10px 14px", cursor:"pointer", fontFamily:"inherit", fontSize:"inherit", fontWeight:"bold", color:"inherit" });

    const body = new Component("div");
    body.attr("data-role", "panel-body");
    body.css({ display:"none", padding:"10px 14px" });
    body.add(content);

    header.on("click", () => {
      const open = body.dom.style.display !== "none";
      body.css({ display: open ? "none" : "block" });
    });

    panel.add(header);
    panel.add(body);
    super.add(panel);
    return this;
  }
}

// --- 20. CHECKLIST ---
(function() {
  if (document.getElementById("archet-checklist-style")) return;
  const s = document.createElement("style");
  s.id = "archet-checklist-style";
  s.textContent = `
    .archet-checklist input[type="checkbox"] {
      appearance: none; -webkit-appearance: none;
      width: 22px; height: 22px; min-width: 22px;
      border: 2px solid var(--archet-border,#aaa); border-radius: 4px;
      cursor: pointer; position: relative;
      transition: background 0.15s, border-color 0.15s;
    }
    .archet-checklist input[type="checkbox"]:checked {
      background: #28a745; border-color: #28a745;
    }
    .archet-checklist input[type="checkbox"]:checked::after {
      content: ""; position: absolute;
      left: 5px; top: 2px; width: 6px; height: 11px;
      border: 2px solid #fff; border-top: none; border-left: none;
      transform: rotate(45deg);
    }
  `;
  document.head.appendChild(s);
}());

export class Checklist extends Component {
  constructor() {
    super("div");
    this.cls("archet-checklist");
    this.css({ display:"flex", flexDirection:"column", gap:"4px", overflowY:"auto" });
    this.onComplete = null;

    const row   = new Component("div");
    row.css({ display:"flex", gap:"6px", padding:"4px 0" });

    const input = document.createElement("input");
    input.type = "text";
    input.dataset.role = "item-input";
    input.placeholder = "New item…";
    input.style.cssText = "flex:1;padding:6px 8px;border:1px solid #ccc;border-radius:4px;font-family:inherit;font-size:inherit;";

    const btn = document.createElement("button");
    btn.dataset.role = "item-add";
    btn.textContent = "+";
    btn.style.cssText = "padding:6px 12px;border:none;border-radius:4px;background:#28a745;color:#fff;font-size:1.1rem;cursor:pointer;";

    const doAdd = () => {
      const label = input.value.trim();
      if (!label) return;
      this.add(label);
      input.value = "";
      input.focus();
    };

    btn.addEventListener("click", doAdd);
    input.addEventListener("keydown", (e) => { if (e.key === "Enter") doAdd(); });

    row.dom.appendChild(input);
    row.dom.appendChild(btn);
    super.add(row);
  }

  add(label) {
    const item = new Component("div");
    item.attr("data-role", "checklist-item");
    item.css({ display:"flex", alignItems:"center", gap:"10px", padding:"6px 8px", borderRadius:"4px" });

    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.dataset.role = "item-check";

    const lbl = document.createElement("span");
    lbl.textContent = label;
    lbl.style.flex = "1";

    const del = document.createElement("button");
    del.dataset.role = "item-delete";
    del.textContent = "×";
    del.style.cssText = "border:none;cursor:pointer;color:#fff;background:#c00;font-size:1rem;padding:2px 8px;border-radius:4px;line-height:1.4;";

    cb.addEventListener("change", () => {
      lbl.style.textDecoration = cb.checked ? "line-through" : "";
      lbl.style.opacity        = cb.checked ? "0.5" : "";
      if (cb.checked && this.onComplete) this.onComplete(label);
    });

    del.addEventListener("click", () => item.dom.remove());

    item.dom.appendChild(cb);
    item.dom.appendChild(lbl);
    item.dom.appendChild(del);
    super.add(item);
    return this;
  }
}

import { Box, Row, Text, Button, Input, Checkbox, Toast } from "./archet.js";

const API = "/api/pages/diary";
let schema = { name: "Diary", fields: [] };
let currentDate = new Date().toISOString().slice(0, 10);

// ---- API ----

async function apiFetch(method, path, body) {
  const isForm = body instanceof FormData;
  const r = await fetch(API + path, {
    method,
    headers: (!body || isForm) ? {} : { "content-type": "application/json" },
    body: body ? (isForm ? body : JSON.stringify(body)) : undefined,
  });
  if (!r.ok) throw new Error(await r.text());
  return r.status === 204 ? null : r.json();
}

const api = {
  get:    (path)       => apiFetch("GET",    path),
  post:   (path, body) => apiFetch("POST",   path, body),
  patch:  (path, body) => apiFetch("PATCH",  path, body),
  delete: (path)       => apiFetch("DELETE", path),
};

// ---- Helpers ----

function shiftDate(date, days) {
  const d = new Date(date + "T12:00:00");
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

// ---- Entry card ----

function buildEntryCard(entry, toast) {
  const wrapper = new Row().gap(8).css({ alignItems: "center" });
  const card = new Box().bd(1).round(4).css({ gap: "8px", flex: "1", padding: "12px 48px 12px 12px", position: "relative" });

  const hdr = new Row().css({ marginBottom: "4px" });
  hdr.add(new Text(`#${entry.id}`).css({ color: "var(--archet-muted)", fontSize: "0.8rem" }));
  card.add(hdr);

  const inputs = {};

  const saveBtn = new Button("💾", async () => {
    const data = {};
    for (const [name, inp] of Object.entries(inputs)) data[name] = inp.val;
    try { await api.patch(`/entries/${entry.id}`, { data }); saveBtn.flashSuccess(); }
    catch (e) { saveBtn.flashError(); toast.error("Save failed"); }
  }).css({ position: "absolute", top: "8px", right: "8px", padding: "2px 8px" });
  card.add(saveBtn);

  const delBtn = new Button("×", async () => {
    try { await api.delete(`/entries/${entry.id}`); wrapper.dom.remove(); }
    catch (e) { toast.error(e.message); }
  }).css({ padding: "2px 8px", flexShrink: "0" });

  // Schema fields
  for (const field of schema.fields) {
    const row = new Row().gap(8).css({ alignItems: "center" });
    row.add(new Text(field.label).css({ width: "110px", flexShrink: "0", fontSize: "0.85rem" }));

    if (field.type === "boolean") {
      const cb = new Checkbox();
      cb.val = !!entry.data[field.name];
      inputs[field.name] = cb;
      row.add(cb);
    } else {
      const inp = new Input("", 1, null, field.type === "number" ? "number" : "text");
      inp.val = entry.data[field.name] ?? "";
      inputs[field.name] = inp;
      row.add(inp);
    }
    card.add(row);
  }

  // Files section
  let files = [...(entry.files || [])];
  const filesSection = new Box().bd(1).round(4).pad(8).css({ gap: "6px", marginTop: "4px" });
  filesSection.add(new Text("Files").css({ fontSize: "0.75rem", color: "var(--archet-muted)" }));

  const filesList = new Box().css({ gap: "4px" });
  filesSection.add(filesList);

  function renderFiles() {
    filesList.dom.innerHTML = "";
    for (const f of files) {
      const row = new Row().gap(6);
      row.add(new Text(f.filename).css({ flex: "1", fontSize: "0.85rem" }));
      row.add(
        new Button("↓", () => window.open(`${API}/files/${f.id}`, "_blank")).css({ padding: "2px 6px" }),
        new Button("×", async () => {
          try { await api.delete(`/files/${f.id}`); files = files.filter(x => x.id !== f.id); renderFiles(); }
          catch (e) { toast.error(e.message); }
        }).css({ padding: "2px 6px" })
      );
      filesList.add(row);
    }
  }
  renderFiles();

  const fileInput = document.createElement("input");
  fileInput.type = "file";
  fileInput.multiple = true;
  fileInput.style.display = "none";
  fileInput.addEventListener("change", async () => {
    for (const file of Array.from(fileInput.files)) {
      const form = new FormData();
      form.append("file", file);
      try { files = [...files, await api.post(`/entries/${entry.id}/files`, form)]; }
      catch (e) { toast.error(e.message); }
    }
    renderFiles();
    fileInput.value = "";
  });
  filesSection.dom.appendChild(fileInput);
  filesSection.add(new Button("attach", () => fileInput.click()).css({ alignSelf: "flex-start", fontSize: "0.85rem" }));

  card.add(filesSection);
  wrapper.add(card, delBtn);
  return wrapper;
}

// ---- Day view ----

async function loadDay(container, toast) {
  container.dom.innerHTML = "";

  let entries;
  try { entries = await api.get(`/entries?date=${currentDate}`); }
  catch (e) { toast.error("Failed to load entries"); return; }

  for (const entry of entries) container.add(buildEntryCard(entry, toast));

  container.add(
    new Button("+ add entry", async () => {
      try {
        const entry = await api.post("/entries", { date: currentDate, data: {} });
        entry.files = [];
        container.dom.insertBefore(buildEntryCard(entry, toast).dom, container.dom.lastElementChild);
      } catch (e) { toast.error(e.message); }
    }).css({ alignSelf: "flex-start" })
  );
}

// ---- Main ----

async function main() {
  schema = await api.get("/schema");
  document.title = schema.name || "Diary";
  document.body.style.margin = "0";
  document.body.style.fontFamily = "var(--archet-font)";

  const toast = new Toast();
  toast.css({ position: "fixed", bottom: "1rem", right: "1rem", zIndex: "100" });
  document.body.appendChild(toast.dom);

  const app = new Box().pad(20).css({ gap: "1rem", maxWidth: "720px" });
  document.body.appendChild(app.dom);

  app.add(new Text(schema.name || "Diary").css({ fontSize: "1.2rem", fontWeight: "bold" }));

  const dateInput = new Input("", 1, null, "date");
  dateInput.val = currentDate;
  dateInput.on("change", () => { currentDate = dateInput.val; loadDay(dayContainer, toast); });

  const nav = new Row().gap(8);
  nav.add(
    new Button("←", () => { currentDate = shiftDate(currentDate, -1); dateInput.val = currentDate; loadDay(dayContainer, toast); }),
    dateInput,
    new Button("→", () => { currentDate = shiftDate(currentDate, 1); dateInput.val = currentDate; loadDay(dayContainer, toast); })
  );
  app.add(nav);

  const dayContainer = new Box().css({ gap: "1rem" });
  app.add(dayContainer);

  await loadDay(dayContainer, toast);
}

main();

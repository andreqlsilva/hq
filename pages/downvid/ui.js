// FRONTEND LIBRARY 

class UIComponent { // extend only
  static tag = "p";
  static className = "UIComponent";
  constructor() {
    this.ui = true;
    this.html = document.createElement(this.constructor.tag)
    this.html.classList.add(this.constructor.className);
  }
  show() { this.html.hidden = false; }
  hide() { this.html.hidden = true; }
  toggle() { this.html.hidden = !this.html.hidden; }
  pick() { this.html.classList.add("picked"); }
  unpick() { this.html.classList.remove("picked"); }
  fire(eventName, eventData) {
    const newEvent = new CustomEvent(eventName, {
      detail: eventData,
      bubbles: true,
      composed: true
    });
    this.html.dispatchEvent(newEvent);
  }
  react(eventName, actionFunction) {
    this.html.addEventListener(eventName, actionFunction);
  }
  showOn(condition) {
    //TODO
  }
  setId(id) { if (id) this.html.setAttribute("id",id); }
  addClass(className) {
    if (className) this.html.classList.add(className);
  }
}

class DisplayElement extends UIComponent { // extend only
  static tag = "p";
  static className = "DisplayElement";
  constructor(title) {
    super();
    this.title = title;
  }
  get title() { return this._title; }
  set title(newTitle) {
    this._title = newTitle ?? "[title]";
  }
}

class TextualElement extends DisplayElement {
  static tag = "p";
  static className = "TextualElement";
  constructor(title) {
    super(title);
    this._title = title ?? "[title]";
    this.html.textContent = this._title; 
  }
  get title() { return this._title; }
  set title(newTitle) {
    this._title = newTitle ?? "[title]";
    this.html.textContent = this._title;
  }
}

class LabelElement extends TextualElement {
  static tag = "label";
  static className = "LabelElement";
}

class HElement extends TextualElement { // extend only
  static className = "HeaderElement";
}

class H1Element extends HElement { 
  static tag = "h1";
}

class H2Element extends HElement {
  static tag = "h2";
}

class H3Element extends HElement {
  static tag = "h3";
}

class InputElement extends UIComponent {
  static tag = "input";
  static type = "text";
  static className = "InputElement";
  static isValid = (newInput) => (newInput != null);
  #defaultValue;
  constructor(defaultValue) {
    super();
    this.html.setAttribute("type", this.constructor.type);
    this.defaultValue = defaultValue;
    this.value = defaultValue;
  }
  get value() { return this.html.value; }
  set value(newValue) {
    if (this.isValid(newValue)) this.html.value = newValue;
  }
  get defaultValue() { return this.#defaultValue; }
  set defaultValue(newDefault) {
    if (this.constructor.isValid(newDefault))
      this.#defaultValue = newDefault;
    else throw new Error("Invalid default.");
  }
  reset() { this.html.value = this.defaultValue; }
  isValid() { return this.constructor.isValid(this.value); }
}

class TextInput extends InputElement { 
  static type = "text";
  static className = "TextInput";
  static isValid = (newInput) => {
    return (typeof newInput === "string");
  };
  constructor(defaultText) {
    super(defaultText ?? "");
  }
}

class NumberInput extends InputElement {
  static type = "number";
  static className = "NumberInput";
  static isValid = (newInput) => {
    if (newInput == null || newInput === "") return true;
    const n = Number(newInput);
    return (Number.isFinite(n));
  };
  constructor(defaultValue) {
    super(defaultValue ?? 0);
  }
  get value() { return Number(this.html.value); }
  set value(newValue) {
    if (this.constructor.isValid(newValue))
      this.html.value = newValue;
  }
}

class DateInput extends InputElement {
  static type = "date";
  static className = "DateInput";
  static isValid = (newInput) => {
    return (newInput != null
      && typeof newInput === "string"
      && (newInput === ""
        || !isNaN(Date.parse(newInput)))
    );
  };
  constructor() {
    super("");
  }
}

class CheckboxInput extends UIComponent {
  static tag = "input";
  static className = "CheckboxInput";
  constructor() {
    super();
    this.html.setAttribute("type", "checkbox");
    this.value = false;
  }
  get value() {
    return this.html.checked;
  }
  set value(newValue) {
    if (typeof newValue === "boolean")
      this.html.checked = newValue;
  }
}

class MenuInput extends UIComponent {
  static tag = "select";
  static className = "MenuInput";
  constructor() {
    super();
    this.options = {};
    const voidOption = document.createElement("option");
    voidOption.value = "";
    voidOption.textContent = "";
    this.html.appendChild(voidOption);
  }
  get value() { return this.html.value; }
  set value(newCode) {
    if (this.options[newCode]) this.html.value = newCode;
  }
  add(code, title) {
    if (code != null && title != null) {
      const option = document.createElement("option");
      option.value = code;
      option.textContent = title;
      this.options[code]=option;
      this.html.appendChild(option);
    }
    else throw new Error("Invalid new option.");
  }
  update(code, newTitle) {
    if (this.options[code] == null)
      throw new Error("Option does not exist.");
    this.options[code].textContent = newTitle;
  }
  remove(code) {
    if (this.options[code] == null)
      throw new Error("Option does not exist.");
    this.html.removeChild(this.options[code]);
    delete this.options[code];
  }
  reset() {
    Object.keys(this.options).forEach((code) =>{
      if (code !== "") this.remove(code);
    });
  }
}

class FilePicker extends UIComponent {
  static tag = "input";
  static className = "FilePicker";
  constructor() {
    super();
    this.html.setAttribute("type", "file");
  }
  get file() {
    return this.html.files[0];
  }
  trigger() { this.html.click(); }
}

class JsonFilePicker extends FilePicker {
  static className = "JsonFilePicker";
  constructor() {
    super();
    this.html.accept = ".json";
  }
  setAction(actionFunction) {
    if (actionFunction instanceof Function) 
      this.html.addEventListener("change", actionFunction);
  }
}

class ControlButton extends UIComponent {
  static tag = "button";
  static className = "ControlButton";
  constructor(text) {
    super();
    this.html.setAttribute("type", "button");
    this.html.textContent = text ?? "Button";
  }
  setAction(actionFunction) {
    if (actionFunction instanceof Function) {
      this.html.onclick = actionFunction;
    }
  }
  addAction(actionFunction) {
    if (actionFunction instanceof Function) {
      this.html.addEventListener("click", actionFunction);
    }
  }
  trigger() { this.html.click(); }
  flashSuccess() {
    this.html.classList.add("feedback-success");
    setTimeout(() => this.html.classList.remove("feedback-success"), 1500);
  }
  flashError() {
    this.html.classList.add("feedback-error");
    setTimeout(() => this.html.classList.remove("feedback-error"), 1500);
  }
}

class Block extends UIComponent {
  static tag = "div";
  static className = "Block";
  constructor() {
    super();
    this.items = [];
    this.last = -1;
  }
  add(newItem) {
    if (newItem?.ui) {
      this.items.push(newItem);
      this.html.appendChild(newItem.html);
      this.last += 1;
    }
    else throw new Error("Invalid new entry.");
  }
  remove(index) {
    if (index < 0) return;
    if (index == null || index>this.last)
      throw new Error("Invalid index.");
    this.html.removeChild(this.items[index].html);
    this.items.splice(index,1);
    this.last -= 1;
  }
  indexOf(item) { return (this.items.indexOf(item)); }
  removeItem(item) { this.remove(this.indexOf(item)); }
}

class InputBlock extends Block {
  static className = "InputBlock";
  constructor(label,field) {
    super();
    if (!label.ui || !field.ui) throw new Error("Invalid.");
    this.label = label;
    this.field = field;
    super.add(label);
    super.add(field);
  }
  get value() { return this.field.value; }
  set value(newValue) { this.field.value = newValue; }
}

class Row extends Block {
  static tag = "div"; // each row takes up the whole width
  static className = "Row";
  add(newItem) {
    super.add(newItem);
    newItem.html.style.display = "inline";
  }
}

class Form extends Block {
  static tag = "div";
  static className = "Form";
  add(newItem) {
    super.add(newItem);
    newItem.html.style.display = "block";
  }
}

class DualBlock extends UIComponent {
  static tag = "div";
  static className = "DualBlock";
  constructor() {
    super();
    const top = new Block();
    this.setPane(top,"top");
    this.html.appendChild(top.html);
    const bottom = new Block();
    this.setPane(bottom,"bottom");
    this.html.appendChild(bottom.html);
  }
  setPane(pane,position) {
    if (pane == null || !pane.ui)
      throw new Error("Invalid pane.");
    this[position]=pane;
  }
  setTop(pane) {
    this.setPane(pane,'top');
    this.html.replaceChild(pane.html, this.html.firstChild);
  }
  setBottom(pane) {
    this.setPane(pane,'bottom');
    this.html.replaceChild(pane.html, this.html.lastChild);
  }
}

class Tab extends UIComponent {
  static className = "Tab";
  
  constructor(title) {
    super();
    // A tab is just a label and a close button
    this.label = new TextualElement(title);
    this.delBtn = new ControlButton('-');
    
    this.html.appendChild(this.label.html);
    this.html.appendChild(this.delBtn.html);
    
    // Self-reference for compatibility with Pager-like logic
    this.line = this; 
  }

  get title() { return this.label.title; }
  set title(val) { this.label.title = val; }
}

class TabStrip extends UIComponent {
  static className = "TabStrip";

  constructor(title) {
    super();
    this.items = [];
    
    // Header
    this.header = document.createElement("div");
    this.header.className = "TabHeader";
    this.titleLabel = new H3Element(title);
    this.addBtn = new ControlButton('+');
    this.header.appendChild(this.titleLabel.html);
    this.header.appendChild(this.addBtn.html);
    this.html.appendChild(this.header);

    // Container
    this.tabContainer = document.createElement("div");
    this.tabContainer.className = "TabContainer";
    this.html.appendChild(this.tabContainer);
  }

  // === COMPATIBILITY FIX: The 'last' property ===
  get last() { 
    return this.items.length - 1; 
  }

  add(newTab) {
    if (!newTab?.ui) throw new Error("Invalid tab.");
    this.items.push(newTab);
    this.tabContainer.appendChild(newTab.html);
  }

  // Remove by Index (Standard Block API)
  remove(index) {
    if (index < 0 || index >= this.items.length) return;
    const item = this.items[index];
    this.tabContainer.removeChild(item.html);
    this.items.splice(index, 1);
  }

  // Remove by Object (Standard Block API)
  removeItem(item) { 
    this.remove(this.indexOf(item)); 
  }
  
  indexOf(item) { return this.items.indexOf(item); }
  
  // Selection Logic
  select(index) {
    // ... (Your existing selection logic)
     if (index < 0 || index >= this.items.length) return;
    if (this.current >= 0 && this.items[this.current]) {
      this.items[this.current].unpick();
    }
    this.items[index].pick();
    this.current = index;
  }
  
  reset() {
    this.items.forEach(item => item.unpick());
  }
}

class Tabber extends DualBlock {
  static className = "Tabber";

  constructor(title) {
    super();
    this.pages = new Map();
    this.current = null;

    // Slot 1: Navigation (Top)
    this.nav = new TabStrip(title);
    this.setTop(this.nav);
    this.addBtn = this.nav.addBtn; // Expose for parent wiring

    // Slot 2: Content (Bottom)
    this.pane = new Block();
    this.setBottom(this.pane);
  }

  get firstEntry() { return this.pages.keys().next().value; }

  addPage(newPage) {
    if (!newPage?.ui) throw new Error("Invalid page.");

    // Create the Tab UI
    const newTab = new Tab(this.nav.items.length + 1);
    
    // Wire Events
    newTab.html.addEventListener("click", () => this.select(newTab));
    newTab.delBtn.addAction(() => this.removePage(newTab));

    // Store & Mount
    this.nav.add(newTab);
    this.pages.set(newTab, newPage);
    this.pane.add(newPage);
    
    // Auto-select
    this.select(newTab);

    return newTab;
  }

  removePage(entry) { // 'entry' here is a Tab instance
    if (entry && this.pages.has(entry)) {
      // Remove Content
      this.pane.removeItem(this.pages.get(entry));
      
      // Remove Tab
      this.nav.remove(entry);
      this.pages.delete(entry);
      
      // Renumber remaining tabs
      this.nav.items.forEach((tab, i) => tab.title = i + 1);

      // Handle Selection
      this.current = null;
      if (this.firstEntry) this.select(this.firstEntry);
    }
  }

  select(entry) {
    if (!entry || !this.pages.has(entry) || entry === this.current) return;

    // Unselect old
    if (this.current) {
      this.current.unpick();
      this.pages.get(this.current).hide();
    }

    // Select new
    entry.pick();
    this.pages.get(entry).show();
    this.current = entry;
  }
  empty() {
    // Create a copy of the keys so we can iterate while deleting
    const allEntries = [...this.pages.keys()];
    
    allEntries.forEach(entry => {
      // 1. Remove the content page from the main block
      this.pane.removeItem(this.pages.get(entry));
      
      // 2. Remove the tab from the strip
      this.nav.removeItem(entry);
      
      // 3. Clear the map reference
      this.pages.delete(entry);
    });
    
    this.current = null;
  }
}

class DualPane extends UIComponent {
  static tag = "div";
  static className = "DualPane";
  constructor() {
    super();
    const left = new Block();
    this.setPane(left,"left");
    this.html.appendChild(left.html);
    const right = new Block();
    this.setPane(right,"right");
    this.html.appendChild(right.html);
  }
  setPane(pane,side) {
    if (pane == null || !pane.ui)
      throw new Error("Invalid pane.");
    this[side]=pane;
  }
  setLeft(pane) {
    this.setPane(pane,'left');
    this.html.replaceChild(pane.html, this.html.firstChild);
  }
  setRight(pane) {
    this.setPane(pane,'right');
    this.html.replaceChild(pane.html, this.html.lastChild);
  }
}

class ListEntry extends Row {
  static className = "ListEntry";
  constructor(line) {
    super();
    if (line == null || !line.ui)
      throw new Error("Invalid line.");
    this.line = line;
    this.add(line);
    this.delBtn = new ControlButton('-');
    // delete button action must be set by parent
    this.add(this.delBtn);
  }
}

class TitledBlock extends Block {
  static className = "TitledBlock";
  constructor(title) {
    super();
    this.titleLine = new Row();
    this.titleLine.html.classList.add("BlockTitle");
    this.title = new TextualElement(title ?? "[title]");
    this.titleLine.add(this.title);
    this.html.prepend(this.titleLine.html);
  }
}

class EditableList extends TitledBlock {
  static className = "EditableList";
  constructor(title) {
    super(title); 
    this.addBtn = new ControlButton('+');
    // addBtn action set by parent
    this.titleLine.add(this.addBtn);
    this.current = -1;
  }
  reset() {
    this.items.forEach((item)=>item.unpick());
  }
  select(index) {
    if (index < 0) return;
    if (index == null || index>this.last)
      throw new Error("Invalid index.");
    if (this.current >= 0)
      this.items[this.current].unpick();
    this.items[index].pick();
    this.current = index;
  }
  add(newEntry) {
    if (newEntry != null && newEntry instanceof ListEntry) {
      super.add(newEntry);
      newEntry.delBtn.setAction(() => this.removeItem(newEntry));
      newEntry.html.addEventListener("click",
        () => this.select(this.indexOf(newEntry)));
    }
    else throw new Error("Invalid list entry.")
  }
  remove(index) {
    super.remove(index);
    this.current = -1;
    this.reset();
  }
}

class Pager extends DualPane {
  static className = "Pager";
  constructor(title) {
    super();
    this.pane = new Block();
    this.pages = new Map();
    this.current = null;
    this.nav = new EditableList(title);
    this.addBtn = this.nav.addBtn;
    // this.addBtn action set by parent
    this.setLeft(this.nav);
    this.setRight(this.pane);
  }
  get firstEntry() { return this.pages.keys().next().value; }
  addPage(newPage) { 
    if (!(newPage?.ui)) throw new Error("Invalid new page.");
    const newId = new TextualElement(this.nav.items.length+1);
    const newEntry = new ListEntry(newId);
    newEntry.html.addEventListener("click",
      () => this.select(newEntry));
    this.nav.add(newEntry);
    newEntry.delBtn.addAction(() => this.removePage(newEntry));
    this.pages.set(newEntry,newPage);
    this.pane.add(newPage);
    this.select(newEntry);
  }
  removePage(entry) {
    if (entry != null) {
      this.pane.removeItem(this.pages.get(entry));
      this.nav.removeItem(entry);
      this.nav.items.forEach((item,i) => item.line.title = i+1);
      this.pages.delete(entry);
      this.current = null;
      if (this.firstEntry) this.select(this.firstEntry);
    }
  }
  select(entry) {
    if (entry == null
      || !this.pages.has(entry)
      || entry === this.current)
      return;
    if (this.current !== null) {
      this.current.unpick();
      this.pages.get(this.current).hide();
    }
    this.nav.select(this.nav.items.indexOf(entry));
    this.pages.get(entry).show();
    this.current = entry;
  }
  empty() {
//  while (this.current !== null) this.removePage(this.firstEntry);
    const allEntries = [...this.pages.keys()];
    allEntries.forEach(entry => {
      this.pane.removeItem(this.pages.get(entry));
      this.nav.removeItem(entry);
      this.pages.delete(entry);
    });
    this.current = null;
  }
}


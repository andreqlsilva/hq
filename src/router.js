// src/router.js - Hash-based router and application entry point.

import { load } from "./store.js";
import { render as renderNav } from "./nav.js";
import { render as renderAdm } from "./adm.js";
import { render as renderHome } from "./home.js";

const nav  = document.getElementById("hq-nav");
const main = document.getElementById("hq-main");

let config = load();

export function refresh() {
  config = load();
  renderNav(nav, config.nav);
  route();
}

function route() {
  const page = location.hash.slice(1) || "";
  main.innerHTML = "";
  switch (page) {
    case "adm":  renderAdm(main, config, refresh);  break;
    default:     renderHome(main, config);           break;
  }
}

export function init() {
  window.addEventListener("hashchange", route);
  refresh();
}

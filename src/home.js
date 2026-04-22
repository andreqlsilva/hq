// src/home.js - Homepage renderer: themed blocks of icon+link tiles.

export function render(container, config) {
  container.innerHTML = "";
  const { blocks = [] } = config.home;

  if (!blocks.length) {
    const p = document.createElement("p");
    p.className = "hq-empty";
    p.textContent = "No blocks configured. Visit adm to set up your homepage.";
    container.appendChild(p);
    return;
  }

  for (const block of blocks) {
    const section = document.createElement("section");
    section.className = "hq-block";
    if (block.theme) section.dataset.theme = block.theme;

    const h2 = document.createElement("h2");
    h2.textContent = block.title;
    section.appendChild(h2);

    const ul = document.createElement("ul");
    for (const link of block.links || []) {
      const li = document.createElement("li");
      const a  = document.createElement("a");
      a.href  = link.href;
      a.title = link.label;

      if (link.icon) {
        const img = document.createElement("img");
        img.src = link.icon;
        img.alt = link.label;
        a.appendChild(img);
      }

      const span = document.createElement("span");
      span.textContent = link.label;
      a.appendChild(span);
      li.appendChild(a);
      ul.appendChild(li);
    }
    section.appendChild(ul);
    container.appendChild(section);
  }
}

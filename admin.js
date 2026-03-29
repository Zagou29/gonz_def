// ── Helpers ──────────────────────────────────────────────────────────────────
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

function showToast(msg, type = "success") {
  const t = $("#toast");
  t.textContent = msg;
  t.className = `toast ${type} show`;
  clearTimeout(t._tid);
  t._tid = setTimeout(() => {
    t.className = "toast";
  }, 2600);
}

function downloadJSON(data, filename) {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    showToast("JSON copié dans le presse-papiers !");
  } catch {
    showToast("Impossible de copier", "error");
  }
}

function openModal(id) {
  $(`#${id}`).classList.add("open");
}
function closeModal(id) {
  $(`#${id}`).classList.remove("open");
}

function escHtml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// Fermeture universelle des modals
document.addEventListener("click", (e) => {
  const closeId = e.target.dataset.close;
  if (closeId) closeModal(closeId);
  if (e.target.classList.contains("modal-overlay")) closeModal(e.target.id);
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape")
    $$(".modal-overlay.open").forEach((m) => closeModal(m.id));
});

// ── Navigation ───────────────────────────────────────────────────────────────
$$(".nav-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    $$(".nav-btn").forEach((b) => b.classList.remove("active"));
    $$(".section").forEach((s) => s.classList.remove("active"));
    btn.classList.add("active");
    $(`#sec-${btn.dataset.tab}`).classList.add("active");
  });
});

// ── État global ───────────────────────────────────────────────────────────────
const state = {
  videos: [],
  menus: [],
  photos: [],
  blogs: [],
  box: [],
  vidDirty: false,
  menDirty: false,
  phoDirty: false,
  bloDirty: false,
  vidPage: 1,
  PAGE_SIZE: 50,
  vidEditIdx: -1,
  menEditIdx: -1,
  phoEditIdx: -1,
  bloEditIdx: -1,
};

// ── Chargement ────────────────────────────────────────────────────────────────
async function loadAll() {
  try {
    const [vidRes, menRes, boxRes] = await Promise.all([
      fetch("./xjson/indexVid.json"),
      fetch("./xjson/menusVideos.json"),
      fetch("./xjson/box.json"),
    ]);
    if (!vidRes.ok || !menRes.ok || !boxRes.ok)
      throw new Error("Erreur réseau");

    state.videos = await vidRes.json();
    state.menus = await menRes.json();
    state.box = await boxRes.json();
    state.photos = state.box.filter((b) => b.menu === "ph");
    state.blogs = state.box.filter((b) => b.menu === "bl");

    buildVidCategoryFilter();
    renderVideos();
    renderMenus();
    renderPhotos();
    renderBlogs();
  } catch (err) {
    console.error(err);
    showToast("Erreur de chargement des données JSON", "error");
    [
      "vid-table-wrap",
      "men-table-wrap",
      "pho-table-wrap",
      "blo-table-wrap",
    ].forEach((id) => {
      $(`#${id}`).innerHTML =
        '<div class="loading">⚠️ Impossible de charger les données.<br>La page doit être servie via un serveur HTTP (pas en file://).</div>';
    });
  }
}

// ── Utilitaires d'état ────────────────────────────────────────────────────────
function markDirty(section) {
  state[`${section}Dirty`] = true;
  $(`#${section}-export-bar`).style.display = "";
}

function markClean(section) {
  state[`${section}Dirty`] = false;
  $(`#${section}-export-bar`).style.display = "none";
}

function syncBox() {
  state.box = [...state.photos, ...state.blogs];
}

// ════════════════════════════════════════════════════════════════════════════
// SECTION VIDÉOS
// ════════════════════════════════════════════════════════════════════════════

function getFilteredVideos() {
  const search = $("#vid-search").value.toLowerCase().trim();
  const type = $("#vid-filter-type").value;
  const clas = $("#vid-filter-clas").value;
  return state.videos.filter((v) => {
    const matchSearch =
      !search ||
      v.text?.toLowerCase().includes(search) ||
      v.id?.toLowerCase().includes(search) ||
      v.clas?.toLowerCase().includes(search) ||
      v.annee?.includes(search);
    const matchType = !type || v.typVid === type;
    const matchClas = !clas || v.clas?.startsWith(clas);
    return matchSearch && matchType && matchClas;
  });
}

function buildVidCategoryFilter() {
  const cats = [
    ...new Set(
      state.videos
        .map((v) => v.clas?.split(".").slice(0, 2).join("."))
        .filter(Boolean),
    ),
  ].sort();
  const sel = $("#vid-filter-clas");
  while (sel.options.length > 1) sel.remove(1);
  cats.forEach((c) => {
    const opt = document.createElement("option");
    opt.value = c;
    opt.textContent = c;
    sel.appendChild(opt);
  });
}

function renderVideos() {
  const filtered = getFilteredVideos();
  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / state.PAGE_SIZE));
  if (state.vidPage > totalPages) state.vidPage = 1;
  const start = (state.vidPage - 1) * state.PAGE_SIZE;
  const page = filtered.slice(start, start + state.PAGE_SIZE);

  $("#vid-count").textContent = `— ${total} élément${total > 1 ? "s" : ""}`;

  const rows = page
    .map((v, i) => {
      const realIdx = state.videos.indexOf(v);
      const ytUrl =
        v.id?.length > 12
          ? `https://www.youtube.com/playlist?list=${v.id}`
          : `https://www.youtube.com/watch?v=${v.id}`;
      return `<tr>
      <td class="td-mono td-num">${start + i + 1}</td>
      <td><span class="badge badge-${escHtml(v.typVid || "")}">${escHtml(v.typVid || "")}</span></td>
      <td>${v.ec ? `<span class="badge badge-43">${escHtml(v.ec)}</span>` : '<span style="color:var(--text-light);font-size:0.75rem">16:9</span>'}</td>
      <td class="td-mono">${escHtml(v.clas || "")}</td>
      <td class="td-mono"><a href="${ytUrl}" target="_blank" rel="noopener" title="Voir sur YouTube">${v.id || ""}</a></td>
      <td>${v.annee || ""}</td>
      <td class="td-trunc" title="${escHtml(v.text || "")}">${escHtml(v.text || "")}</td>
      <td><div class="td-actions">
        <button class="btn btn-sm btn-outline" data-action="edit" data-idx="${realIdx}" title="Modifier">✏️</button>
        <button class="btn btn-sm btn-danger"  data-action="delete" data-idx="${realIdx}" title="Supprimer">🗑</button>
        <button class="btn btn-sm btn-primary" data-action="dup" data-idx="${realIdx}" title="Dupliquer">+</button>
      </div></td>
    </tr>`;
    })
    .join("");

  $("#vid-table-wrap").innerHTML =
    total === 0
      ? '<div class="loading">Aucun résultat.</div>'
      : `<table>
        <thead><tr>
          <th>#</th><th>Type</th><th>Format</th><th>Classe</th>
          <th>YouTube ID</th><th>Année</th><th>Titre</th><th>Actions</th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>`;

  renderVidPagination(totalPages);
}

function renderVidPagination(totalPages) {
  const p = $("#vid-pagination");
  if (totalPages <= 1) {
    p.innerHTML = "";
    return;
  }
  let html = `<button class="page-btn" data-page="${state.vidPage - 1}" ${state.vidPage === 1 ? "disabled" : ""}>‹</button>`;
  for (let i = 1; i <= totalPages; i++) {
    html += `<button class="page-btn ${i === state.vidPage ? "active" : ""}" data-page="${i}">${i}</button>`;
  }
  html += `<button class="page-btn" data-page="${state.vidPage + 1}" ${state.vidPage === totalPages ? "disabled" : ""}>›</button>`;
  p.innerHTML = html;
}

$("#vid-pagination").addEventListener("click", (e) => {
  const btn = e.target.closest("[data-page]");
  if (!btn || btn.disabled) return;
  state.vidPage = +btn.dataset.page;
  renderVideos();
});

$("#vid-search").addEventListener("input", () => {
  state.vidPage = 1;
  renderVideos();
});
$("#vid-filter-type").addEventListener("change", () => {
  state.vidPage = 1;
  renderVideos();
});
$("#vid-filter-clas").addEventListener("change", () => {
  state.vidPage = 1;
  renderVideos();
});

$("#f-vid-id").addEventListener("input", (e) => {
  const id = e.target.value.trim();
  const pre = $("#vid-preview");
  const img = $("#vid-preview-img");
  if (id && id.length <= 12) {
    img.src = `https://img.youtube.com/vi/${id}/mqdefault.jpg`;
    pre.style.display = "";
  } else {
    pre.style.display = "none";
  }
});

function openVidModal(v, title, editIdx) {
  state.vidEditIdx = editIdx;
  $("#modal-vid-title").textContent = title;
  $("#f-vid-typVid").value = v.typVid || "vid";
  $("#f-vid-ec").value = v.ec || "";
  $("#f-vid-clas").value = v.clas || "";
  $("#f-vid-id").value = v.id || "";
  $("#f-vid-annee").value = v.annee || "";
  $("#f-vid-text").value = v.text || "";
  const pre = $("#vid-preview");
  const img = $("#vid-preview-img");
  if (v.id && v.id.length <= 12) {
    img.src = `https://img.youtube.com/vi/${v.id}/mqdefault.jpg`;
    pre.style.display = "";
  } else {
    pre.style.display = "none";
  }
  openModal("modal-vid");
}

function deleteVid(idx) {
  if (!confirm(`Supprimer "${state.videos[idx].text}" ?`)) return;
  state.videos.splice(idx, 1);
  markDirty("vid");
  renderVideos();
  showToast("Vidéo supprimée");
}

$("#vid-table-wrap").addEventListener("click", (e) => {
  const btn = e.target.closest("[data-action]");
  if (!btn) return;
  const idx = +btn.dataset.idx;
  const action = btn.dataset.action;
  if (action === "edit")
    openVidModal(state.videos[idx], "Modifier la vidéo", idx);
  else if (action === "delete") deleteVid(idx);
  else if (action === "dup")
    openVidModal(state.videos[idx], "Copie de vidéo (nouveau)", -1);
});

$("#btn-save-vid").addEventListener("click", () => {
  const id = $("#f-vid-id").value.trim();
  const clas = $("#f-vid-clas").value.trim();
  if (!id) {
    showToast("L'ID YouTube est requis", "error");
    return;
  }
  if (!clas) {
    showToast("La classe CSS est requise", "error");
    return;
  }
  const obj = {
    ec: $("#f-vid-ec").value,
    typVid: $("#f-vid-typVid").value,
    clas,
    id,
    text: $("#f-vid-text").value.trim(),
    annee: $("#f-vid-annee").value.trim(),
  };
  if (state.vidEditIdx >= 0) {
    state.videos[state.vidEditIdx] = obj;
    showToast("Vidéo modifiée");
  } else {
    state.videos.push(obj);
    showToast("Vidéo ajoutée");
  }
  markDirty("vid");
  closeModal("modal-vid");
  renderVideos();
});

$("#btn-export-vid").addEventListener("click", () => {
  downloadJSON(getSortedVideos(), "indexVid.json");
  markClean("vid");
});
$("#btn-copy-vid").addEventListener("click", () =>
  copyToClipboard(JSON.stringify(getSortedVideos(), null, 2)),
);
// Trie les vidéos par classe (2 niveaux), puis par type, puis par année ( Attention:il faut remplacer le fichier indexVid.json par la version triée pour que l'affichage dans l'admin soit lui aussi trié, sinon les vidéos seront dans un ordre différent de celui du site )
function getSortedVideos() {
  return [...state.videos].sort((a, b) => {
    const clasCmp = (a.clas || "").localeCompare(b.clas || "");
    if (clasCmp !== 0) return clasCmp;
    const anneeCmp = (b.typVid || "").localeCompare(a.typVid || "");
    if (anneeCmp !== 0) return anneeCmp;
    return (a.annee || "").localeCompare(b.annee || "");
  });
}

// ════════════════════════════════════════════════════════════════════════════
// SECTION MENUS
// ════════════════════════════════════════════════════════════════════════════

function getFilteredMenus() {
  const search = $("#men-search").value.toLowerCase().trim();
  return state.menus.filter(
    (m) =>
      !search ||
      m.clas?.toLowerCase().includes(search) ||
      m.groupe?.toLowerCase().includes(search) ||
      m.detail?.toLowerCase().includes(search),
  );
}

function renderMenus() {
  const filtered = getFilteredMenus();
  $("#men-count").textContent =
    `— ${filtered.length} menu${filtered.length > 1 ? "s" : ""}`;

  const rows = filtered
    .map((m, i) => {
      const realIdx = state.menus.indexOf(m);
      return `<tr>
      <td class="td-mono td-num">${i + 1}</td>
      <td class="td-mono">${m.clas || ""}</td>
      <td>${escHtml(m.groupe || "")}</td>
      <td class="td-mono td-trunc" title="${escHtml(m.src || "")}">${m.src?.replace("./box_img/", "") || ""}</td>
      <td class="td-trunc" title="${escHtml(m.detail || "")}">${escHtml(m.detail || "")}</td>
      <td><div class="td-actions">
        <button class="btn btn-sm btn-outline" data-action="edit" data-idx="${realIdx}" title="Modifier">✏️</button>
        <button class="btn btn-sm btn-danger"  data-action="delete" data-idx="${realIdx}" title="Supprimer">🗑</button>
        <button class="btn btn-sm btn-primary" data-action="dup" data-idx="${realIdx}" title="Dupliquer">+</button>
      </div></td>
    </tr>`;
    })
    .join("");

  $("#men-table-wrap").innerHTML =
    filtered.length === 0
      ? '<div class="loading">Aucun résultat.</div>'
      : `<table>
        <thead><tr>
          <th>#</th><th>Classe</th><th>Groupe</th><th>Image</th><th>Détail</th><th>Actions</th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>`;
}

$("#men-search").addEventListener("input", () => renderMenus());

function openMenModal(m, title, editIdx) {
  state.menEditIdx = editIdx;
  $("#modal-men-title").textContent = title;
  $("#f-men-clas").value = m.clas || "";
  $("#f-men-groupe").value = m.groupe || "";
  $("#f-men-src").value = m.src || "";
  $("#f-men-detail").value = m.detail || "";
  openModal("modal-men");
}

function deleteMen(idx) {
  if (!confirm(`Supprimer "${state.menus[idx].detail}" ?`)) return;
  state.menus.splice(idx, 1);
  markDirty("men");
  renderMenus();
  showToast("Menu supprimé");
}

$("#men-table-wrap").addEventListener("click", (e) => {
  const btn = e.target.closest("[data-action]");
  if (!btn) return;
  const idx = +btn.dataset.idx;
  const action = btn.dataset.action;
  if (action === "edit")
    openMenModal(state.menus[idx], "Modifier le menu", idx);
  else if (action === "delete") deleteMen(idx);
  else if (action === "dup")
    openMenModal(state.menus[idx], "Copie de menu (nouveau)", -1);
});

$("#btn-save-men").addEventListener("click", () => {
  const clas = $("#f-men-clas").value.trim();
  if (!clas) {
    showToast("La classe CSS est requise", "error");
    return;
  }
  const obj = {
    clas,
    groupe: $("#f-men-groupe").value.trim(),
    src: $("#f-men-src").value.trim(),
    detail: $("#f-men-detail").value.trim(),
  };
  if (state.menEditIdx >= 0) {
    state.menus[state.menEditIdx] = obj;
    showToast("Menu modifié");
  } else {
    state.menus.push(obj);
    showToast("Menu ajouté");
  }
  markDirty("men");
  closeModal("modal-men");
  renderMenus();
});

$("#btn-export-men").addEventListener("click", () => {
  downloadJSON(state.menus, "menusVideos.json");
  markClean("men");
});
$("#btn-copy-men").addEventListener("click", () =>
  copyToClipboard(JSON.stringify(state.menus, null, 2)),
);

// ════════════════════════════════════════════════════════════════════════════
// SECTION PHOTOS
// ════════════════════════════════════════════════════════════════════════════

function getFilteredPhotos() {
  const search = $("#pho-search").value.toLowerCase().trim();
  return state.photos.filter(
    (p) =>
      !search ||
      p.ph?.toLowerCase().includes(search) ||
      p.spText?.toLowerCase().includes(search) ||
      p.divText?.toLowerCase().includes(search),
  );
}

function renderPhotos() {
  const filtered = getFilteredPhotos();
  $("#pho-count").textContent =
    `— ${filtered.length} album${filtered.length > 1 ? "s" : ""}`;

  const rows = filtered
    .map((p, i) => {
      const realIdx = state.photos.indexOf(p);
      return `<tr>
      <td class="td-mono td-num">${i + 1}</td>
      <td class="td-mono">${p.ph || ""}</td>
      <td class="td-mono td-trunc" title="${escHtml(p.src || "")}">${p.src?.replace("./box_img/", "") || ""}</td>
      <td>${escHtml(p.spText || "")}</td>
      <td class="td-trunc" title="${escHtml(p.divText || "")}">${escHtml(p.divText || "")}</td>
      <td><div class="td-actions">
        <button class="btn btn-sm btn-outline" data-action="edit" data-idx="${realIdx}" title="Modifier">✏️</button>
        <button class="btn btn-sm btn-danger"  data-action="delete" data-idx="${realIdx}" title="Supprimer">🗑</button>
        <button class="btn btn-sm btn-primary" data-action="dup" data-idx="${realIdx}" title="Dupliquer">+</button>
      </div></td>
    </tr>`;
    })
    .join("");

  $("#pho-table-wrap").innerHTML =
    filtered.length === 0
      ? '<div class="loading">Aucun résultat.</div>'
      : `<table>
        <thead><tr>
          <th>#</th><th>Identifiant</th><th>Image</th><th>Titre</th><th>Description</th><th>Actions</th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>`;
}

$("#pho-search").addEventListener("input", () => renderPhotos());

function openPhoModal(p, title, editIdx) {
  state.phoEditIdx = editIdx;
  $("#modal-pho-title").textContent = title;
  $("#f-pho-ph").value = p.ph || "";
  $("#f-pho-src").value = p.src || "";
  $("#f-pho-spText").value = p.spText || "";
  $("#f-pho-divText").value = p.divText || "";
  openModal("modal-pho");
}

function deletePho(idx) {
  if (!confirm(`Supprimer l'album "${state.photos[idx].spText}" ?`)) return;
  state.photos.splice(idx, 1);
  markDirty("pho");
  renderPhotos();
  showToast("Album supprimé");
}

$("#pho-table-wrap").addEventListener("click", (e) => {
  const btn = e.target.closest("[data-action]");
  if (!btn) return;
  const idx = +btn.dataset.idx;
  const action = btn.dataset.action;
  if (action === "edit")
    openPhoModal(state.photos[idx], "Modifier l'album", idx);
  else if (action === "delete") deletePho(idx);
  else if (action === "dup")
    openPhoModal(state.photos[idx], "Copie d'album (nouveau)", -1);
});

$("#btn-save-pho").addEventListener("click", () => {
  const ph = $("#f-pho-ph").value.trim();
  if (!ph) {
    showToast("L'identifiant est requis", "error");
    return;
  }
  const obj = {
    menu: "ph",
    ph,
    href: "",
    src: $("#f-pho-src").value.trim(),
    spText: $("#f-pho-spText").value.trim(),
    divText: $("#f-pho-divText").value.trim(),
  };
  if (state.phoEditIdx >= 0) {
    state.photos[state.phoEditIdx] = obj;
    showToast("Album modifié");
  } else {
    state.photos.push(obj);
    showToast("Album ajouté");
  }
  markDirty("pho");
  closeModal("modal-pho");
  renderPhotos();
});

$("#btn-export-pho").addEventListener("click", () => {
  syncBox();
  downloadJSON(state.box, "box.json");
  markClean("pho");
});
$("#btn-copy-pho").addEventListener("click", () => {
  syncBox();
  copyToClipboard(JSON.stringify(state.box, null, 2));
});

// ════════════════════════════════════════════════════════════════════════════
// SECTION BLOGS
// ════════════════════════════════════════════════════════════════════════════

function getFilteredBlogs() {
  const search = $("#blo-search").value.toLowerCase().trim();
  return state.blogs.filter(
    (b) =>
      !search ||
      b.spText?.toLowerCase().includes(search) ||
      b.href?.toLowerCase().includes(search) ||
      b.divText?.toLowerCase().includes(search),
  );
}

function renderBlogs() {
  const filtered = getFilteredBlogs();
  $("#blo-count").textContent =
    `— ${filtered.length} blog${filtered.length > 1 ? "s" : ""}`;

  const rows = filtered
    .map((b, i) => {
      const realIdx = state.blogs.indexOf(b);
      return `<tr>
      <td class="td-mono td-num">${i + 1}</td>
      <td>${escHtml(b.spText || "")}</td>
      <td class="td-trunc"><a href="${b.href || "#"}" target="_blank" rel="noopener" title="${escHtml(b.href || "")}">${escHtml(b.href || "")}</a></td>
      <td class="td-mono td-trunc" title="${escHtml(b.src || "")}">${b.src?.replace("./box_img/", "") || ""}</td>
      <td class="td-trunc" title="${escHtml(b.divText || "")}">${escHtml(b.divText || "")}</td>
      <td><div class="td-actions">
        <button class="btn btn-sm btn-outline" data-action="edit" data-idx="${realIdx}" title="Modifier">✏️</button>
        <button class="btn btn-sm btn-danger"  data-action="delete" data-idx="${realIdx}" title="Supprimer">🗑</button>
        <button class="btn btn-sm btn-primary" data-action="dup" data-idx="${realIdx}" title="Dupliquer">+</button>
      </div></td>
    </tr>`;
    })
    .join("");

  $("#blo-table-wrap").innerHTML =
    filtered.length === 0
      ? '<div class="loading">Aucun résultat.</div>'
      : `<table>
        <thead><tr>
          <th>#</th><th>Titre</th><th>URL</th><th>Image</th><th>Description</th><th>Actions</th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>`;
}

$("#blo-search").addEventListener("input", () => renderBlogs());

function openBloModal(b, title, editIdx) {
  state.bloEditIdx = editIdx;
  $("#modal-blo-title").textContent = title;
  $("#f-blo-spText").value = b.spText || "";
  $("#f-blo-href").value = b.href || "";
  $("#f-blo-src").value = b.src || "";
  $("#f-blo-divText").value = b.divText || "";
  openModal("modal-blo");
}

function deleteBlo(idx) {
  if (!confirm(`Supprimer le blog "${state.blogs[idx].spText}" ?`)) return;
  state.blogs.splice(idx, 1);
  markDirty("blo");
  renderBlogs();
  showToast("Blog supprimé");
}

$("#blo-table-wrap").addEventListener("click", (e) => {
  const btn = e.target.closest("[data-action]");
  if (!btn) return;
  const idx = +btn.dataset.idx;
  const action = btn.dataset.action;
  if (action === "edit")
    openBloModal(state.blogs[idx], "Modifier le blog", idx);
  else if (action === "delete") deleteBlo(idx);
  else if (action === "dup")
    openBloModal(state.blogs[idx], "Copie de blog (nouveau)", -1);
});

$("#btn-save-blo").addEventListener("click", () => {
  const spText = $("#f-blo-spText").value.trim();
  if (!spText) {
    showToast("Le titre est requis", "error");
    return;
  }
  const obj = {
    menu: "bl",
    ph: "",
    href: $("#f-blo-href").value.trim(),
    src: $("#f-blo-src").value.trim(),
    spText,
    divText: $("#f-blo-divText").value.trim(),
  };
  if (state.bloEditIdx >= 0) {
    state.blogs[state.bloEditIdx] = obj;
    showToast("Blog modifié");
  } else {
    state.blogs.push(obj);
    showToast("Blog ajouté");
  }
  markDirty("blo");
  closeModal("modal-blo");
  renderBlogs();
});

$("#btn-export-blo").addEventListener("click", () => {
  syncBox();
  downloadJSON(state.box, "box.json");
  markClean("blo");
});
$("#btn-copy-blo").addEventListener("click", () => {
  syncBox();
  copyToClipboard(JSON.stringify(state.box, null, 2));
});

// ── Avertissement avant de quitter si modifications non enregistrées ──────────
window.addEventListener("beforeunload", (e) => {
  const dirty =
    state.vidDirty || state.menDirty || state.phoDirty || state.bloDirty;
  if (dirty) {
    e.preventDefault();
    e.returnValue = "";
  }
});

// ── Init ──────────────────────────────────────────────────────────────────────
loadAll();

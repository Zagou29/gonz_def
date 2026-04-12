# GitHub Copilot Instructions - Galerie Famille Zagou

## Architecture du Projet

Ce projet est une **galerie familiale multimédia** (photos et vidéos YouTube) avec trois interfaces principales :

- **`index.html`** : Interface vidéos/diaporamas YouTube avec navigation par menus dropdown
- **`photos.html`** : Galerie photos avec diaporama et zoom
- **`admin.html`** : Interface d'administration pour gérer les données JSON (vidéos, menus, photos, blogs) — `noindex, nofollow`

### Structure Modulaire

- **`xfonctions/`** : Modules ES6 organisés par responsabilité
- **`css/`** : CSS modulaire avec variables CSS et responsive design (`admin.css`, `blog.css`, `dropdown.css`, `layout.css`, `menu.css`, `responsive.css`, `variables.css`, `video.css`)
- **`xjson/`** : Données JSON pour vidéos, menus et photos

## Convention de Classes CSS

### Système de Classes Vidéos

Les vidéos utilisent un système de classes hiérarchique :

```
.{type}.{catégorie}.{groupe}.{détail}
```

- **Type** : `.vid` (vidéos) ou `.dia` (diaporamas)
- **Catégorie** : `.fam` (famille), `.voy` (voyages), `.pll` (playlists)
- **Groupe/Détail** : identifiants spécifiques (ex: `.asie.vie`, `.1749.ava`)

Exemple : `.vid.voy.asie.vie` = vidéo voyage en Asie

### Données JSON Structurées

- **`indexVid.json`** : `{ec, typVid, clas, id, text, annee}` - ec="43" pour format 4:3, typVid="vid" ou "dia"
- **`menusVideos.json`** : `{clas, groupe, src, detail}` - raccorde classes aux menus
- **`photoImg.json`** : `{class, src, an}` - photos organisées par années
- **`box.json`** : `{menu, ph, href, src, spText, divText}` - menu="ph" pour photos, sinon blog

## Patterns de Développement Essentiels

### Gestion Mobile/Desktop

```javascript
import { mob } from "./xfonctions/nav_os.js";
const tempId = mob().mob ? "ytFrame" : "ytThumb";
```

- Mobile = iframes directes (`ytFrame`) pour tous les types
- Desktop = thumbnails cliquables (`ytThumb`) pour TOUS les types (famille, voyages, playlists)
- **Clic thumbnail** = transformation automatique en iframe (vidéos/playlists)

### Architecture Modulaire par Responsabilité

- **`affvid_refact.js`** : Classe `Affvid` pour affichage et filtrage des vidéos
- **`affimg.js`** : Classe `Affimg` pour injection images/dates photos (classes internes `BaseItem`, `AffItem`, `DateItem`)
- **`menuVid.js`** : Classe `MenuVid` pour navigation menus vidéos
- **`menubox.js`** : Classe `Menubox` pour menus boîtes photos/blogs (classes internes `BoxItem`, `Lien_menu_item`)
- **`managers.js`** : Bundle d'exports des managers — `AudioManager`, `NavigationManager`, `DiaporamaManager`, `UIManager`, `ZoomManager`, `EventManager`
- **`components/video-items.js`** : Composants réutilisables — `VidItem` (miniature/iframe), `BarItem` (barre de nav), `AnnItem` (élément année)
- **`utils/dimension-calculator.js`** : Classe `DimensionCalculator` — calcul dimensions optimales vidéo selon ratio et conteneur
- **`dom.js`** : Fonctions utilitaires `cloneTemplate(id)` et `createElement` — clone un `<template>` HTML par son ID (avec garde `null` → `Error` explicite si template introuvable)
- **`fullScreen.js`** : Fonctions `toggle_fullScreen(elem)` et `stop_fullScreen()` — gestion plein écran
- **`nav_os.js`** : Exports `mob`, `ordi_OS`, `navig` — détection mobile/OS/navigateur (iPad M1+ détecté via `maxTouchPoints`)

### Configuration Centralisée

```javascript
// xfonctions/config/video-config.js
export const VIDEO_CONFIG = {
  TEMPLATES: { THUMB: "ytThumb", FRAME: "ytFrame", FRAME_READ: "ytFrameR" },
  CLASSES: { VIDEO: "vid", DIAPO: "dia" }, // sans point — utilisés pour classList, pas querySelector
  TYPES: { VIDEO: "video", DIAPO: "diapo" },
  FORMATS: {
    FORMAT_4_3: "43",
    RATIO_4_3: 4 / 3,
    RATIO_16_9: 16 / 9,
  },
  DIMENSIONS: { MARGE_LARGEUR: 5, MARGE_HAUTEUR: 27 },
  MAX_ID_LENGTH: 12,
  PLAYLIST_ID_LENGTH: 34,
  YOUTUBE: {
    EMBED_BASE_URL: "https://www.youtube-nocookie.com/embed/",
    THUMB_BASE_URL: "https://img.youtube.com/vi/",
    THUMB_QUALITY: "maxresdefault.jpg",
    PLAYLIST_OEMBED_URL:
      "https://www.youtube.com/oembed?url=https://www.youtube.com/playlist?list=",
  },
};
```

### Pattern Template HTML + Clone

```javascript
const template = document.querySelector("#ytThumb");
const clone = template.content.cloneNode(true);
```

Utilisé pour créer dynamiquement vidéos, barres de navigation, etc.

## Fonctionnalités Spécifiques

### Navigation Avancée

- **Intersection Observer** : Synchronisation barre de navigation avec vidéos visibles
- **Années filtrant** : Navigation par années avec paramètre `data-year`
- **LocalStorage** : Persistance paramètres utilisateur (position, durée diaporama)
- **Clic Thumbnails** : Transformation automatique thumbnail → iframe avec détection auto playlist/vidéo

### Gestion Playlists YouTube

- **Détection automatique** : ID 34 caractères = playlist, 11 caractères = vidéo
- **Thumbnails intelligents** : API oEmbed YouTube pour récupérer thumbnail première vidéo
- **URLs spécialisées** : `/videoseries?list=` pour playlists vs `/embed/` pour vidéos
- **Fallback robuste** : Image générique si API oEmbed échoue

### Performance Web

- **Préchargement CSS** : CSS critique inline, non-critique différé
- **Module ES6** : `type="module"` avec `modulepreload`
- **Lazy Loading** : Images avec `loading="lazy"`

### Responsive & Accessibilité

- **CSS Variables** : `clamp()` pour tailles adaptatives
- **Touch Navigation** : Gestes swipe pour photos
- **Détection OS/Navigateur** : Safari iOS nécessite bouton spécial (`nav_os.js` utilise `includes()`)

## Commandes de Développement

### Extraction Données (pour mise à jour JSON)

```javascript
// Scripts utilitaires dans xfonctions/
// recupIndex.js - extrait vidéos HTML vers JSON
// recupPhotos.js - extrait données photos
// recupBox.js - extrait configuration menus
// recupVideos.js - extrait données vidéos
```

### Scripts Utilitaires Racine

- **`vidScript.js`** : Script principal vidéos (racine)
- **`photos.js`** : Script principal photos (racine)
- **`photos.css`** : CSS spécifique galerie photos (racine)
- **`admin.js`** : Script interface d'administration — gestion CRUD des JSON, export/clipboard
- **`scripts/resize-images.js`** : Utilitaire de redimensionnement d'images (Node.js + sharp)

### Structure Fichiers Médias

```
images/        # Photos .webp organisées par années
box_img/       # Images de couverture menus (.webp)
audio/         # Fichiers audio pour diaporamas
```

## Points d'Attention

- **Classes CSS longues** : Système hiérarchique complexe mais logique
- **Gestion Mobile** : Comportements différents mobile/desktop (iframes vs thumbnails)
- **Performance** : Attention au nombre d'éléments DOM créés dynamiquement
- **LocalStorage** : Paramètres utilisateur persistants pour UX
- **YouTube API** : URLs nocookie, gestion autoplay selon contexte, `postMessage` ciblé sur `https://www.youtube-nocookie.com`
- **Playlists** : Détection par longueur ID (34 vs 11 caractères) et API oEmbed pour thumbnails
- **Clic Thumbnails** : Transformation asynchrone thumbnail→iframe avec autoplay activé

## Conventions et Patterns Établis

### Parsing des classes CSS (`menuVid.js`)

Toujours utiliser `split(".")` pour extraire les segments de `clas`, jamais `slice()` à position fixe :

```javascript
const parts = clas.split("."); // ["", "fam", "ava"]
const menu = "." + parts[1]; // ".fam"
const detail = parts[2] || ""; // "ava" — longueur quelconque
```

Pour identifier la catégorie d'un élément DOM, utiliser `classList.find()` :

```javascript
const category =
  Array.from(element.classList)
    .find((c) => c.startsWith("menu_"))
    ?.slice(5) ?? "";
```

### Identification des boutons par `data-action` (`events.js`, `photos.html`)

Les boutons `.ret_fl` sont identifiés par `data-action` (jamais par index DOM) :

```html
<button class="ret_fl" data-action="hamburger">...</button>
```

```javascript
switch (actionEl.dataset.action) {
  case "hamburger": ...
  case "ratio": ...
  case "arrow-left": ...
  case "arrow-right": ...
  case "return": ...
  case "invert": ...
}
```

### Initialisation lazy de `AudioManager` (`audio.js`)

`new Audio()` n'est créé qu'au premier appel de `playPause()` via `#ensureAudio()`.  
`clearMusic()` est safe même si l'audio n'a jamais été initialisé (`if (!this.audio) return`).  
Ne jamais accéder à `audioManager.audio` directement — toujours passer par `playPause()` ou `clearMusic()`.

### Gardes `isConnected` pour les promesses fire-and-forget (`video-items.js`)

Après chaque `await` dans `#loadPlaylistThumbnail()`, vérifier que le nœud est toujours dans le DOM :

```javascript
if (!this.#video.isConnected) return;
```

### Pagination sans global (`admin.js`)

La pagination utilise `data-page` + un seul `addEventListener` par délégation, sans `window.vidPage` :

```javascript
$("#vid-pagination").addEventListener("click", (e) => {
  const btn = e.target.closest("[data-page]");
  if (!btn || btn.disabled) return;
  state.vidPage = +btn.dataset.page;
  renderVideos();
});
```

### Sécurité XSS dans `admin.js`

Toutes les propriétés JSON injectées dans `innerHTML` doivent passer par `escHtml()` :

```javascript
`<span class="badge badge-${escHtml(v.typVid || "")}">${escHtml(v.typVid || "")}</span>``<td class="td-mono">${escHtml(v.clas || "")}</td>`;
```

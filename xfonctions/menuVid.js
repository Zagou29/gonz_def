import { cloneTemplate } from "./dom.js";

/**
 * @typedef {Object} VideoItem
 * @property {string} clas - Classe CSS
 * @property {string} src - Source de l'image
 * @property {string} detail - Détail de la vidéo
 * @property {string} text - Texte descriptif
 * @property {string} groupe - Groupe d'appartenance
 */

/**
 * Gestion des menus vidéo
 * @class MenuVid
 */
export class MenuVid {
  #videos;
  #boxSelect;
  #boxElement;
  /** @type {Array<{clas: string, menu: string, id_groupe: string, typVid: string, detail: string}>} */
  #liensSelect;
  #listatrier;
  #item;
  /** @type {HTMLUListelement}li créée a partir des todos */
  #listElement = [];
  /**
   * @param {VideoItem[]} videos - Liste des vidéos
   */
  constructor(videos) {
    if (!Array.isArray(videos)) {
      throw new TypeError("videos doit être un tableau");
    }
    // videos est la liste de toutes le videos raccrochées aux menusVideos.json
    this.#videos = videos;
  }
  /**
   * Affiche les boxes de sélection
   * @param {HTMLElement} element - Élément DOM parent
   * @throws {Error} Si les paramètres sont invalides
   */
  affBoxes(element) {
    if (!element || !(element instanceof HTMLElement)) {
      throw new Error("element doit être un élément DOM valide");
    }
    // element est la div menu_fam, menu_voy ou menu_pll
    this.#boxElement = element;
    this.#boxSelect = this.#videos.filter((objbox) =>
      objbox.clas
        .slice(0, 4)
        .includes("." + this.#boxElement.className.slice(13)),
    );
    // this.#boxSelect filtre de videos(videos+menus) par la clas .fam/.voy/.pll
    // enlever le typevideo de la clas et le mettre dans tv
    
    // ne garder que le menu (fam/voy/pll), le id_groupe, le detail venant de la classe
    this.#listatrier = this.#boxSelect.map((item) => {
      const { clas, groupe } = item;
      const menu = clas.slice(0, 4);
      const detail = clas.slice(5, 8);
      return { clas, menu, groupe, detail };
    });
    /* enlever tous les doublons de listeatrier et trier : par detail puis groupe*/
    this.#liensSelect = Array.from(
      new Map(this.#listatrier.map((item) => [item.clas, item])).values(),
    ).sort((a, b) => {
      return (
        a.groupe.localeCompare(b.groupe) || a.detail.localeCompare(b.detail)
      );
    });
    this.#listElement = new DocumentFragment();
    this.#liensSelect.forEach((boite) => {
      this.#item = this.#boxSelect.filter((it) => it.clas === boite.clas);
      const box = new MenuItem(this.#item);
      this.#listElement.append(box.returnBox);
    });
    this.#boxElement.append(this.#listElement);
  }
}

// box=:{"clas": ".dia.voy.vie","groupe": "Asie","text": "2017 Saigon-Da.Nang",
// "src": "./box_img/Vietnam-11.jpg","detail": "Vietnam}
class MenuItem {
  #boxElement;
  #boxItem;
  #boxList = [];
  liste;
  constructor(box) {
    this.#boxList = box;
    this.#boxElement = cloneTemplate("menuBlocs").firstElementChild;
    const firstItem = this.#boxList[0];
    this.#boxItem = firstItem.clas;
    const imgElement = this.#boxElement.querySelector(".blogs");
    const tiBlogElement = this.#boxElement.querySelector(".ti_blog");
    imgElement.setAttribute("src", firstItem.src);
    imgElement.setAttribute("alt", firstItem.detail);
    imgElement.classList.add(firstItem.clas.slice(1, 4));
    tiBlogElement.textContent = firstItem.detail;
    tiBlogElement.dataset.select = this.#boxItem;
    this.#boxElement.querySelector(".groupe").textContent = firstItem.groupe;
    this.liste = new DocumentFragment();
    this.#boxList
      .sort((a, b) => b.typVid.localeCompare(a.typVid))
      .forEach((obj) => {
        const ligne = new Box_liste(obj);
        this.liste.append(ligne.returnDetail);
      });
    this.#boxElement.querySelector(".vid_list").append(this.liste);
  }
  get returnBox() {
    return this.#boxElement;
  }
}

/* Creation d'une ligne de detail videos */
class Box_liste {
  #detail;
  #ligneElement;
  constructor(detail) {
    this.#detail = detail;
    this.#ligneElement = cloneTemplate("line").firstElementChild;
    this.#ligneElement.textContent = this.#detail.text;
    this.#ligneElement.classList.add("detail");
    this.#ligneElement.classList.add(this.#detail.typVid);
  }
  get returnDetail() {
    return this.#ligneElement;
  }
}

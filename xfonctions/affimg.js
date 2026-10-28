import { cloneTemplate } from "./dom.js";

/**
 * Construit les images et reperes de date de la galerie photo.
 * Les images sont ajoutees progressivement par lots, sauf si la navigation
 * demande de rendre une image precise ou de restaurer une position memorisee.
 * @class Affimg
 */
export class Affimg {
  #imageList; // Liste des objets img venant de JSON
  #val_trans; // Option d'affichage ('photo' ou autre)
  #aspectClass; // show ou show_mod (aspect)
  #datesFragment; // Fragment où charger les liensdates
  #imagesContainer; // Boite où charger les images
  #datesContainer; // Boite où charger les Li dates
  #imageElements = []; // Éléments img collectés pendant la préparation
  #nextImageIndex = 0;
  #onImageAdded;
  #batchSize = 80;
  #loadMargin = 1200;
  #scrollHandler = () => this.#maybeLoadMore();

  /**
   * Crée une nouvelle instance d'Affimg
   * @param {Array} imageList - Liste des objets images du JSON
   * @param {string} val_trans - Option d'affichage ('photo' ou autre)
   * @param {string} aspectClass - Aspect des images ('show' ou 'show_mod')
   */
  constructor(imageList, val_trans, aspectClass) {
    this.#imageList = imageList;
    this.#val_trans = val_trans;
    this.#aspectClass = aspectClass;

    this.#preparerElements();
  }

  /**
   * Prépare les fragments d'images et de dates
   * @private
   */
  #preparerElements() {
    this.#datesFragment = new DocumentFragment();
    let vseuil = "";
    let photoIndex = 0; // Index spécifique pour l'option 'photo'

    this.#imageList.forEach((imgData, index) => {
      const nouvSeuil = imgData.an !== vseuil;

      if (nouvSeuil) {
        imgData.seuil = imgData.an; // Définit le seuil pour cet élément
        vseuil = imgData.an;
        if (this.#val_trans === "photo") {
          photoIndex = index; // Met à jour l'index de référence pour 'photo'
        }
      } else {
        imgData.seuil = ""; // Pas de seuil pour cet élément
      }

      // Assigne le numéro basé sur l'option
      imgData.num = this.#val_trans === "photo" ? photoIndex : index;

      // Crée et ajoute l'élément date (conditionnellement pour 'photo')
      if (this.#val_trans !== "photo" || imgData.seuil !== "") {
        //si "pas photos"=> un lien un lien pour chaque nouvelle date
        //si "photos"=> un lien pour chaque seuil non null
        const dateItem = new DateItem(imgData);
        this.#datesFragment.append(dateItem.element);
      }
    });
  }

  /**
   * Injecte les images dans l'élément d'ancrage
   * @param {HTMLElement} imagesContainer - L'élément DOM où injecter les images
   * @param {(image: HTMLImageElement) => void} [onImageAdded] - Callback exécuté après l'ajout d'une image
   * @returns {this}
   */
  creeimages(imagesContainer, onImageAdded) {
    this.#imagesContainer = imagesContainer;
    this.#onImageAdded = onImageAdded;
    this.#imageElements.length = this.#imageList.length;
    this.#renderMore();
    window.addEventListener("scroll", this.#scrollHandler, { passive: true });
    this.#imagesContainer.addEventListener("scroll", this.#scrollHandler, {
      passive: true,
    });
    window.addEventListener("resize", this.#scrollHandler, { passive: true });
    this.#scheduleLoadCheck();
    return this;
  }

  /**
   * Rend les images jusqu'à l'index demandé, pour la navigation par date.
   * @param {number} index
   */
  renderUntil(index) {
    if (
      !Number.isInteger(index) ||
      index < 0 ||
      index >= this.#imageList.length
    ) {
      return;
    }
    while (this.#nextImageIndex <= index) {
      this.#renderMore(
        Math.max(this.#batchSize, index - this.#nextImageIndex + 1),
        false,
      );
    }
    this.#scheduleLoadCheck();
  }

  /**
   * Charge assez de lots pour restaurer une position verticale mémorisée.
   * @param {number} position
   */
  renderForVerticalPosition(position) {
    if (!Number.isFinite(position) || position < 0) return;
    while (
      this.#nextImageIndex < this.#imageList.length &&
      document.documentElement.scrollHeight <
        position + window.innerHeight + this.#loadMargin
    ) {
      this.#renderMore(this.#batchSize, false);
    }
    this.#scheduleLoadCheck();
  }

  /**
   * Ajoute un lot d'images au DOM.
   * @param {number} [count]
   * @param {boolean} [schedule]
   * @private
   */
  #renderMore(count = this.#batchSize, schedule = true) {
    const fragment = new DocumentFragment();
    const start = this.#nextImageIndex;
    const end = Math.min(start + count, this.#imageList.length);

    while (this.#nextImageIndex < end) {
      const index = this.#nextImageIndex;
      const imageItem = new AffItem(
        this.#imageList[index],
        this.#aspectClass,
      );
      const image = imageItem.element;
      this.#imageElements[index] = image;
      fragment.append(image);
      this.#nextImageIndex += 1;
    }

    this.#imagesContainer.append(fragment);
    for (let index = start; index < end; index += 1) {
      this.#onImageAdded?.(this.#imageElements[index]);
    }
    if (schedule) this.#scheduleLoadCheck();
  }

  /**
   * Charge le lot suivant lorsque la fin du contenu approche.
   * @private
   */
  #maybeLoadMore() {
    if (this.#nextImageIndex >= this.#imageList.length) return;
    const lastImage = this.#imageElements[this.#nextImageIndex - 1];
    if (!lastImage) return;

    let isNearEnd;
    if (this.#imagesContainer.classList.contains("image_mod")) {
      const remaining =
        this.#imagesContainer.scrollWidth -
        this.#imagesContainer.scrollLeft -
        this.#imagesContainer.clientWidth;
      isNearEnd = remaining <= this.#loadMargin;
    } else {
      isNearEnd =
        lastImage.getBoundingClientRect().bottom <=
        window.innerHeight + this.#loadMargin;
    }

    if (isNearEnd) this.#renderMore();
  }

  /**
   * Réévalue après la mise à jour du layout.
   * @private
   */
  #scheduleLoadCheck() {
    if (this.#nextImageIndex < this.#imageList.length) {
      requestAnimationFrame(this.#scrollHandler);
    }
  }

  /**
   * Retourne les éléments img rendus, indexés comme la liste source
   * @return {HTMLImageElement[]}
   */
  get elements() {
    return this.#imageElements;
  }

  /**
   * Injecte les dates dans l'élément d'ancrage
   * @param {HTMLElement} datesContainer - L'élément DOM où injecter les dates
   * @returns {this}
   */
  creedates(datesContainer) {
    this.#datesContainer = datesContainer;
    // Vider le conteneur avant d'ajouter (optionnel, mais souvent utile)
    this.#datesContainer.append(this.#datesFragment);
    return this;
  }
}

/**
 * Classe de base pour les éléments créés (Image ou Date)
 * @class BaseItem
 */
class BaseItem {
  _element;
  _data;

  /**
   * @param {Object} data - Objet contenant les données (image ou date)
   * @param {string} templateId - ID du template HTML à cloner
   * @param {string} tagName - Nom de la balise de l'élément cloné (ex: 'IMG', 'BUTTON')
   */
  constructor(data, templateId, tagName) {
    this._data = data;
    const templateContent = cloneTemplate(templateId);
    // S'assurer que l'élément cloné correspond bien à la balise attendue
    this._element =
      templateContent.querySelector(tagName) ||
      templateContent.firstElementChild;
    if (!this._element) {
      throw new Error(
        `Template "${templateId}" ne contient pas l'élément attendu "${tagName}".`,
      );
    }

    this._configureElement();
  }

  /**
   * Configure les attributs communs et dataset
   * @protected
   */
  _configureElement() {
    this._element.dataset.an = this._data.an;
    this._element.dataset.num = this._data.num;
    if (this._data.seuil !== "") {
      this._element.dataset.seuil = this._data.seuil;
    }
  }

  /**
   * Retourne l'élément DOM créé
   * @return {HTMLElement}
   */
  get element() {
    return this._element;
  }
}

/**
 * Classe pour créer un élément image
 * @class AffItem
 * @extends BaseItem
 */
class AffItem extends BaseItem {
  /**
   * @param {Object} imgData - Objet image à afficher
   * @param {string} aspectClass - Classe CSS à appliquer
   */
  constructor(imgData, aspectClass) {
    super(imgData, "photos", "img"); // Utilise le template "photos" et attend une balise <img>
    const src = this._data.src;
    const base = src.replace(".webp", ""); // ex: "./images/a0813-001-2008"
    this._element.setAttribute("src", src); // fallback navigateurs anciens
    this._element.setAttribute(
      "srcset",
      `${base}-400w.webp 400w, ${base}-800w.webp 800w, ${src} 1200w`,
    );
    this._element.setAttribute(
      "sizes",
      "(max-width: 500px) 400px, (max-width: 900px) 800px, 1200px",
    );
    this._element.setAttribute("alt", this._data.an);
    this._element.setAttribute("class", aspectClass);
    // La configuration commune (dataset) est gérée par le constructeur parent
  }
}

/**
 * Classe pour créer un élément de date (lien/bouton)
 * @class DateItem
 * @extends BaseItem
 */
class DateItem extends BaseItem {
  /**
   * @param {Object} dateData - Objet contenant les informations de date
   */
  constructor(dateData) {
    // Supposons que le template "liendate" contient un <button> ou <a>
    // Ajustez "button" si c'est une autre balise (ex: "a")
    super(dateData, "liendate", "li");
    this._element.textContent = this._data.an;
    // La configuration commune (dataset) est gérée par le constructeur parent
  }
}

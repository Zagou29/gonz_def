/* Bascule la galerie entre affichage normal et image agrandie, synchronise
   les commandes visibles et restaure la position de défilement à la sortie. */
import { stop_fullScreen } from "./fullScreen.js";

export class ZoomManager {
  constructor(domElements, stats, diaporamaManager, uiManager) {
    this.domElements = domElements;
    this.stats = stats;
    this.diaporamaManager = diaporamaManager;
    this.uiManager = uiManager;
    // Référence stable pour pouvoir retirer l'écouteur wheel correctement
    this._wheelHandler = () => this.diaporamaManager.clearMusic();
  }

  /* Zoom quand on clicke sur une image */
  zoom(e) {
    if (this.shouldExitZoom(e)) return;
    this.stats.zoome = !this.stats.zoome;
    this.handleZoomToggle(e);
    this.updateZoomUI(e);
  }

  shouldExitZoom(e) {
    return e.target.matches(".bloc") || e.target.matches(".image");
  }

  handleZoomToggle(e) {
    stop_fullScreen();
    this.diaporamaManager.clearMusic();
    this.uiManager.alert();
    if (this.stats.zoome) {
      this.stats.yimg = e.target.getBoundingClientRect().top;
      clearInterval(this.stats.nId);
      this.stats.nId = null;
    } else {
      this.syncZoomedTarget();
    }
  }

  /* retrouve l'image affichee en mode agrandi (avance par diaporama ou balayage) */
  syncZoomedTarget() {
    const box = this.domElements.boiteImg;
    const first = this.stats.list_img[0];
    if (!first || !first.offsetWidth) return;
    const index = Math.round(box.scrollLeft / first.offsetWidth);
    const last = this.stats.list_img.length - 1;
    this._zoomedTarget = this.stats.list_img[Math.max(0, Math.min(index, last))];
  }

  updateZoomUI(e) {
    this.domElements.boiteImg.classList.toggle("image_mod");
    this.domElements.fix_fond.classList.toggle("envel_mod");
    this.domElements.fleches.forEach((fl) => fl.classList.toggle("show_grid"));
    this.domElements.diap.classList.toggle("show_grid");
    this.domElements.hamb.classList.toggle("invis");
    this.domElements.showMod.classList.toggle("invis");
    this.domElements.fl_foot.forEach((fl) => fl.classList.toggle("eff_fl"));

    if (this.stats.zoome) {
      this.handleZoomIn(e);
    } else {
      this.handleZoomOut(e);
    }
  }

  handleZoomIn(e) {
    this._zoomedTarget = e.target;
    this.domElements.boiteImg.scrollTo({ left: e.target.offsetLeft });
    this.domElements.hamb.classList.remove("open");
    this.domElements.menu.classList.remove("open");
    this.domElements.diap.classList.remove("diapo_on");
    this.domElements.full.classList.add("showfl");
    setTimeout(() => this.uiManager.alert(), 4000);
    this.domElements.boiteImg.addEventListener("wheel", this._wheelHandler);
  }

  handleZoomOut() {
    this.domElements.full.classList.remove("showfl");
    this.domElements.boiteImg.removeEventListener("wheel", this._wheelHandler);
    const target = this._zoomedTarget || this.stats.list_img[0];
    window.scrollTo({
      top: target.offsetTop - this.stats.yimg,
      behavior: "instant",
    });
    this._zoomedTarget = null;
  }
}

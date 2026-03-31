/* Module pour la gestion du diaporama */

export class DiaporamaManager {
  constructor(domElements, stats, audioManager, navigationManager) {
    this.domElements = domElements;
    this.stats = stats;
    this.audioManager = audioManager;
    this.navigationManager = navigationManager;
  }

  /* toggle lancer / arreter diapos et icone diapo */
  toggleDiapo(image) {
    if (
      this.stats.list_img.length - 1 >
      -this.stats.list_img[0].getBoundingClientRect().x / image.offsetWidth
    ) {
      this.domElements.diap.classList.toggle("diapo_on");
      if (!this.stats.nId && this.stats.zoome) {
        this.stats.nId = setInterval(() => {
          // Essayer de passer à l'image suivante
          const canContinue = this.navigationManager.depHor(image, 1);
          // Si on ne peut plus avancer (dernière image), arrêter le diaporama
          if (!canContinue) {
            this.clearMusic();
          }
        }, this.stats.delai);
        this.audioManager.playPause(1);
      } else {
        this.clearMusic();
      }
    }
  }

  clearMusic() {
    clearInterval(this.stats.nId);
    this.stats.nId = null;
    this.audioManager.clearMusic();
    this.domElements.diap.classList.remove("diapo_on");
  }

  /* augmenter, diminuer le delai */
  delaiChange(del, sens) {
    if (!this.stats.zoome) return del;
    del === 4000 ? (del = 1000) : (del = del + 500 * sens);
    del = Math.max(1000, del);
    del = Math.min(4000, del);
    this.domElements.duree.textContent = `${del / 1000} sec`;
    return del;
  }

  /* gestion des diapo par icones */
  setupDiaporama(image) {
    this.domElements.diap.addEventListener("click", (e) => {
      const target = e.target;
      if (target.classList.contains("slide")) {
        this.toggleDiapo(image);
      } else if (target.classList.contains("mute")) {
        if (this.stats.nId !== null) this.audioManager.playPause(1);
      } else if (target.classList.contains("son")) {
        if (this.stats.nId !== null) this.audioManager.playPause(0);
      } else if (target.classList.contains("duree")) {
        this.stats.delai = this.delaiChange(this.stats.delai, +1);
      }
    });
  }
}

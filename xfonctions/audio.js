/* Module pour la gestion de l'audio */

export class AudioManager {
  constructor(domElements) {
    this.domElements = domElements;
    this.audio = null;
  }

  #ensureAudio() {
    if (this.audio) return;
    const rnd = (max) => Math.floor(Math.random() * max) + 1;
    this.audio = new Audio(`./audio/audio_${rnd(11)}.mp3`);
    this.audio.addEventListener("ended", () => {
      this.audio.currentTime = 0;
      this.audio.play();
    });
  }

  playPause(sens) {
    this.#ensureAudio();
    const shouldPlay = sens === 1;
    this.audio[shouldPlay ? "play" : "pause"]();
    this.domElements.mute.classList.toggle("eff_fl", shouldPlay);
    this.domElements.son.classList.toggle("eff_fl", !shouldPlay);
    return sens;
  }

  clearMusic() {
    if (!this.audio) return;
    this.audio.currentTime = 0;
    this.audio.pause();
    this.domElements.mute.classList.add("eff_fl");
    this.domElements.son.classList.remove("eff_fl");
  }

  toggleSon(sens) {
    return sens === 1 ? this.playPause(0) : this.playPause(1);
  }
}

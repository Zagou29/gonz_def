/**
 * Module de gestion du mode plein écran
 */

const fsAPI = {
  element: () => document.fullscreenElement,
  request: (elem) => elem.requestFullscreen(),
  exit: () => document.exitFullscreen(),
  isSupported: () => document.fullscreenEnabled,
};

/**
 * Quitte le mode plein écran
 * @returns {Promise} - Promesse résolue quand le plein écran est désactivé
 */
const stop_fullScreen = () => {
  if (!fsAPI.element()) {
    return Promise.resolve();
  }

  return fsAPI.exit().catch((error) => {
    console.error("Erreur lors de la sortie du plein écran:", error);
    throw error;
  });
};

/**
 * Bascule l'état plein écran d'un élément
 * @param {HTMLElement} elem - Élément à mettre en plein écran
 * @returns {Promise} - Promesse résolue après le changement d'état
 */
const toggle_fullScreen = (elem) => {
  if (!elem) {
    return Promise.reject(new Error("Aucun élément fourni"));
  }

  if (fsAPI.element()) {
    return stop_fullScreen();
  } else {
    return fsAPI.request(elem).catch((error) => {
      console.error("Erreur lors du passage en plein écran:", error);
      throw error;
    });
  }
};

export { toggle_fullScreen, stop_fullScreen };

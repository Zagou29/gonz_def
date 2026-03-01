export const fetchJSON = async (url, options = {}) => {
  const headers = { Accept: "application/json", ...options.headers };
  const r = await fetch(url, { ...options, headers });
  if (!r.ok) throw new Error("Erreur serveur", { cause: r });
  return r.json();
};

/**
 * Charge un fichier JSON via import() avec Import Attributes,
 * ou via fetch() en fallback pour les navigateurs plus anciens.
 * @param {string} path  Chemin relatif du fichier JSON
 * @returns {Promise<any>}
 */
export const loadJson = async (path) => {
  try {
    const mod = await import(path, { with: { type: "json" } });
    return mod.default;
  } catch {
    const res = await fetch(path);
    if (!res.ok)
      throw new Error(`Impossible de charger ${path} (HTTP ${res.status})`);
    return res.json();
  }
};

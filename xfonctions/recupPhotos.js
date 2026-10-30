// Extrait les champs utiles du JSON photo (classe, chemin de l'image, année)
// pour produire une liste simplifiée.
import { fetchJSON } from "./api.js";
const listImages = await fetchJSON("./xjson/photoImg.json");
const jsonObj = {};
const jsonFile = [];

listImages.forEach((img) => {
  jsonObj.class = img.class;
  jsonObj.src = img.src;
  jsonObj.an = img.an;
  jsonFile.push({
    class: jsonObj.class,
    src: jsonObj.src,
    an: jsonObj.an,
  });
});
console.log(jsonFile);

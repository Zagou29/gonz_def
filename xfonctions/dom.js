/**
 *
 * @param {string} tagName
 * @param {object} attributes
 * @return {HTMLelement}
 */
const createElement = (tagName, attributes = {}) => {
  const element = document.createElement(tagName);
  for (const [attribute, value] of Object.entries(attributes)) {
    if (value !== null) {
      element.setAttribute(attribute, value);
    }
  }
  return element;
};
/**
 *
 * @param {string} id
 * @returns {documentFragment} clone du template
 */
const cloneTemplate = (id) => {
  const tpl = document.getElementById(id);
  if (!tpl) throw new Error(`Template "#${id}" introuvable`);
  return tpl.content.cloneNode(true);
};
export { createElement, cloneTemplate };

# Instructions Copilot — Galerie Famille Zagou

## Projet

Site statique de galerie familiale, sans framework ni bundler. Les pages utilisent des modules ES natifs :

- `index.html` charge `vidScript.js` pour les vidéos et diaporamas YouTube.
- `photos.html` charge `photos.js` pour la galerie et le diaporama photo.
- `admin.html` et `admin.js` permettent de modifier les données JSON.

Le code métier est dans `xfonctions/`, les styles vidéo et administration dans `css/`, les données dans `xjson/`, et les médias dans `images/`, `box_img/` et `audio/`. Garder ces responsabilités et les conventions existantes ; ne pas ajouter de framework ou de bundler sans nécessité.

## Données et affichage

- `xjson/indexVid.json` décrit les vidéos (`ec`, `typVid`, `clas`, `id`, `text`, `annee`).
- `xjson/menusVideos.json` relie les classes aux menus ; `xjson/photoImg.json` décrit les photos ; `xjson/box.json` contient les entrées des menus photos et blogs.
- Les classes vidéo suivent `.{type}.{catégorie}.{groupe}.{détail}` (`vid` ou `dia`, puis par exemple `fam`, `voy` ou `pll`). Pour parser `clas`, utiliser `split(".")` plutôt qu’une découpe à position fixe.
- Les vidéos utilisent des iframes sur mobile et iPad, des miniatures sur ordinateur. Préserver le passage miniature → iframe et les différences d’URL entre vidéos et playlists.
- `VIDEO_CONFIG` dans `xfonctions/config/video-config.js` centralise les templates, classes, ratios, dimensions et URL YouTube. Réutiliser cette configuration au lieu de dupliquer ses valeurs.
- Les éléments dynamiques sont construits à partir des templates HTML via `cloneTemplate()` (`xfonctions/dom.js`) ou les composants existants. Un template requis mais manquant doit produire une erreur explicite.

## Galerie photo et performance

- `Affimg` (`xfonctions/affimg.js`) ajoute les images au DOM progressivement, par lots de 80, à mesure que l’utilisateur approche de la fin du contenu (marge de 1 200 px).
- Préserver ce chargement progressif, l’ordre des images, l’observation des éléments ajoutés et la navigation par date. La restauration d’une position mémorisée et l’accès direct à une date doivent rendre les images nécessaires avant le défilement.
- Les préférences de galerie (position, délai du diaporama, sens des dates et affichage) sont persistées dans `localStorage`.
- Respecter le chargement différé des images et les comportements de navigation tactile et Safari iOS.

## Modules et conventions importantes

- Réutiliser les responsabilités existantes : `Affvid`, `Affimg`, `MenuVid`, `Menubox` et les managers exportés par `xfonctions/managers.js` (audio, navigation, diaporama, UI, zoom et événements).
- Les boutons d’action `.ret_fl` sont identifiés par `data-action`, jamais par leur position dans le DOM.
- `AudioManager` initialise l’objet `Audio` à la première lecture ; contrôler l’audio via ses méthodes, pas en modifiant son état depuis un composant.
- Après chaque `await` dans le chargement de miniature de playlist, vérifier que l’élément est encore connecté au DOM avant de le modifier.
- Pour les interactions d’administration, conserver la délégation d’événements et l’état local existants ; la pagination utilise `data-page`, sans variable globale sur `window`.
- Toute donnée dynamique injectée dans `innerHTML` dans `admin.js` doit être échappée avec `escHtml()`. Préférer `textContent` lorsque du HTML n’est pas nécessaire.
- Conserver les URL YouTube `youtube-nocookie.com` et cibler cette origine pour les messages `postMessage`.

## Commandes et validation

- Node.js `>=20.3.0` est requis pour `npm run resize` (outil de redimensionnement d’images utilisant `sharp`).
- Le dépôt ne définit pas de suite de tests ou de commande de build. Après une modification, utiliser les vérifications ciblées disponibles et vérifier les parcours concernés dans le navigateur ; ne pas lancer `npm run resize` sauf si le traitement des images est demandé.
- Les pages et imports JSON doivent être testés via HTTP, pas en ouvrant les fichiers avec `file://`.

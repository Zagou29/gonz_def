/**
 * Script de génération des variantes redimensionnées des photos
 * Usage : node scripts/resize-images.js
 * Prérequis : npm install sharp
 */

import sharp from "sharp";
import { readdirSync, existsSync } from "fs";
import { join, basename, extname } from "path";

const INPUT_DIR = "./images";
// Largeurs cibles en pixels (l'original reste inchangé comme fallback)
const SIZES = [400, 800];

const files = readdirSync(INPUT_DIR).filter(
  (f) => f.endsWith(".webp") && !f.includes("-400w") && !f.includes("-800w"),
);

console.log(`${files.length} images trouvées, génération en cours...`);
let count = 0;

for (const file of files) {
  const name = basename(file, extname(file)); // ex: "a0813-001-2008"
  const inputPath = join(INPUT_DIR, file);

  for (const width of SIZES) {
    const outputPath = join(INPUT_DIR, `${name}-${width}w.webp`);
    // Ne pas régénérer si déjà existant
    if (existsSync(outputPath)) continue;
    await sharp(inputPath)
      .resize(width) // hauteur calculée automatiquement (ratio conservé)
      .webp({ quality: 82 }) // qualité optimale pour le web
      .toFile(outputPath);
    count++;
  }
}

console.log(`✓ ${count} variantes générées dans ${INPUT_DIR}`);

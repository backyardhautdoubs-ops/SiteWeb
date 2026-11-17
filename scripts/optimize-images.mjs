import sharp from 'sharp';
import { fileURLToPath } from 'node:url';

const image = name => fileURLToPath(new URL(`../public/images/${name}`, import.meta.url));
for (const width of [640, 1024, 1600]) {
  await sharp(image('parcours-haut-doubs.jpg')).resize({ width, withoutEnlargement: true }).webp({ quality: 82 }).toFile(image(`parcours-${width}.webp`));
}
for (const name of ['partenaire-gaby', 'partenaire-gilley']) {
  await sharp(image(`${name}.jpg`)).resize({ width: 360, height: 360, fit: 'inside', withoutEnlargement: true }).webp({ quality: 85 }).toFile(image(`${name}.webp`));
}
await sharp(image('affiche-officielle.jpg')).resize({ width: 720, withoutEnlargement: true }).webp({ quality: 86 }).toFile(image('affiche-officielle.webp'));
console.log('Responsive landscape, poster and partner images optimized.');

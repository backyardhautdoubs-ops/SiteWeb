import sharp from 'sharp';
import { fileURLToPath } from 'node:url';

const source = fileURLToPath(new URL('../logo.jpg', import.meta.url));
const output = (filename) => fileURLToPath(new URL(`../public/images/${filename}`, import.meta.url));
const { data, info } = await sharp(source)
  .removeAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });

const palette = {
  teal: [5, 105, 102],
  ochre: [217, 149, 47],
  charcoal: [42, 47, 46],
  gray: [158, 158, 158],
  white: [255, 255, 255]
};

function fitAgainstWhite(pixel, target) {
  const vector = target.map((channel) => 255 - channel);
  const observed = pixel.map((channel) => 255 - channel);
  const denominator = vector.reduce((sum, value) => sum + value * value, 0);
  const alpha = Math.max(0, Math.min(1, observed.reduce((sum, value, index) => sum + value * vector[index], 0) / denominator));
  const error = observed.reduce((sum, value, index) => {
    const difference = value - alpha * vector[index];
    return sum + difference * difference;
  }, 0);
  return { alpha, error };
}

function createVariant(mode) {
  const output = Buffer.alloc(info.width * info.height * 4);

  for (let sourceIndex = 0, outputIndex = 0; sourceIndex < data.length; sourceIndex += 3, outputIndex += 4) {
    const pixel = [data[sourceIndex], data[sourceIndex + 1], data[sourceIndex + 2]];
    const tealFit = fitAgainstWhite(pixel, palette.teal);
    const ochreFit = fitAgainstWhite(pixel, palette.ochre);
    const isOchre = ochreFit.error < tealFit.error;
    const fit = isOchre ? ochreFit : tealFit;
    // The source is a compressed JPEG. A firm mask removes its colored
    // compression noise before the clean PNG is enlarged and antialiased.
    const alpha = fit.alpha >= 0.32 ? 1 : 0;

    let color;
    if (mode === 'white') color = palette.white;
    else if (mode === 'gray') color = isOchre ? palette.gray : palette.charcoal;
    else color = isOchre ? palette.ochre : palette.teal;

    output[outputIndex] = color[0];
    output[outputIndex + 1] = color[1];
    output[outputIndex + 2] = color[2];
    output[outputIndex + 3] = alpha * 255;
  }

  return sharp(output, {
    raw: { width: info.width, height: info.height, channels: 4 }
  }).resize(info.width * 4, info.height * 4, { kernel: sharp.kernel.lanczos3 });
}

await Promise.all([
  createVariant('color').png().toFile(output('logo-backyard-transparent.png')),
  createVariant('white').png().toFile(output('logo-backyard-blanc.png')),
  createVariant('gray').png().toFile(output('logo-backyard-gris.png'))
]);

console.log(`Generated 3 transparent logo variants at ${info.width * 4}×${info.height * 4}px.`);

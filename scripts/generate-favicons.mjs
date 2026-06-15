// Generates the full favicon set from public/favicon.svg using sharp.
// Run: node scripts/generate-favicons.mjs
import sharp from "sharp";
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const pub = join(root, "public");

// Circle source (transparent corners) — for browser tab favicons.
const circleSvg = await readFile(join(pub, "favicon.svg"));

// Square full-bleed source — for the iOS home-screen icon and PWA/maskable
// icons, where transparent corners would leave gaps behind the platform mask.
const squareSvg = Buffer.from(`<svg width="64" height="64" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
  <defs><linearGradient id="tile" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
    <stop offset="0" stop-color="#38bdf8"/><stop offset="0.55" stop-color="#3b82f6"/><stop offset="1" stop-color="#6366f1"/>
  </linearGradient></defs>
  <rect width="64" height="64" fill="url(#tile)"/>
  <text x="32" y="34" font-family="Helvetica, Arial, sans-serif" font-size="38" font-weight="800"
        fill="#f7fafc" text-anchor="middle" dominant-baseline="central">JC</text>
</svg>`);

const pngAt = (size, src = circleSvg) =>
  sharp(src, { density: 384 }).resize(size, size, { fit: "contain" }).png().toBuffer();

// Standalone PNG icons: circle for browser tabs, square for Apple/PWA.
const outputs = [
  ["favicon-16x16.png", 16, circleSvg],
  ["favicon-32x32.png", 32, circleSvg],
  ["favicon-48x48.png", 48, circleSvg],
  ["apple-touch-icon.png", 180, squareSvg],
  ["icon-192.png", 192, squareSvg],
  ["icon-512.png", 512, squareSvg],
];
for (const [name, size, src] of outputs) {
  await writeFile(join(pub, name), await pngAt(size, src));
}

// favicon.ico — multi-resolution container embedding PNG payloads (16/32/48).
const icoSizes = [16, 32, 48];
const pngs = await Promise.all(icoSizes.map((s) => pngAt(s)));
const header = Buffer.alloc(6);
header.writeUInt16LE(0, 0); // reserved
header.writeUInt16LE(1, 2); // type: icon
header.writeUInt16LE(pngs.length, 4); // count

let offset = 6 + pngs.length * 16;
const entries = [];
pngs.forEach((png, i) => {
  const e = Buffer.alloc(16);
  e.writeUInt8(icoSizes[i] >= 256 ? 0 : icoSizes[i], 0); // width
  e.writeUInt8(icoSizes[i] >= 256 ? 0 : icoSizes[i], 1); // height
  e.writeUInt8(0, 2); // palette
  e.writeUInt8(0, 3); // reserved
  e.writeUInt16LE(1, 4); // color planes
  e.writeUInt16LE(32, 6); // bits per pixel
  e.writeUInt32LE(png.length, 8); // size of payload
  e.writeUInt32LE(offset, 12); // offset
  offset += png.length;
  entries.push(e);
});
await writeFile(join(pub, "favicon.ico"), Buffer.concat([header, ...entries, ...pngs]));

console.log("Favicon set generated in public/");

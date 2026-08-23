import { readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import sharp from "sharp";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const source = join(root, "public", "brand", "parshuram-mark-master.png");

async function resized(size) {
  return sharp(source)
    .resize(size, size, { fit: "contain" })
    .png({ compressionLevel: 9, palette: true })
    .toBuffer();
}

function pngIco(images) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(images.length, 4);
  const entries = Buffer.alloc(images.length * 16);
  let offset = 6 + entries.length;
  images.forEach(({ size, data }, index) => {
    const start = index * 16;
    entries.writeUInt8(size >= 256 ? 0 : size, start);
    entries.writeUInt8(size >= 256 ? 0 : size, start + 1);
    entries.writeUInt8(0, start + 2);
    entries.writeUInt8(0, start + 3);
    entries.writeUInt16LE(1, start + 4);
    entries.writeUInt16LE(32, start + 6);
    entries.writeUInt32LE(data.length, start + 8);
    entries.writeUInt32LE(offset, start + 12);
    offset += data.length;
  });
  return Buffer.concat([header, entries, ...images.map((image) => image.data)]);
}

const [icon32, icon64, icon180, icon192, icon256, icon512] = await Promise.all(
  [32, 64, 180, 192, 256, 512].map(async (size) => ({
    size,
    data: await resized(size),
  })),
);

await Promise.all([
  writeFile(join(root, "src", "app", "icon.png"), icon512.data),
  writeFile(join(root, "src", "app", "apple-icon.png"), icon180.data),
  writeFile(
    join(root, "src", "app", "favicon.ico"),
    pngIco([icon32, icon64, icon256]),
  ),
  writeFile(
    join(root, "public", "brand", "parshuram-mark-192.png"),
    icon192.data,
  ),
  writeFile(
    join(root, "public", "brand", "parshuram-mark-512.png"),
    icon512.data,
  ),
]);

const socialBackground = Buffer.from(`
  <svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="glow" cx="88%" cy="20%" r="75%">
        <stop offset="0" stop-color="#F9B36F" stop-opacity="0.55"/>
        <stop offset="1" stop-color="#FFF8EC" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <rect width="1200" height="630" fill="#FFF8EC"/>
    <rect width="1200" height="630" fill="url(#glow)"/>
    <path d="M0 552 C240 488 408 625 650 552 C860 488 1018 542 1200 468 L1200 630 L0 630 Z" fill="#EC7416" opacity="0.10"/>
    <text x="76" y="170" fill="#9B3E13" font-size="24" font-family="Arial, sans-serif" font-weight="700" letter-spacing="5">NASHIK · EST. 1933</text>
    <text x="72" y="254" fill="#2E211B" font-size="62" font-family="Georgia, serif" font-weight="700">Chittapawan</text>
    <text x="72" y="326" fill="#2E211B" font-size="62" font-family="Georgia, serif" font-weight="700">Brahman Sangh</text>
    <text x="76" y="386" fill="#6E5A4D" font-size="28" font-family="Arial, sans-serif">Community Business Directory</text>
    <rect x="76" y="443" width="116" height="7" rx="3.5" fill="#EC7416"/>
    <text x="76" y="494" fill="#6E5A4D" font-size="22" font-family="Arial, sans-serif">Discover trusted businesses within the community.</text>
  </svg>
`);
const mark = await sharp(icon512.data).resize(430, 430).png().toBuffer();
const social = await sharp(socialBackground)
  .composite([{ input: mark, left: 724, top: 94 }])
  .png({ compressionLevel: 9 })
  .toBuffer();
await Promise.all([
  writeFile(join(root, "src", "app", "opengraph-image.png"), social),
  writeFile(join(root, "src", "app", "twitter-image.png"), social),
]);

const metadata = await sharp(await readFile(source)).metadata();
console.log(
  `Brand assets generated from ${metadata.width}x${metadata.height} RGBA master.`,
);

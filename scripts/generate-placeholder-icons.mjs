// Generates placeholder PWA icons as solid-color PNGs.
// Real icons land in Module 5. This exists so the manifest validates and the
// PWA install criteria are met during Modules 1-4.
//
// Usage: node scripts/generate-placeholder-icons.mjs

import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { crc32, deflateSync } from 'node:zlib';

const here = dirname(fileURLToPath(import.meta.url));
const outDir = join(here, '..', 'public', 'icons');
mkdirSync(outDir, { recursive: true });

function chunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([length, typeBuf, data, crc]);
}

function solidPng({ size, rgb, padding = 0 }) {
  const [r, g, b] = rgb;
  // RGB scanlines with a filter byte (0 = none) per row.
  const rowLength = 1 + size * 3;
  const raw = Buffer.alloc(rowLength * size);
  for (let y = 0; y < size; y++) {
    raw[y * rowLength] = 0; // filter
    for (let x = 0; x < size; x++) {
      const i = y * rowLength + 1 + x * 3;
      const inPadding =
        padding > 0 && (x < padding || y < padding || x >= size - padding || y >= size - padding);
      raw[i] = inPadding ? 0x0a : r;
      raw[i + 1] = inPadding ? 0x0a : g;
      raw[i + 2] = inPadding ? 0x0a : b;
    }
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr.writeUInt8(8, 8); // bit depth
  ihdr.writeUInt8(2, 9); // color type 2 = RGB
  ihdr.writeUInt8(0, 10);
  ihdr.writeUInt8(0, 11);
  ihdr.writeUInt8(0, 12);

  const idatData = deflateSync(raw);
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  return Buffer.concat([
    signature,
    chunk('IHDR', ihdr),
    chunk('IDAT', idatData),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// Brand color: a calm green that hints at "completion intensity" for the heatmap.
const brand = [34, 139, 79];

const icons = [
  { name: 'icon-192.png', size: 192, padding: 0 },
  { name: 'icon-512.png', size: 512, padding: 0 },
  // Maskable icons need a safe zone (~10% on each side) per the spec.
  { name: 'icon-maskable-512.png', size: 512, padding: 52 },
];

for (const { name, size, padding } of icons) {
  const png = solidPng({ size, rgb: brand, padding });
  writeFileSync(join(outDir, name), png);
  console.log(`wrote ${name} (${size}x${size}, ${png.length} bytes)`);
}

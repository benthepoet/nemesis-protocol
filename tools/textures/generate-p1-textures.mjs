#!/usr/bin/env node
/**
 * Procedural P1 deck textures — CC BY 4.0 original (see LICENSE-ASSETS).
 * Wear mask channels: R=hand-height band, G=threshold scuffs, B=door frames.
 */
import { createHash } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { deflateSync } from 'node:zlib';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, '../../assets/textures');

const W = 256;
const H = 256;

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const typeBuf = Buffer.from(type, 'ascii');
  const crcBuf = Buffer.alloc(4);
  const crc = crc32(Buffer.concat([typeBuf, data]));
  crcBuf.writeUInt32BE(crc);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function writePng(path, rgba) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(W, 0);
  ihdr.writeUInt32BE(H, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  const raw = Buffer.alloc(H * (1 + W * 4));
  for (let y = 0; y < H; y++) {
    const row = 1 + y * (1 + W * 4);
    raw[row - 1] = 0;
    rgba.copy(raw, row, y * W * 4, (y + 1) * W * 4);
  }
  const idat = deflateSync(raw);
  const png = Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', idat),
    chunk('IEND', Buffer.alloc(0)),
  ]);
  writeFileSync(path, png);
}

function fill(fn) {
  const rgba = Buffer.alloc(W * H * 4);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = (y * W + x) * 4;
      const [r, g, b, a] = fn(x, y);
      rgba[i] = r;
      rgba[i + 1] = g;
      rgba[i + 2] = b;
      rgba[i + 3] = a;
    }
  }
  return rgba;
}

function noise(x, y, seed = 0) {
  const h = createHash('sha256').update(`${seed}:${x}:${y}`).digest();
  return h[0] / 255;
}

function albedoSteel(tone) {
  return fill((x, y) => {
    const n = noise(x, y, tone) * 0.08;
    const base = tone === 0 ? 0.18 : tone === 1 ? 0.22 : tone === 2 ? 0.2 : 0.24;
    const v = Math.floor((base + n) * 255);
    return [v, v + 4, v + 8, 255];
  });
}

function monoMap(base, spread) {
  return fill((x, y) => {
    const n = noise(x, y, base) * spread;
    const v = Math.floor(Math.min(255, Math.max(0, (base + n) * 255)));
    return [v, v, v, 255];
  });
}

function normalMap() {
  return fill((x, y) => {
    const bump = (noise(x, y, 99) - 0.5) * 0.15;
    const r = Math.floor((0.5 + bump) * 255);
    const g = Math.floor((0.5 + bump * 0.7) * 255);
    return [r, g, 255, 255];
  });
}

function wearMasks() {
  return fill((x, y) => {
    const ny = y / H;
    const r = ny > 0.35 && ny < 0.55 ? 220 : 40;
    const g = noise(x, y, 7) > 0.92 ? 200 : 30;
    const b = x < 8 || x > W - 9 || y < 6 || y > H - 7 ? 210 : 25;
    return [r, g, b, 255];
  });
}

function signageAtlas() {
  return fill((x, y) => {
    const band = Math.floor(y / (H / 12));
    const hues = [
      [239, 83, 80],
      [121, 134, 203],
      [255, 183, 77],
      [77, 208, 225],
      [206, 147, 216],
      [129, 199, 132],
      [255, 138, 101],
      [128, 203, 196],
      [92, 124, 250],
      [161, 136, 127],
      [139, 148, 158],
      [105, 240, 174],
    ];
    const [cr, cg, cb] = hues[band % hues.length];
    const stripe = x % 32 < 16 ? 1 : 0.85;
    return [Math.floor(cr * stripe), Math.floor(cg * stripe), Math.floor(cb * stripe), 255];
  });
}

mkdirSync(OUT, { recursive: true });

const sets = [
  ['p1_hull_steel_trim', 0],
  ['p1_deck_plate', 1],
  ['p1_wall_panel', 2],
  ['p1_ceiling_panel', 3],
];

for (const [prefix, tone] of sets) {
  writePng(join(OUT, `${prefix}_albedo.png`), albedoSteel(tone));
  writePng(join(OUT, `${prefix}_metal.png`), monoMap(0.72, 0.12));
  writePng(join(OUT, `${prefix}_rough.png`), monoMap(0.48, 0.18));
  writePng(join(OUT, `${prefix}_normal.png`), normalMap());
}

writePng(join(OUT, 'p1_wear_masks.png'), wearMasks());
writePng(join(OUT, 'p1_section_signage_atlas.png'), signageAtlas());

console.log(`Wrote P1 textures to ${OUT}`);

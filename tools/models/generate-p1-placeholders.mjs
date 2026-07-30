#!/usr/bin/env node
/**
 * Minimal placeholder GLBs for Stage 3 when Kimi hero assets are not yet committed.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, '../../assets/models');
mkdirSync(OUT, { recursive: true });

const BIN_LEN = 96;

function packGlb(gltf, binLen = 0) {
  const json = Buffer.from(JSON.stringify(gltf), 'utf8');
  const jsonPad = (4 - (json.length % 4)) % 4;
  const jsonChunk = Buffer.concat([json, Buffer.alloc(jsonPad, 0x20)]);
  const bin = binLen > 0 ? Buffer.alloc(binLen) : null;
  const binPad = bin ? (4 - (bin.length % 4)) % 4 : 0;
  const binChunk = bin ? Buffer.concat([bin, Buffer.alloc(binPad)]) : null;
  let totalLength = 12 + 8 + jsonChunk.length;
  if (binChunk) totalLength += 8 + binChunk.length;
  const header = Buffer.alloc(12);
  header.writeUInt32LE(0x46546c67, 0);
  header.writeUInt32LE(2, 4);
  header.writeUInt32LE(totalLength, 8);
  const jsonHeader = Buffer.alloc(8);
  jsonHeader.writeUInt32LE(jsonChunk.length, 0);
  jsonHeader.writeUInt32LE(0x4e4f534a, 4);
  const parts = [header, jsonHeader, jsonChunk];
  if (binChunk) {
    const binHeader = Buffer.alloc(8);
    binHeader.writeUInt32LE(binChunk.length, 0);
    binHeader.writeUInt32LE(0x004e4942, 4);
    parts.push(binHeader, binChunk);
  }
  return Buffer.concat(parts);
}

function capsuleGlb(rootName) {
  const gltf = {
    asset: { version: '2.0', generator: 'nemesis-p1-placeholder' },
    scene: 0,
    scenes: [{ nodes: [0] }],
    nodes: [{ name: rootName, mesh: 0 }],
    meshes: [{ name: 'body', primitives: [{ attributes: { POSITION: 0 }, mode: 4 }] }],
    accessors: [
      {
        bufferView: 0,
        componentType: 5126,
        count: 8,
        type: 'VEC3',
        max: [0.4, 1.6, 0.4],
        min: [-0.4, 0, -0.4],
      },
    ],
    bufferViews: [{ buffer: 0, byteLength: BIN_LEN }],
    buffers: [{ byteLength: BIN_LEN }],
  };
  return packGlb(gltf, BIN_LEN);
}

function rifleGlb() {
  const gltf = {
    asset: { version: '2.0', generator: 'nemesis-p1-placeholder' },
    scene: 0,
    scenes: [{ nodes: [0] }],
    nodes: [
      { name: 'p1_rifle', children: [1, 2] },
      { mesh: 0, name: 'barrel' },
      { name: 'muzzle', translation: [0, 0.85, 0.45] },
    ],
    meshes: [{ primitives: [{ attributes: { POSITION: 0 }, mode: 4 }] }],
    accessors: [
      {
        bufferView: 0,
        componentType: 5126,
        count: 8,
        type: 'VEC3',
        max: [0.05, 0.05, 0.25],
        min: [-0.05, -0.05, -0.25],
      },
    ],
    bufferViews: [{ buffer: 0, byteLength: BIN_LEN }],
    buffers: [{ byteLength: BIN_LEN }],
  };
  return packGlb(gltf, BIN_LEN);
}

function emptyGlb(name) {
  const gltf = {
    asset: { version: '2.0', generator: 'nemesis-p1-placeholder' },
    scene: 0,
    scenes: [{ nodes: [0] }],
    nodes: [{ name }],
  };
  return packGlb(gltf, 0);
}

writeFileSync(join(OUT, 'p1_player_boarder.glb'), capsuleGlb('p1_player_boarder'));
writeFileSync(join(OUT, 'p1_security_crew.glb'), capsuleGlb('p1_security_crew'));
writeFileSync(join(OUT, 'p1_rifle.glb'), rifleGlb());
writeFileSync(join(OUT, 'p1_corridor_light_fixture.glb'), emptyGlb('p1_corridor_light_fixture'));
writeFileSync(join(OUT, 'p1_amber_beacon.glb'), emptyGlb('p1_amber_beacon'));

console.log(`Wrote placeholder GLBs to ${OUT}`);

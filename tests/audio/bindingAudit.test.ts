import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { ALL_SHIPPED_CUE_IDS } from '../../src/audio/cueIds.js';

describe('audio binding audit (G8)', () => {
  it('assets/audio ogg set matches shipped cue ids', () => {
    const dir = path.resolve('assets/audio');
    const oggs = readdirSync(dir)
      .filter((f) => f.endsWith('.ogg'))
      .map((f) => f.replace(/\.ogg$/, ''))
      .sort();
    expect([...ALL_SHIPPED_CUE_IDS].sort()).toEqual(oggs.sort());
  });

  it('src/audio has no forbidden telegraph paths', () => {
    const root = path.resolve('src/audio');
    const files = readdirSync(root).filter((f) => f.endsWith('.ts'));
    const blob = files.map((f) => readFileSync(path.join(root, f), 'utf8')).join('\n');
    for (const forbidden of ['windup', 'klaxon', 'music', 'ship-pa']) {
      expect(blob.toLowerCase()).not.toContain(forbidden);
    }
    expect(blob.toLowerCase()).not.toMatch(/\breload\b/);
  });
});

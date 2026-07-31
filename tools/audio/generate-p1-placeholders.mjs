#!/usr/bin/env node
/**
 * License-clean procedural placeholders (CC0 — project-generated sine bursts).
 * Replace with authored SFX before Gate 2; filenames match design pack prereq table.
 */
import { execSync } from 'node:child_process';
import { mkdirSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const outDir = path.join(root, 'assets/audio');
mkdirSync(outDir, { recursive: true });

function tone(name, freq, durationSec) {
  const out = path.join(outDir, `${name}.ogg`);
  if (existsSync(out)) return;
  execSync(
    `ffmpeg -y -hide_banner -loglevel error -f lavfi -i "sine=frequency=${freq}:duration=${durationSec}" -c:a libvorbis -q:a 4 "${out}"`,
    { stdio: 'inherit' },
  );
}

for (let i = 1; i <= 3; i++) tone(`p1_sfx_rifle_fire_0${i}`, 180 + i * 20, 0.08);
for (let i = 1; i <= 3; i++) tone(`p1_sfx_sidearm_fire_0${i}`, 320 + i * 15, 0.06);
for (let i = 1; i <= 3; i++) tone(`p1_sfx_impact_wall_0${i}`, 90 + i * 10, 0.05);
for (let i = 1; i <= 2; i++) tone(`p1_sfx_impact_actor_0${i}`, 140 + i * 12, 0.05);
for (let i = 1; i <= 4; i++) tone(`p1_sfx_footstep_0${i}`, 60 + i * 8, 0.04);
tone('p1_sfx_ui_focus_01', 880, 0.03);
tone('p1_sfx_ui_confirm_01', 660, 0.05);
tone('p1_sfx_ui_score_appear_01', 440, 0.12);
tone('p1_bed_ship_calm_loop', 55, 8);
tone('p1_bed_ship_alert_loop', 110, 8);

console.log('Wrote placeholder OGG files to assets/audio/');

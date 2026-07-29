import { boot } from './app/boot.js';

const canvas = document.getElementById('game-canvas');
const fps = document.getElementById('fps-overlay');

if (!(canvas instanceof HTMLCanvasElement) || !(fps instanceof HTMLElement)) {
  throw new Error('Missing #game-canvas or #fps-overlay');
}

boot(canvas, fps).catch((err) => {
  console.error('[nemesis] boot failed', err);
});

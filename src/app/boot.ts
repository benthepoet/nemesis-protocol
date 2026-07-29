import { DEFAULT_PIXEL_RATIO_CAP } from '../config.js';
import { CommandBus } from '../input/commandBus.js';
import { GamepadDevice } from '../input/gamepad.js';
import { KeyboardMouseDevice } from '../input/keyboardMouse.js';
import { createWorld } from '../sim/world.js';
import { createFpsOverlay } from '../render/fpsOverlay.js';
import { createPlaceholderScene } from '../render/createPlaceholderScene.js';
import { createRenderer } from '../render/createRenderer.js';
import { startFrameLoop } from '../render/frameLoop.js';

export async function boot(canvas: HTMLCanvasElement, fpsElement: HTMLElement): Promise<() => void> {
  const world = createWorld();
  const kbm = new KeyboardMouseDevice();
  const gamepad = new GamepadDevice();
  const devices = [kbm, gamepad];
  const bus = new CommandBus();

  const appRenderer = await createRenderer(canvas);
  const { scene, camera } = createPlaceholderScene();
  const fpsOverlay = createFpsOverlay(fpsElement);

  const resize = () => {
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, DEFAULT_PIXEL_RATIO_CAP);
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    appRenderer.setSize(canvas.width, canvas.height);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  };
  resize();
  window.addEventListener('resize', resize);

  const stopLoop = startFrameLoop({
    world,
    bus,
    devices,
    scene,
    camera,
    appRenderer,
    fpsOverlay,
  });

  return () => {
    stopLoop();
    window.removeEventListener('resize', resize);
    kbm.dispose();
    gamepad.dispose();
    appRenderer.dispose();
  };
}

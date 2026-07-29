import { DEFAULT_PIXEL_RATIO_CAP } from '../config.js';
import { loadDeck03 } from '../deck/loadDeck.js';
import { spawnDeckEntities } from '../deck/spawnDeckEntities.js';
import { validateDeckGraph } from '../deck/validate.js';
import { CommandBus } from '../input/commandBus.js';
import { GamepadDevice } from '../input/gamepad.js';
import { KeyboardMouseDevice } from '../input/keyboardMouse.js';
import { createWorld } from '../sim/world.js';
import { createDeckScene } from '../render/createDeckScene.js';
import { createDebugFlyCamera, isDebugFlyCameraEnabled } from '../render/debugFlyCamera.js';
import { createFpsOverlay } from '../render/fpsOverlay.js';
import { createRenderer } from '../render/createRenderer.js';
import { startFrameLoop } from '../render/frameLoop.js';

export async function boot(canvas: HTMLCanvasElement, fpsElement: HTMLElement): Promise<() => void> {
  const graph = loadDeck03();
  const report = validateDeckGraph(graph);
  if (!report.ok) {
    throw new Error(`deck validation failed: ${report.issues.map((i) => i.code).join(', ')}`);
  }

  const world = createWorld();
  spawnDeckEntities(world, graph);

  const kbm = new KeyboardMouseDevice();
  const gamepad = new GamepadDevice();
  const devices = [kbm, gamepad];
  const bus = new CommandBus();

  const appRenderer = await createRenderer(canvas);
  const deckScene = createDeckScene(graph);
  let camera = deckScene.camera;
  let onFrame: ((dt: number) => void) | undefined;
  let flyDispose: (() => void) | undefined;

  if (isDebugFlyCameraEnabled()) {
    const fly = createDebugFlyCamera(canvas);
    camera = fly.camera;
    onFrame = (dt) => fly.update(dt);
    flyDispose = fly.dispose;
  }

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
    scene: deckScene.scene,
    camera,
    appRenderer,
    fpsOverlay,
    onFrame,
  });

  return () => {
    stopLoop();
    flyDispose?.();
    window.removeEventListener('resize', resize);
    kbm.dispose();
    gamepad.dispose();
    appRenderer.dispose();
  };
}

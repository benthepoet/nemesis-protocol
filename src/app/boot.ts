import { DEFAULT_PIXEL_RATIO_CAP } from '../config.js';
import { spawnStandIns } from '../combat/spawnStandIns.js';
import { buildCollisionWorld } from '../deck/collision.js';
import { loadDeck03 } from '../deck/loadDeck.js';
import { spawnDeckEntities } from '../deck/spawnDeckEntities.js';
import { validateDeckGraph } from '../deck/validate.js';
import { CommandBus } from '../input/commandBus.js';
import { GamepadDevice } from '../input/gamepad.js';
import { computeMouseAimAxis, KeyboardMouseDevice } from '../input/keyboardMouse.js';
import { spawnPlayer } from '../player/spawnPlayer.js';
import { createWorld, getEntity } from '../sim/world.js';
import { updateCeilingCutaway, type CutawayState } from '../render/ceilingCutaway.js';
import { createCombatDevReadout } from '../render/combatDevReadout.js';
import { createCombatVfx } from '../render/combatVfx.js';
import { createCombatTelegraphs } from '../render/combatTelegraphs.js';
import { createDeckScene } from '../render/createDeckScene.js';
import { createDebugFlyCamera, isDebugFlyCameraEnabled } from '../render/debugFlyCamera.js';
import { createFollowCamera } from '../render/createFollowCamera.js';
import { createPlayerMesh, syncPlayerMeshPose } from '../render/createPlayerMesh.js';
import { createStandInMesh, syncStandInMeshPose } from '../render/createStandInMesh.js';
import { createFpsOverlay } from '../render/fpsOverlay.js';
import { createRenderer } from '../render/createRenderer.js';
import { startFrameLoop } from '../render/frameLoop.js';
import type { EntityId } from '../sim/types.js';
import type * as THREE from 'three';

export async function boot(canvas: HTMLCanvasElement, fpsElement: HTMLElement): Promise<() => void> {
  const graph = loadDeck03();
  const report = validateDeckGraph(graph);
  if (!report.ok) {
    throw new Error(`deck validation failed: ${report.issues.map((i) => i.code).join(', ')}`);
  }

  const collisionWorld = buildCollisionWorld(graph);
  const world = createWorld();
  spawnDeckEntities(world, graph);
  spawnPlayer(world, graph);
  spawnStandIns(world, graph);

  const kbm = new KeyboardMouseDevice();
  const gamepad = new GamepadDevice();
  const devices = [kbm, gamepad];
  const bus = new CommandBus();

  const appRenderer = await createRenderer(canvas);
  const deckScene = createDeckScene(graph);
  const playerMesh = createPlayerMesh();
  deckScene.scene.add(playerMesh);

  const standInMeshes = new Map<EntityId, THREE.Group>();
  for (const id of world.meta.standInIds) {
    const mesh = createStandInMesh();
    deckScene.scene.add(mesh);
    standInMeshes.set(id, mesh);
  }

  const combatVfx = createCombatVfx(deckScene.scene);
  const telegraphs = createCombatTelegraphs(deckScene.scene);
  const vfxRegistry = combatVfx as ReturnType<typeof createCombatVfx> & {
    registerActorMesh(id: string, mesh: THREE.Object3D): void;
  };
  vfxRegistry.registerActorMesh(String(world.meta.playerId), playerMesh);
  for (const [id, mesh] of standInMeshes) {
    vfxRegistry.registerActorMesh(String(id), mesh);
  }

  const combatReadout = createCombatDevReadout(document.body);

  let camera = deckScene.camera;
  let onFrame: ((dt: number) => void) | undefined;
  let onBeforeSim: (() => void) | undefined;
  let flyDispose: (() => void) | undefined;
  const cutawayState: CutawayState = { lastRoomId: null };

  const debugFly = isDebugFlyCameraEnabled();
  let follow: ReturnType<typeof createFollowCamera> | undefined;

  if (debugFly) {
    const fly = createDebugFlyCamera(canvas);
    camera = fly.camera;
    onFrame = (dt) => {
      fly.update(dt);
      const playerId = world.meta.playerId;
      const entity = playerId !== null ? getEntity(world, playerId) : undefined;
      if (entity) syncPlayerMeshPose(playerMesh, entity);
      for (const [id, mesh] of standInMeshes) {
        const e = getEntity(world, id);
        if (e) syncStandInMeshPose(mesh, e);
      }
      telegraphs.sync(world, collisionWorld);
      combatVfx.update(dt);
      combatReadout?.update(world);
    };
    flyDispose = fly.dispose;
  } else {
    follow = createFollowCamera();
    camera = follow.camera;

    onBeforeSim = () => {
      const playerId = world.meta.playerId;
      const entity = playerId !== null ? getEntity(world, playerId) : undefined;
      if (!entity || !follow) return;
      kbm.setPlayerPositionForAim(entity.x, entity.z);
      const mouse = kbm.getMouseClientPosition();
      kbm.setAimSampler((px, pz) =>
        computeMouseAimAxis(px, pz, follow!.camera, canvas, mouse.clientX, mouse.clientY),
      );
    };

    onFrame = (dt) => {
      const playerId = world.meta.playerId;
      const entity = playerId !== null ? getEntity(world, playerId) : undefined;
      if (!entity || !follow) return;
      follow.update(dt, entity);
      syncPlayerMeshPose(playerMesh, entity);
      for (const [id, mesh] of standInMeshes) {
        const e = getEntity(world, id);
        if (e) syncStandInMeshPose(mesh, e);
      }
      updateCeilingCutaway(deckScene.roomGroups, graph, entity.x, entity.z, cutawayState);
      telegraphs.sync(world, collisionWorld);
      combatVfx.update(dt);
      combatReadout?.update(world);
    };
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
    collisionWorld,
    graph,
    scene: deckScene.scene,
    camera,
    appRenderer,
    fpsOverlay,
    onFrame,
    onBeforeSim,
    onCombatEvents: (events) => combatVfx.push(events),
  });

  return () => {
    stopLoop();
    flyDispose?.();
    telegraphs.dispose();
    combatVfx.dispose();
    combatReadout?.dispose();
    window.removeEventListener('resize', resize);
    kbm.dispose();
    gamepad.dispose();
    appRenderer.dispose();
  };
}

import { DEFAULT_PIXEL_RATIO_CAP } from '../config.js';
import { buildCollisionWorld } from '../deck/collision.js';
import { loadDeck03 } from '../deck/loadDeck.js';
import { validateDeckGraph } from '../deck/validate.js';
import { createMissionWorld } from '../mission/createMissionWorld.js';
import type { CollisionWorldRef } from '../mission/integrateMissionShell.js';
import { CommandBus } from '../input/commandBus.js';
import { GamepadDevice } from '../input/gamepad.js';
import { computeMouseAimAxis, KeyboardMouseDevice } from '../input/keyboardMouse.js';
import { getEntity } from '../sim/world.js';
import { updateCeilingCutaway, type CutawayState } from '../render/ceilingCutaway.js';
import { createCombatDevReadout } from '../render/combatDevReadout.js';
import { createCombatVfx } from '../render/combatVfx.js';
import { createCombatTelegraphs } from '../render/combatTelegraphs.js';
import { createDeckLighting } from '../render/createDeckLighting.js';
import { createDeckScene } from '../render/createDeckScene.js';
import { preloadDeckMaterials } from '../render/deckMaterials.js';
import { createDebugFlyCamera, isDebugFlyCameraEnabled } from '../render/debugFlyCamera.js';
import { createFollowCamera } from '../render/createFollowCamera.js';
import { createHud } from '../render/hud/createHud.js';
import { createMissionShellUi } from '../render/missionShellUi.js';
import { createObjectiveBanner } from '../render/objectiveBanner.js';
import { createObjectiveBeacon } from '../render/objectiveBeacon.js';
import { createPlayerMesh, syncPlayerMeshPose } from '../render/createPlayerMesh.js';
import { createStandInMesh, syncStandInMeshPose } from '../render/createStandInMesh.js';
import { getHeroFixtures, preloadHeroAssets } from '../render/assets/preloadHeroAssets.js';
import { attachSceneEnvironment } from '../render/sceneEnvironment.js';
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

  const heroTemplates = await preloadHeroAssets();
  const deckMaterials = await preloadDeckMaterials();

  const collisionRef: CollisionWorldRef = { current: buildCollisionWorld(graph) };
  const world = createMissionWorld(graph);

  const kbm = new KeyboardMouseDevice();
  const gamepad = new GamepadDevice();
  const devices = [kbm, gamepad];
  const bus = new CommandBus();

  const appRenderer = await createRenderer(canvas);
  const deckScene = createDeckScene(graph, deckMaterials);
  const sceneEnv = attachSceneEnvironment(deckScene.scene, appRenderer);
  const deckLighting = createDeckLighting(deckScene.scene, graph, getHeroFixtures(heroTemplates));

  const playerMesh = createPlayerMesh();
  playerMesh.visible = false;
  deckScene.scene.add(playerMesh);

  const standInMeshes = new Map<EntityId, THREE.Group>();
  for (const id of world.meta.crewIds) {
    const mesh = createStandInMesh();
    deckScene.scene.add(mesh);
    standInMeshes.set(id, mesh);
  }

  const combatVfx = createCombatVfx(deckScene.scene);
  const telegraphs = createCombatTelegraphs(deckScene.scene);
  const vfxRegistry = combatVfx as ReturnType<typeof createCombatVfx> & {
    registerActorMesh(id: string, mesh: THREE.Object3D): void;
  };
  for (const [id, mesh] of standInMeshes) {
    vfxRegistry.registerActorMesh(String(id), mesh);
  }

  const combatReadout = createCombatDevReadout(document.body);
  const hud = createHud(document.body);
  const missionShellUi = createMissionShellUi(document.body);
  const objectiveBanner = createObjectiveBanner(document.body);
  const objectiveBeacon = createObjectiveBeacon(deckScene.scene, graph);

  let camera = deckScene.camera;
  let onFrame: ((dt: number) => void) | undefined;
  let onBeforeSim: (() => void) | undefined;
  let flyDispose: (() => void) | undefined;
  const cutawayState: CutawayState = { lastRoomId: null };

  const debugFly = isDebugFlyCameraEnabled();
  let follow: ReturnType<typeof createFollowCamera> | undefined;

  const syncPresentation = () => {
    const playerId = world.meta.playerId;
    const entity = playerId !== null ? getEntity(world, playerId) : undefined;
    if (entity) {
      playerMesh.visible = true;
      syncPlayerMeshPose(playerMesh, entity);
      if (playerId !== null) {
        vfxRegistry.registerActorMesh(String(playerId), playerMesh);
      }
    } else {
      playerMesh.visible = false;
    }
    for (const [id, mesh] of standInMeshes) {
      const e = getEntity(world, id);
      if (e) syncStandInMeshPose(mesh, e);
    }
    telegraphs.sync(world, collisionRef.current);
    combatReadout?.update(world);
    hud.update(world);
    missionShellUi.update(world);
    objectiveBeacon.sync(world);
    objectiveBanner.sync(world, world.tick);
  };

  if (debugFly) {
    const fly = createDebugFlyCamera(canvas);
    camera = fly.camera;
    onFrame = (dt) => {
      fly.update(dt);
      syncPresentation();
      deckLighting.update(dt, world.meta.alarmLevel as 0 | 1);
      combatVfx.update(dt);
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
      if (entity && follow) {
        follow.update(dt, entity);
        updateCeilingCutaway(deckScene.roomGroups, graph, entity.x, entity.z, cutawayState);
      }
      syncPresentation();
      deckLighting.update(dt, world.meta.alarmLevel as 0 | 1);
      combatVfx.update(dt);
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

  if (import.meta.env.DEV) {
    document.body.dataset.nemesisHeroTune = '3';
  }

  const stopLoop = startFrameLoop({
    world,
    bus,
    devices,
    collisionRef,
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
    sceneEnv.dispose();
    deckLighting.dispose();
    deckScene.disposeMaterials();
    deckMaterials.dispose();
    telegraphs.dispose();
    combatVfx.dispose();
    combatReadout?.dispose();
    hud.dispose();
    missionShellUi.dispose();
    objectiveBanner.dispose();
    objectiveBeacon.dispose();
    window.removeEventListener('resize', resize);
    kbm.dispose();
    gamepad.dispose();
    appRenderer.dispose();
  };
}

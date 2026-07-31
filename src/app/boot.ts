import { DEFAULT_PIXEL_RATIO_CAP } from '../config.js';
import {
  getHeroMaterialMode,
  heroActorShadersExceedTextureUnitLimit,
  heroShadersExceedTextureUnitLimit,
  initHeroMaterialMode,
  resolveHeroMaterialMode,
  setHeroMaterialModeDevMarker,
} from '../render/heroMaterialMode.js';
import { retuneHeroActorsBasic } from '../render/heroMaterialTune.js';
import { buildCollisionWorld } from '../deck/collision.js';
import { loadDeck03 } from '../deck/loadDeck.js';
import { validateDeckGraph } from '../deck/validate.js';
import { createMissionWorld } from '../mission/createMissionWorld.js';
import type { CollisionWorldRef } from '../mission/integrateMissionShell.js';
import { CommandBus } from '../input/commandBus.js';
import { GamepadDevice } from '../input/gamepad.js';
import { computeMouseAimAxis, KeyboardMouseDevice } from '../input/keyboardMouse.js';
import { getEntity } from '../sim/world.js';
import { updateCeilingCutaway, createCutawayState, type CutawayState } from '../render/ceilingCutaway.js';
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
import { createPlayerMesh, updatePlayerHeroPresentation, disposePlayerHeroPresentation } from '../render/createPlayerMesh.js';
import { createStandInMesh, updateStandInHeroPresentation, disposeStandInHeroPresentation } from '../render/createStandInMesh.js';
import { getHeroFixtures, preloadHeroAssets } from '../render/assets/preloadHeroAssets.js';
import { attachSceneEnvironment } from '../render/sceneEnvironment.js';
import { createFpsOverlay } from '../render/fpsOverlay.js';
import * as THREE from 'three';
import { createRenderer } from '../render/createRenderer.js';
import { startFrameLoop } from '../render/frameLoop.js';
import type { EntityId } from '../sim/types.js';
import { createGameAudio } from '../audio/createGameAudio.js';
import { preloadAudioAssets } from '../audio/preloadAudio.js';

export async function boot(canvas: HTMLCanvasElement, fpsElement: HTMLElement): Promise<() => void> {
  const graph = loadDeck03();
  const report = validateDeckGraph(graph);
  if (!report.ok) {
    throw new Error(`deck validation failed: ${report.issues.map((i) => i.code).join(', ')}`);
  }

  const appRenderer = await createRenderer(canvas);

  let maxTu: number | undefined;
  if (appRenderer.backend === 'webgl2' && appRenderer.renderer instanceof THREE.WebGLRenderer) {
    const gl = appRenderer.renderer.getContext();
    maxTu = gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS) as number;
  }
  initHeroMaterialMode(resolveHeroMaterialMode({ maxTextureImageUnits: maxTu }));

  const heroTemplates = await preloadHeroAssets();
  const deckMaterials = await preloadDeckMaterials();

  const collisionRef: CollisionWorldRef = { current: buildCollisionWorld(graph) };
  const world = createMissionWorld(graph);

  const kbm = new KeyboardMouseDevice();
  const gamepad = new GamepadDevice();
  const devices = [kbm, gamepad];
  const bus = new CommandBus();

  const deckScene = createDeckScene(graph, deckMaterials);
  const sceneEnv = attachSceneEnvironment(deckScene.scene, appRenderer);
  const deckLighting = createDeckLighting(deckScene.scene, graph, getHeroFixtures(heroTemplates));

  const audioContext = new AudioContext();
  const audioBuffers = await preloadAudioAssets(audioContext);
  let activeCamera: THREE.PerspectiveCamera = deckScene.camera;
  const gameAudio = createGameAudio({
    buffers: audioBuffers,
    audioContext,
    getListenerPose: () => {
      activeCamera.updateMatrixWorld(true);
      const pos = new THREE.Vector3();
      const dir = new THREE.Vector3();
      activeCamera.getWorldPosition(pos);
      activeCamera.getWorldDirection(dir);
      return {
        x: pos.x,
        y: pos.y,
        z: pos.z,
        forwardX: dir.x,
        forwardY: dir.y,
        forwardZ: dir.z,
        upX: 0,
        upY: 1,
        upZ: 0,
      };
    },
  });
  const unlockAudioOnce = () => gameAudio.unlock();
  document.addEventListener('pointerdown', unlockAudioOnce, { once: true });
  document.addEventListener('keydown', unlockAudioOnce, { once: true });


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
  const cutawayState: CutawayState = createCutawayState();

  const debugFly = isDebugFlyCameraEnabled();
  let follow: ReturnType<typeof createFollowCamera> | undefined;

  const syncPresentation = (dtSec: number) => {
    const playerId = world.meta.playerId;
    const entity = playerId !== null ? getEntity(world, playerId) : undefined;
    if (entity) {
      playerMesh.visible = true;
      updatePlayerHeroPresentation(playerMesh, entity, world.meta, dtSec);
      if (playerId !== null) {
        vfxRegistry.registerActorMesh(String(playerId), playerMesh);
      }
    } else {
      playerMesh.visible = false;
    }
    for (const [id, mesh] of standInMeshes) {
      const e = getEntity(world, id);
      const ai = world.crewAi.get(id);
      if (e) updateStandInHeroPresentation(mesh, e, ai, dtSec);
    }
    telegraphs.sync(world, collisionRef.current);
    combatReadout?.update(world);
    hud.update(world);
    missionShellUi.update(world);
    objectiveBeacon.sync(world);
    objectiveBanner.sync(world, world.tick);
    gameAudio.update(dtSec, world);
  };

  if (debugFly) {
    const fly = createDebugFlyCamera(canvas);
    camera = fly.camera;
    activeCamera = camera;
    onFrame = (dt) => {
      fly.update(dt);
      syncPresentation(dt);
      deckLighting.update(dt, world.meta.alarmLevel as 0 | 1);
      combatVfx.update(dt);
    };
    flyDispose = fly.dispose;
  } else {
    follow = createFollowCamera();
    camera = follow.camera;
    activeCamera = camera;

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
        updateCeilingCutaway(
          deckScene.roomGroups,
          graph,
          entity.x,
          entity.z,
          cutawayState,
          follow.camera,
          dt,
          deckScene.hullEnvelope?.getObjectByName('hull-interstitial:ceiling') ?? null,
        );
      }
      syncPresentation(dt);
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
    setHeroMaterialModeDevMarker(getHeroMaterialMode());
  }

  const heroActorRoots: { root: THREE.Object3D; role: 'player' | 'crew' }[] = [
    { root: playerMesh, role: 'player' },
    ...[...standInMeshes.values()].map((root) => ({ root, role: 'crew' as const })),
  ];

  if (
    appRenderer.backend === 'webgl2' &&
    getHeroMaterialMode() === 'pbr' &&
    appRenderer.renderer instanceof THREE.WebGLRenderer
  ) {
    const tuExceeded =
      heroActorShadersExceedTextureUnitLimit(
        appRenderer.renderer,
        deckScene.scene,
        camera,
        heroActorRoots.map((a) => a.root),
      ) ||
      heroShadersExceedTextureUnitLimit(appRenderer.renderer, deckScene.scene, camera);
    if (tuExceeded) {
      console.warn(
        '[nemesis] hero PBR exceeds texture units with full deck — downgrading heroes to unlit basic palette.',
      );
      retuneHeroActorsBasic(heroActorRoots);
      setHeroMaterialModeDevMarker('basic');
    }
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
    onCombatEvents: (events) => {
      combatVfx.push(events);
      gameAudio.pushCombatEvents(events, world);
    },
  });

  return () => {
    stopLoop();
    flyDispose?.();
    disposePlayerHeroPresentation(playerMesh);
    for (const mesh of standInMeshes.values()) {
      disposeStandInHeroPresentation(mesh);
    }
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
    document.removeEventListener('pointerdown', unlockAudioOnce);
    document.removeEventListener('keydown', unlockAudioOnce);
    gameAudio.dispose();
    window.removeEventListener('resize', resize);
    kbm.dispose();
    gamepad.dispose();
    appRenderer.dispose();
  };
}

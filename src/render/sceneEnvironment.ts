import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import type { AppRenderer } from './createRenderer.js';

/** Neutral IBL so factor-only hero GLBs read with hull-steel color + emissive accents (G2/G3). */
export function attachSceneEnvironment(
  scene: THREE.Scene,
  appRenderer: AppRenderer,
): { dispose(): void } {
  const r = appRenderer.renderer;
  if (!(r instanceof THREE.WebGLRenderer)) {
    return { dispose() {} };
  }

  const pmrem = new THREE.PMREMGenerator(r);
  pmrem.compileEquirectangularShader();
  const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environment = envTex;
  scene.environmentIntensity = 1.0;

  return {
    dispose() {
      envTex.dispose();
      pmrem.dispose();
    },
  };
}

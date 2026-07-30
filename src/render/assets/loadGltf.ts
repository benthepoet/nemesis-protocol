import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

const loader = new GLTFLoader();

function sceneRoot(gltf: { scene: THREE.Group }): THREE.Group {
  const root = gltf.scene;
  root.updateMatrixWorld(true);
  return root;
}

/** Load a GLB/glTF and return a cloneable Group (scene root). */
export function loadGltf(url: string): Promise<THREE.Group> {
  const resolved =
    import.meta.env.VITEST && url.startsWith('/') ? `http://vitest.local${url}` : url;
  return new Promise((resolve, reject) => {
    loader.load(
      resolved,
      (gltf) => resolve(sceneRoot(gltf)),
      undefined,
      (err) => {
        const message = err instanceof Error ? err.message : String(err);
        reject(new Error(`GLTF load failed for ${url}: ${message}`));
      },
    );
  });
}

/** Drop optional maps so fragment shaders stay under MAX_TEXTURE_IMAGE_UNITS with shadows. */
export function stripOptionalMaterialMaps(root: THREE.Object3D): void {
  root.traverse((obj) => {
    if (!(obj instanceof THREE.Mesh)) return;
    const materials = Array.isArray(obj.material) ? obj.material : [obj.material];
    for (const material of materials) {
      if (
        material instanceof THREE.MeshStandardMaterial ||
        material instanceof THREE.MeshPhysicalMaterial
      ) {
        material.aoMap = null;
        material.lightMap = null;
        material.bumpMap = null;
        material.displacementMap = null;
        material.alphaMap = null;
        material.needsUpdate = true;
      }
    }
  });
}

/** Deep-clone a loaded template for per-instance meshes (shared geometry OK). */
export function cloneGltfTemplate(template: THREE.Group): THREE.Group {
  return template.clone(true);
}

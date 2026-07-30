import * as THREE from 'three';
import {
  P1_CEILING_PANEL_ALBEDO,
  P1_CEILING_PANEL_METAL,
  P1_CEILING_PANEL_NORMAL,
  P1_CEILING_PANEL_ROUGH,
  P1_DECK_PLATE_ALBEDO,
  P1_DECK_PLATE_METAL,
  P1_DECK_PLATE_NORMAL,
  P1_DECK_PLATE_ROUGH,
  P1_HULL_STEEL_TRIM_ALBEDO,
  P1_HULL_STEEL_TRIM_METAL,
  P1_HULL_STEEL_TRIM_NORMAL,
  P1_HULL_STEEL_TRIM_ROUGH,
  P1_SECTION_SIGNAGE_ATLAS,
  P1_WALL_PANEL_ALBEDO,
  P1_WALL_PANEL_METAL,
  P1_WALL_PANEL_NORMAL,
  P1_WALL_PANEL_ROUGH,
  P1_WEAR_MASKS,
} from './assets/urls.js';

export interface DeckMaterialSet {
  floor: THREE.MeshStandardMaterial;
  ceiling: THREE.MeshStandardMaterial;
  hullWall: THREE.MeshStandardMaterial;
  partitionWall: THREE.MeshStandardMaterial;
  bulkheadWall: THREE.MeshStandardMaterial;
  hullSteel: THREE.MeshStandardMaterial;
  signageAtlas: THREE.Texture;
  dispose(): void;
}

function loadTexture(loader: THREE.TextureLoader, url: string): Promise<THREE.Texture> {
  const resolved =
    import.meta.env.VITEST && url.startsWith('/') ? `http://vitest.local${url}` : url;
  return new Promise((resolve, reject) => {
    loader.load(
      resolved,
      (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
        tex.repeat.set(2, 2);
        resolve(tex);
      },
      undefined,
      (err) => reject(new Error(`texture load failed ${url}: ${String(err)}`)),
    );
  });
}

async function pbrMaterial(
  loader: THREE.TextureLoader,
  albedo: string,
  metal: string,
  rough: string,
  normal: string,
  wear: THREE.Texture | null,
  tint?: THREE.Color,
): Promise<THREE.MeshStandardMaterial> {
  const [map, metalnessMap, roughnessMap, normalMap] = await Promise.all([
    loadTexture(loader, albedo),
    loadTexture(loader, metal),
    loadTexture(loader, rough),
    loadTexture(loader, normal),
  ]);
  if (wear) {
    roughnessMap.channel = roughnessMap.channel ?? 0;
  }
  const mat = new THREE.MeshStandardMaterial({
    map,
    metalnessMap,
    roughnessMap,
    normalMap,
    metalness: 1,
    roughness: 1,
    color: tint ?? new THREE.Color('#ffffff'),
  });
  return mat;
}

export async function preloadDeckMaterials(): Promise<DeckMaterialSet> {
  const loader = new THREE.TextureLoader();
  const wear = await loadTexture(loader, P1_WEAR_MASKS);
  wear.colorSpace = THREE.NoColorSpace;

  const signageAtlas = await loadTexture(loader, P1_SECTION_SIGNAGE_ATLAS);
  signageAtlas.colorSpace = THREE.SRGBColorSpace;

  const floor = await pbrMaterial(
    loader,
    P1_DECK_PLATE_ALBEDO,
    P1_DECK_PLATE_METAL,
    P1_DECK_PLATE_ROUGH,
    P1_DECK_PLATE_NORMAL,
    wear,
  );
  const ceiling = await pbrMaterial(
    loader,
    P1_CEILING_PANEL_ALBEDO,
    P1_CEILING_PANEL_METAL,
    P1_CEILING_PANEL_ROUGH,
    P1_CEILING_PANEL_NORMAL,
    wear,
  );
  const hullSteel = await pbrMaterial(
    loader,
    P1_HULL_STEEL_TRIM_ALBEDO,
    P1_HULL_STEEL_TRIM_METAL,
    P1_HULL_STEEL_TRIM_ROUGH,
    P1_HULL_STEEL_TRIM_NORMAL,
    wear,
  );
  const partitionWall = await pbrMaterial(
    loader,
    P1_WALL_PANEL_ALBEDO,
    P1_WALL_PANEL_METAL,
    P1_WALL_PANEL_ROUGH,
    P1_WALL_PANEL_NORMAL,
    wear,
  );
  const bulkheadWall = await pbrMaterial(
    loader,
    P1_WALL_PANEL_ALBEDO,
    P1_WALL_PANEL_METAL,
    P1_WALL_PANEL_ROUGH,
    P1_WALL_PANEL_NORMAL,
    wear,
  );
  const hullWall = await pbrMaterial(
    loader,
    P1_WALL_PANEL_ALBEDO,
    P1_WALL_PANEL_METAL,
    P1_WALL_PANEL_ROUGH,
    P1_WALL_PANEL_NORMAL,
    wear,
    new THREE.Color('#c5d0dc'),
  );

  return {
    floor,
    ceiling,
    hullWall,
    partitionWall,
    bulkheadWall,
    hullSteel,
    signageAtlas,
    dispose() {
      floor.dispose();
      ceiling.dispose();
      hullWall.dispose();
      partitionWall.dispose();
      bulkheadWall.dispose();
      hullSteel.dispose();
      wear.dispose();
      signageAtlas.dispose();
    },
  };
}

/** Flat fallback when textures are not preloaded (unit tests / cutaway). */
export function createFallbackDeckMaterials(): DeckMaterialSet {
  const mk = (hex: string) =>
    new THREE.MeshStandardMaterial({ color: hex, metalness: 0.65, roughness: 0.45 });
  const floor = mk('#1f2a36');
  const ceiling = floor.clone();
  const hullWall = mk('#243040');
  const partitionWall = mk('#2c3947');
  const bulkheadWall = mk('#2c3947');
  const hullSteel = mk('#1f2a36');
  const signageAtlas = new THREE.Texture();
  return {
    floor,
    ceiling,
    hullWall,
    partitionWall,
    bulkheadWall,
    hullSteel,
    signageAtlas,
    dispose() {
      floor.dispose();
      ceiling.dispose();
      hullWall.dispose();
      partitionWall.dispose();
      bulkheadWall.dispose();
      hullSteel.dispose();
      signageAtlas.dispose();
    },
  };
}

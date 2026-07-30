import * as THREE from 'three';

export interface RenderSurface {
  setSize(width: number, height: number, updateStyle?: boolean): void;
  render(scene: THREE.Scene, camera: THREE.Camera): void;
  dispose(): void;
}

export interface AppRenderer {
  renderer: RenderSurface;
  backend: 'webgl2' | 'webgpu';
  setSize(width: number, height: number): void;
  render(scene: THREE.Scene, camera: THREE.Camera): void;
  dispose(): void;
}

function webGpuRequested(): boolean {
  if (typeof window === 'undefined') return false;
  return new URLSearchParams(window.location.search).get('webgpu') === '1';
}

function applyRendererColorPipeline(renderer: {
  outputColorSpace: unknown;
  toneMapping: unknown;
  toneMappingExposure: number;
}): void {
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
}

export async function createRenderer(canvas: HTMLCanvasElement): Promise<AppRenderer> {
  if (webGpuRequested() && 'gpu' in navigator) {
    try {
      const { WebGPURenderer } = await import('three/webgpu');
      const webgpu = new WebGPURenderer({ canvas, antialias: true });
      await webgpu.init();
      applyRendererColorPipeline(webgpu);
      return wrapRenderer(webgpu as RenderSurface, 'webgpu');
    } catch (err) {
      console.warn('[nemesis] WebGPU init failed; falling back to WebGL2.', err);
    }
  }

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    powerPreference: 'high-performance',
  });
  applyRendererColorPipeline(renderer);
  if (renderer instanceof THREE.WebGLRenderer) {
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  }
  return wrapRenderer(renderer, 'webgl2');
}

function wrapRenderer(renderer: RenderSurface, backend: 'webgl2' | 'webgpu'): AppRenderer {
  return {
    renderer,
    backend,
    setSize(width: number, height: number) {
      renderer.setSize(width, height, false);
    },
    render(scene: THREE.Scene, camera: THREE.Camera) {
      renderer.render(scene, camera);
    },
    dispose() {
      renderer.dispose();
    },
  };
}

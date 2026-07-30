import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const nativeFetch = globalThis.fetch.bind(globalThis);

globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
  const href = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
  const assetPath = href.includes('/assets/') ? href.slice(href.indexOf('/assets/')) : null;
  if (assetPath) {
    const filePath = join(process.cwd(), assetPath.slice(1));
    if (existsSync(filePath)) {
      const body = readFileSync(filePath);
      const type = filePath.endsWith('.glb')
        ? 'model/gltf-binary'
        : filePath.endsWith('.png')
          ? 'image/png'
          : 'application/octet-stream';
      return new Response(body, { status: 200, headers: { 'Content-Type': type } });
    }
  }
  return nativeFetch(input, init);
};

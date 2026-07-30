/** @vitest-environment jsdom */
import { afterEach, describe, expect, it } from 'vitest';
import { resolveHeroMaterialMode, resetHeroMaterialModeForTests } from '../../src/render/heroMaterialMode.js';

describe('heroMaterialMode (R15, T33)', () => {
  afterEach(() => {
    resetHeroMaterialModeForTests();
  });

  it('defaults to pbr when texture units meet budget', () => {
    expect(resolveHeroMaterialMode({ maxTextureImageUnits: 32 })).toBe('pbr');
  });

  it('falls back to basic when TU budget is low', () => {
    expect(resolveHeroMaterialMode({ maxTextureImageUnits: 16 })).toBe('basic');
  });

  it('URL ?heroMaterial=basic overrides default pbr', () => {
    const params = new URLSearchParams('heroMaterial=basic');
    expect(resolveHeroMaterialMode({ searchParams: params, maxTextureImageUnits: 32 })).toBe('basic');
  });
});

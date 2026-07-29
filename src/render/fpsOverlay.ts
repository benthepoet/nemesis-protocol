export function createFpsOverlay(element: HTMLElement): { update(dtSec: number): void } {
  const windowSec = 0.5;
  const samples: number[] = [];
  let elapsed = 0;
  let displayElapsed = 0;

  return {
    update(dtSec: number) {
      if (dtSec > 0) {
        samples.push(1 / dtSec);
        elapsed += dtSec;
        while (elapsed > windowSec && samples.length > 0) {
          elapsed -= windowSec / samples.length;
          samples.shift();
        }
      }
      displayElapsed += dtSec;
      if (displayElapsed >= 0.1) {
        displayElapsed = 0;
        const fps =
          samples.length > 0
            ? Math.round(samples.reduce((a, b) => a + b, 0) / samples.length)
            : 0;
        element.textContent = `FPS ${fps}`;
      }
    },
  };
}

let consoleLogElapsed = 0;

export function maybeLogFps(dtSec: number): void {
  consoleLogElapsed += dtSec;
  if (consoleLogElapsed >= 1) {
    consoleLogElapsed = 0;
    const fps = dtSec > 0 ? Math.round(1 / dtSec) : 0;
    console.log(`[nemesis] fps=${fps}`);
  }
}

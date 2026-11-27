import type { Page } from "@playwright/test";
import { expect } from "../testHelpers";

export function sampleNativeNavigation(
  page: Page,
  destination: string,
  forward: boolean
) {
  return page.evaluate(
    ({ destinationScreen, entering }) =>
      new Promise<
        {
          x: number;
          underlayX: number;
          headerOffset: number | null;
          destinationVisible: boolean;
          dimOpacity: number;
        }[]
      >((resolve, reject) => {
        const frames: {
          x: number;
          underlayX: number;
          headerOffset: number | null;
          destinationVisible: boolean;
          dimOpacity: number;
        }[] = [];
        const deadline = performance.now() + 10000;
        const sample = () => {
          const top = document.querySelector<HTMLElement>(
            '[data-phone-navigation-screen="conversation"]'
          );
          const underlay = document.querySelector<HTMLElement>(
            `[data-phone-navigation-screen="${destinationScreen}"]`
          );
          if (top && underlay) {
            const x = top.getBoundingClientRect().x;
            const header = top.querySelector<HTMLElement>(
              'button[aria-label="Back"], a[aria-label="Back to encrypted messages"]'
            );
            frames.push({
              x,
              underlayX: underlay.getBoundingClientRect().x,
              headerOffset: header
                ? header.getBoundingClientRect().x - x
                : null,
              destinationVisible:
                getComputedStyle(underlay).visibility === "visible" &&
                Number(getComputedStyle(underlay).opacity) > 0,
              dimOpacity: Number(
                getComputedStyle(
                  underlay.querySelector<HTMLElement>(
                    ":scope > [data-phone-navigation-dim]"
                  )!
                ).opacity
              ),
            });
            if (entering && frames.length > 5 && Math.abs(x) < 0.5)
              return resolve(frames);
          } else if (!entering && frames.length > 0) return resolve(frames);
          if (performance.now() > deadline)
            return reject(new Error("Native navigation did not settle"));
          requestAnimationFrame(sample);
        };
        requestAnimationFrame(sample);
      }),
    {
      destinationScreen: destination.slice(destination.lastIndexOf("/") + 1),
      entering: forward,
    }
  );
}

export function expectNativeNavigation(
  frames: Awaited<ReturnType<typeof sampleNativeNavigation>>,
  { headerMayLoad = false }: { readonly headerMayLoad?: boolean } = {}
) {
  const moving = frames.filter((frame) => frame.x > 1 && frame.x < 411);
  expect(moving.length).toBeGreaterThan(0);
  const headerOffset = moving.find(
    (frame) => frame.headerOffset !== null
  )?.headerOffset;
  expect(headerOffset).not.toBeNull();
  expect(headerOffset).not.toBeUndefined();
  for (const frame of moving) {
    expect(frame.destinationVisible).toBe(true);
    expect(frame.dimOpacity).toBeCloseTo((1 - frame.x / 412) * 0.12, 2);
    expect(frame.underlayX).toBeCloseTo((frame.x - 412) / 3, 0);
    // Encrypted entry can resolve its existing loading frame during the spring.
    // Once present, its header must move with the same complete page.
    if (!headerMayLoad || frame.headerOffset !== null)
      expect(frame.headerOffset).toBeCloseTo(headerOffset!, 0);
  }
}

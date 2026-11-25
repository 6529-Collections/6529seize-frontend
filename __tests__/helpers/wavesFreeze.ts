/**
 * Sets NEXT_PUBLIC_WAVES_FREEZE_AT and NEXT_PUBLIC_WAVES_SWITCH_ON_AT for a
 * test. The test file mocks `@/config/env` so `publicEnv` reads them from
 * here:
 *
 * jest.mock("@/config/env", () => {
 *   const actual = jest.requireActual("@/config/env");
 *   return {
 *     ...actual,
 *     get publicEnv() {
 *       return {
 *         ...actual.publicEnv,
 *         ...(globalThis as { __wavesFreeze?: object }).__wavesFreeze,
 *       };
 *     },
 *   };
 * });
 */
export function setWavesFreeze(
  freezeAt: string | undefined,
  switchOnAt: string | undefined
): void {
  (globalThis as { __wavesFreeze?: object }).__wavesFreeze = {
    NEXT_PUBLIC_WAVES_FREEZE_AT: freezeAt,
    NEXT_PUBLIC_WAVES_SWITCH_ON_AT: switchOnAt,
  };
}

export const WAVES_FREEZE_AT = "2026-11-25T00:00:00Z";
export const WAVES_SWITCH_ON_AT = "2026-11-26T00:00:00Z";
export const WAVES_FREEZE_MS = Date.UTC(2026, 10, 25, 0, 0, 0);
export const WAVES_SWITCH_ON_MS = Date.UTC(2026, 10, 26, 0, 0, 0);

/** Sets the production schedule. */
export function setWavesFreezeSchedule(): void {
  setWavesFreeze(WAVES_FREEZE_AT, WAVES_SWITCH_ON_AT);
}

export function clearWavesFreeze(): void {
  setWavesFreeze(undefined, undefined);
}

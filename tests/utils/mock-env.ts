/**
 * Test helpers for safely mocking environment variables.
 *
 * Key points:
 * - We modify **process.env** (source of truth), never the exported `env` object.
 * - After changing process.env, we **reload** the env module so Zod validation re-runs.
 * - On restore, we put process.env back exactly as it was and reload again.
 * - No dependency on deprecated resetEnvCache or Env/EnvKey types.
 */

// Avoid static import of env here to prevent caching the original values.
// We'll load it on-demand after we tweak process.env.

type MockEnvOverrides = Partial<Record<string, string | undefined>>;
export type RestoreEnv = () => void;

const setEnvValue = (key: string, value: string | undefined): void => {
  if (typeof value === "undefined") {
    delete process.env[key];
  } else {
    process.env[key] = String(value);
  }
};

/**
 * Reset module cache and reload the unified env export.
 * Returns the freshly parsed env object.
 */
export const reloadEnv = <T = any>(): T => {
  // Reset Jest's module registry so the next require/import re-executes the module
  jest.resetModules();
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const mod = require("@/config/env");
  return (mod.env ?? mod) as T;
};

/**
 * Apply overrides to process.env, reload env, and return a restore fn.
 */
export const mockEnv = (overrides: MockEnvOverrides): RestoreEnv => {
  const previousValues = new Map<string, string | undefined>();

  // Save previous values and apply overrides
  Object.keys(overrides).forEach((key) => {
    previousValues.set(key, process.env[key]);
    setEnvValue(key, overrides[key]);
  });

  // Re-parse env from the updated process.env
  reloadEnv();

  // Return a restore function that puts everything back and reloads env again
  return () => {
    previousValues.forEach((prev, key) => setEnvValue(key, prev));
    reloadEnv();
  };
};

/**
 * Jest sugar: automatically mock env in beforeEach and restore in afterEach.
 */
export function useMockEnv(overrides: MockEnvOverrides): void {
  let restoreEnv: RestoreEnv | undefined;

  beforeEach(() => {
    restoreEnv = mockEnv(overrides);
  });

  afterEach(() => {
    restoreEnv?.();
    restoreEnv = undefined;
  });
}

/**
 * Run a block (sync or async) with mocked env, restoring afterward.
 */
export function withMockedEnv<T>(
  overrides: MockEnvOverrides,
  callback: () => T
): T;
export function withMockedEnv<T>(
  overrides: MockEnvOverrides,
  callback: () => Promise<T>
): Promise<T>;
export function withMockedEnv<T>(
  overrides: MockEnvOverrides,
  callback: () => T | Promise<T>
): T | Promise<T> {
  const restore = mockEnv(overrides);
  try {
    const result = callback();
    if (result && typeof (result as any).then === "function") {
      return (result as Promise<T>).finally(restore);
    }
    restore();
    return result as T;
  } catch (error) {
    restore();
    throw error;
  }
}

export type { MockEnvOverrides };

import type { Env, EnvKey } from "@/utils/env";
import { resetEnvCache } from "@/utils/env";

type MockEnvOverrides = Partial<Record<EnvKey, Env[EnvKey] | undefined>>;
type RestoreEnv = () => void;

const setEnvValue = (key: EnvKey, value: Env[EnvKey] | undefined): void => {
  if (typeof value === "undefined") {
    delete process.env[key];
  } else {
    process.env[key] = String(value);
  }
};

export const mockEnv = (overrides: MockEnvOverrides): RestoreEnv => {
  const previousValues = new Map<EnvKey, string | undefined>();

  (Object.keys(overrides) as EnvKey[]).forEach((key) => {
    previousValues.set(key, process.env[key]);
    setEnvValue(key, overrides[key]);
  });

  resetEnvCache();

  return () => {
    (Object.keys(overrides) as EnvKey[]).forEach((key) => {
      const previousValue = previousValues.get(key);
      if (typeof previousValue === "undefined") {
        delete process.env[key];
      } else {
        process.env[key] = previousValue;
      }
    });

    resetEnvCache();
  };
};

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
    if (
      result &&
      typeof result === "object" &&
      "then" in (result as Promise<T>) &&
      typeof (result as Promise<T>).then === "function"
    ) {
      return (result as Promise<T>).finally(restore);
    }
    restore();
    return result;
  } catch (error) {
    restore();
    throw error;
  }
}

export type { MockEnvOverrides };

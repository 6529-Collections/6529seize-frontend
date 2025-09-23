type MockEnvOverrides = Partial<Record<string, string | undefined>>;
type RestoreEnv = () => void;

const setEnvValue = (key: string, value: string | undefined): void => {
  if (typeof value === "undefined") {
    delete process.env[key];
  } else {
    process.env[key] = String(value);
  }
};

export const mockEnv = (overrides: MockEnvOverrides): RestoreEnv => {
  const previousValues = new Map<string, string | undefined>();

  Object.keys(overrides).forEach((key) => {
    previousValues.set(key, process.env[key]);
    setEnvValue(key, overrides[key]);
  });

  return () => {
    previousValues.forEach((prev, key) => setEnvValue(key, prev));
  };
};

export const useMockEnv = (overrides: MockEnvOverrides): void => {
  const restore = mockEnv(overrides);
  beforeAll(() => {
    restore();
  });
};

export const withMockedEnv = <T>(
  overrides: MockEnvOverrides,
  fn: () => T
): T => {
  const restore = mockEnv(overrides);
  try {
    return fn();
  } finally {
    restore();
  }
};

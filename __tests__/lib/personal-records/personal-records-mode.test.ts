const mockPublicEnv: { NEXT_PUBLIC_FEATURE_PERSONAL_RECORDS?: string } = {};
jest.mock("@/config/env", () => ({
  get publicEnv() {
    return mockPublicEnv;
  },
}));

const mockFetch = jest.fn();
jest.mock("@/services/api/common-api", () => ({
  commonApiFetch: (...args: unknown[]) => mockFetch(...args),
}));

let mockWallet: string | null = "0x1111111111111111111111111111111111111111";
jest.mock("@/services/auth/auth.utils", () => ({
  getWalletAddress: () => mockWallet,
}));

type ModeModule = typeof import("@/lib/personal-records/personal-records-mode");

const OWNER = `0x${"01".repeat(32)}`;
const READER = "0x0000000000000000000000000000000000000009";
const PROVIDER_KEY = `0x${"02".repeat(32)}`;

const answer = (mode: string, overrides: Record<string, unknown> = {}) => ({
  mode,
  frozen: false,
  owner: OWNER,
  site_reader: READER,
  provider_keys: [{ id: "test-key", public_key: PROVIDER_KEY }],
  ...overrides,
});

/** A fresh module, so each test starts with an empty cache. */
const load = (): ModeModule => {
  let loaded: ModeModule | undefined;
  jest.isolateModules(() => {
    loaded = jest.requireActual<ModeModule>(
      "@/lib/personal-records/personal-records-mode"
    );
  });
  return loaded!;
};

let now = 1_800_000_000_000;

beforeEach(() => {
  mockFetch.mockReset();
  mockWallet = "0x1111111111111111111111111111111111111111";
  now = 1_800_000_000_000;
  jest.spyOn(Date, "now").mockImplementation(() => now);
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe("isPersonalRecordsEnabled", () => {
  it("is on only for exactly true", () => {
    const { isPersonalRecordsEnabled } = jest.requireActual<
      typeof import("@/lib/personal-records/personal-records-flag")
    >("@/lib/personal-records/personal-records-flag");
    delete mockPublicEnv.NEXT_PUBLIC_FEATURE_PERSONAL_RECORDS;
    expect(isPersonalRecordsEnabled()).toBe(false);
    mockPublicEnv.NEXT_PUBLIC_FEATURE_PERSONAL_RECORDS = "1";
    expect(isPersonalRecordsEnabled()).toBe(false);
    mockPublicEnv.NEXT_PUBLIC_FEATURE_PERSONAL_RECORDS = "true";
    expect(isPersonalRecordsEnabled()).toBe(true);
  });
});

describe("getPersonalRecordsMode", () => {
  it("reads GET /signed-records/mode", async () => {
    const { getPersonalRecordsMode } = load();
    mockFetch.mockResolvedValue(answer("shadow"));
    await expect(getPersonalRecordsMode()).resolves.toEqual({
      mode: "shadow",
      frozen: false,
      owner: OWNER,
      siteReader: READER,
      providerKeys: [{ id: "test-key", publicKey: PROVIDER_KEY }],
    });
    expect(mockFetch).toHaveBeenCalledWith({
      endpoint: "signed-records/mode",
      cache: "no-store",
      errorMode: "structured",
    });
  });

  it("serves one answer for 60 seconds", async () => {
    const { getPersonalRecordsMode } = load();
    mockFetch.mockResolvedValue(answer("legacy"));
    await getPersonalRecordsMode();
    now += 59_999;
    await getPersonalRecordsMode();
    expect(mockFetch).toHaveBeenCalledTimes(1);
    now += 1;
    mockFetch.mockResolvedValue(answer("primary"));
    await expect(getPersonalRecordsMode()).resolves.toMatchObject({
      mode: "primary",
    });
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it("reads again at once when asked for a fresh answer (after a 409)", async () => {
    const { getPersonalRecordsMode } = load();
    mockFetch.mockResolvedValueOnce(answer("legacy"));
    await getPersonalRecordsMode();
    mockFetch.mockResolvedValueOnce(answer("primary"));
    await expect(
      getPersonalRecordsMode({ fresh: true })
    ).resolves.toMatchObject({ mode: "primary" });
    // The fresh answer is cached for the next write.
    await expect(getPersonalRecordsMode()).resolves.toMatchObject({
      mode: "primary",
    });
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it("keeps one answer per wallet, since the owner is the session's", async () => {
    const { getPersonalRecordsMode } = load();
    mockFetch.mockResolvedValue(answer("shadow"));
    await getPersonalRecordsMode();
    mockWallet = "0x2222222222222222222222222222222222222222";
    mockFetch.mockResolvedValue(answer("shadow", { owner: null }));
    await expect(getPersonalRecordsMode()).resolves.toMatchObject({
      owner: null,
    });
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it("shares one request between concurrent writes", async () => {
    const { getPersonalRecordsMode } = load();
    mockFetch.mockResolvedValue(answer("primary"));
    await Promise.all([getPersonalRecordsMode(), getPersonalRecordsMode()]);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it("rejects an answer it can't use, and asks again next time", async () => {
    const { getPersonalRecordsMode } = load();
    mockFetch.mockResolvedValueOnce(answer("everything"));
    await expect(getPersonalRecordsMode()).rejects.toThrow();
    mockFetch.mockResolvedValueOnce(
      answer("primary", {
        provider_keys: [{ id: "test-key", public_key: "0x1234" }],
      })
    );
    await expect(getPersonalRecordsMode()).rejects.toThrow();
    mockFetch.mockResolvedValueOnce(answer("primary"));
    await expect(getPersonalRecordsMode()).resolves.toMatchObject({
      mode: "primary",
    });
  });
});

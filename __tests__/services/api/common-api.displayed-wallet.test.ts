import {
  commonApiDelete,
  commonApiFetch,
  commonApiPatch,
  commonApiPost,
  commonApiPut,
} from "@/services/api/common-api";
import { getAuthJwt } from "@/services/auth/auth.utils";
import {
  DisplayedProfileChangedError,
  showSignedInWallet,
} from "@/services/auth/displayed-wallet-guard";

jest.mock("@/services/auth/auth.utils", () => ({
  AUTH_STORAGE_KEYS: { activeAddress: "6529-wallet-active-address" },
  getStagingAuth: jest.fn(() => null),
  getAuthJwt: jest.fn(),
  getWalletAddress: jest.fn(() => null),
  getWalletRole: jest.fn(() => null),
  hasActiveSessionV2Auth: jest.fn(() => false),
}));

const WALLET_X = "0x1111111111111111111111111111111111111111";
const WALLET_Y = "0x2222222222222222222222222222222222222222";

const encode = (value: object): string =>
  Buffer.from(JSON.stringify(value)).toString("base64url");

const tokenFor = (wallet: string): string =>
  `${encode({ alg: "HS256", typ: "JWT" })}.${encode({
    sub: wallet,
    exp: 4_102_444_800,
  })}.signature`;

const fetchMock = globalThis.fetch as jest.Mock;
const getAuthJwtMock = getAuthJwt as jest.Mock;
let resetShownWallet: () => void = () => undefined;

const okResponse = () => ({
  ok: true,
  status: 200,
  json: async () => ({ ok: true }),
});

beforeEach(() => {
  jest.clearAllMocks();
  fetchMock.mockReset();
  fetchMock.mockResolvedValue(okResponse());
});

afterEach(() => {
  resetShownWallet();
  jest.useRealTimers();
});

describe("writes and the profile this tab shows", () => {
  it("refuses a write sent with another wallet's session and catches up", async () => {
    jest.useFakeTimers();
    resetShownWallet = showSignedInWallet(WALLET_X);
    getAuthJwtMock.mockReturnValue(tokenFor(WALLET_Y));
    const storageEvents: StorageEvent[] = [];
    const onStorage = (event: Event) => {
      storageEvents.push(event as StorageEvent);
    };
    globalThis.addEventListener("storage", onStorage);

    const write = commonApiPost({ endpoint: "drops", body: { text: "hi" } });

    await expect(write).rejects.toBeInstanceOf(DisplayedProfileChangedError);
    await expect(write).rejects.toThrow(
      "Nothing was sent: the signed-in profile changed in another tab."
    );
    expect(fetchMock).not.toHaveBeenCalled();
    jest.runAllTimers();
    expect(storageEvents.map((event) => event.key)).toEqual([
      "6529-wallet-active-address",
    ]);
    globalThis.removeEventListener("storage", onStorage);
  });

  it.each([
    ["PUT", () => commonApiPut({ endpoint: "profiles/x", body: {} })],
    ["PATCH", () => commonApiPatch({ endpoint: "profiles/x", body: {} })],
    ["DELETE", () => commonApiDelete({ endpoint: "drops/1" })],
  ])("refuses a mismatched %s write", async (_method, send) => {
    resetShownWallet = showSignedInWallet(WALLET_X);
    getAuthJwtMock.mockReturnValue(tokenFor(WALLET_Y));

    await expect(send()).rejects.toBeInstanceOf(DisplayedProfileChangedError);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("sends a write whose session matches the shown wallet", async () => {
    resetShownWallet = showSignedInWallet(WALLET_X.toUpperCase());
    const token = tokenFor(WALLET_X);
    getAuthJwtMock.mockReturnValue(token);

    await expect(
      commonApiPost({ endpoint: "drops", body: { text: "hi" } })
    ).resolves.toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.test.6529.io/api/drops",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ Authorization: `Bearer ${token}` }),
      })
    );
  });

  it("keeps reads unchanged while the tab is catching up", async () => {
    resetShownWallet = showSignedInWallet(WALLET_X);
    getAuthJwtMock.mockReturnValue(tokenFor(WALLET_Y));

    await expect(commonApiFetch({ endpoint: "drops" })).resolves.toEqual({
      ok: true,
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("sends writes unchanged when no signed-in wallet is shown", async () => {
    getAuthJwtMock.mockReturnValue(tokenFor(WALLET_Y));

    await expect(
      commonApiPost({ endpoint: "drops", body: {} })
    ).resolves.toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("does not check sign-in endpoints or requests with their own credential", async () => {
    resetShownWallet = showSignedInWallet(WALLET_X);
    getAuthJwtMock.mockReturnValue(tokenFor(WALLET_Y));

    await commonApiPost({ endpoint: "auth/session-refresh", body: {} });
    await commonApiPost({
      endpoint: "push-notifications/register",
      body: {},
      headers: { Authorization: `Bearer ${tokenFor(WALLET_Y)}-other` },
    });
    await commonApiPost({
      endpoint: "device-grants",
      body: {},
      includeWalletAuth: false,
      headers: { Authorization: `Bearer ${tokenFor(WALLET_Y)}` },
    });

    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("stops checking once the provider resets, but not after a newer wallet is shown", async () => {
    const resetX = showSignedInWallet(WALLET_X);
    resetShownWallet = showSignedInWallet(WALLET_Y);
    resetX();
    getAuthJwtMock.mockReturnValue(tokenFor(WALLET_X));

    await expect(
      commonApiPost({ endpoint: "drops", body: {} })
    ).rejects.toBeInstanceOf(DisplayedProfileChangedError);

    resetShownWallet();
    await expect(
      commonApiPost({ endpoint: "drops", body: {} })
    ).resolves.toEqual({ ok: true });
  });
});

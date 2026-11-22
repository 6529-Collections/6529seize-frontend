import {
  commonApiDelete,
  commonApiFetch,
  commonApiPost,
  commonApiPostForm,
  commonApiPut,
} from "@/services/api/common-api";
import { setIdentityFreezeAt } from "@/__tests__/helpers/identityFreeze";

jest.mock("@/config/env", () => {
  const actual = jest.requireActual("@/config/env");
  return {
    ...actual,
    get publicEnv() {
      return {
        ...actual.publicEnv,
        NEXT_PUBLIC_IDENTITY_FREEZE_AT: (
          globalThis as { __identityFreezeAt?: string }
        ).__identityFreezeAt,
      };
    },
  };
});

jest.mock("@/services/auth/auth.utils", () => ({
  AUTH_STORAGE_KEYS: { activeAddress: "6529-wallet-active-address" },
  getStagingAuth: jest.fn(() => null),
  getAuthJwt: jest.fn(() => null),
  getWalletAddress: jest.fn(() => null),
  getWalletRole: jest.fn(() => null),
  hasActiveSessionV2Auth: jest.fn(() => false),
}));

const FREEZE = Date.UTC(2026, 10, 24, 0, 0, 0);
const fetchMock = globalThis.fetch as jest.Mock;

beforeEach(() => {
  jest.useFakeTimers();
  setIdentityFreezeAt("2026-11-24T00:00:00Z");
  fetchMock.mockReset();
  fetchMock.mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => ({ ok: true }),
  });
});

afterEach(() => {
  jest.useRealTimers();
  setIdentityFreezeAt(undefined);
});

describe("identity edits through the API helpers during the move", () => {
  it.each([
    ["profile save", () => commonApiPost({ endpoint: "profiles", body: {} })],
    [
      "REP rating",
      () =>
        commonApiPost({
          endpoint: "profiles/alice/rep/rating",
          body: { amount: 1, category: "Art" },
        }),
    ],
    [
      "statement removal",
      () => commonApiDelete({ endpoint: "profiles/alice/cic/statements/1" }),
    ],
    [
      "proxy action change",
      () => commonApiPut({ endpoint: "proxies/p/actions/a", body: {} }),
    ],
    [
      "picture upload",
      () =>
        commonApiPostForm({
          endpoint: "profiles/alice/pfp",
          body: new FormData(),
        }),
    ],
  ])("refuses a %s from the freeze without sending it", async (_name, send) => {
    jest.setSystemTime(FREEZE);
    await expect(send()).rejects.toThrow(
      "Paused for the move to the 6529 Network."
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("sends the same edit before the freeze", async () => {
    jest.setSystemTime(FREEZE - 1);
    await expect(
      commonApiPost({ endpoint: "profiles", body: {} })
    ).resolves.toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("keeps reads and other writes going while frozen", async () => {
    jest.setSystemTime(FREEZE + 1);
    await expect(
      commonApiFetch({ endpoint: "profiles/alice/rep/rating" })
    ).resolves.toEqual({ ok: true });
    await expect(
      commonApiPost({ endpoint: "drops", body: { text: "gm" } })
    ).resolves.toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});

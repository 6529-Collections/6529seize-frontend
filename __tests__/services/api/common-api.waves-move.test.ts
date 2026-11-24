import {
  commonApiDelete,
  commonApiFetch,
  commonApiPatch,
  commonApiPost,
  commonApiPut,
} from "@/services/api/common-api";
import {
  clearWavesFreeze,
  setWavesFreezeSchedule,
  WAVES_FREEZE_MS,
} from "@/__tests__/helpers/wavesFreeze";

jest.mock("@/config/env", () => {
  const actual = jest.requireActual("@/config/env");
  return {
    ...actual,
    get publicEnv() {
      return {
        ...actual.publicEnv,
        ...(globalThis as { __wavesFreeze?: object }).__wavesFreeze,
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

const fetchMock = globalThis.fetch as jest.Mock;

beforeEach(() => {
  setWavesFreezeSchedule();
  fetchMock.mockReset();
  fetchMock.mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => ({ ok: true }),
  });
});

afterEach(() => {
  jest.useRealTimers();
  clearWavesFreeze();
});

const WRITES: ReadonlyArray<readonly [string, () => Promise<unknown>]> = [
  [
    "a poll ballot",
    () =>
      commonApiPost({
        endpoint: "v2/drops/d1/poll/vote",
        body: { options: [1] },
      }),
  ],
  [
    "an entry",
    () =>
      commonApiPost({
        endpoint: "drops",
        body: { wave_id: "w1", drop_type: "PARTICIPATORY", parts: [] },
      }),
  ],
  [
    "a decision vote",
    () =>
      commonApiPut({
        endpoint: "v3/waves/w1/competitions/c1/entries/e1/votes/me",
        body: { value: 1 },
      }),
  ],
  [
    "wave REP",
    () =>
      commonApiPost({
        endpoint: "waves/w1/rep/rating",
        body: { amount: 1, category: "Art" },
      }),
  ],
  [
    "a wave edit",
    () => commonApiPatch({ endpoint: "v3/waves/w1", body: { name: "New" } }),
  ],
  ["a new wave", () => commonApiPost({ endpoint: "waves", body: {} })],
];

describe("waves writes through the API helpers during the move", () => {
  it.each(WRITES)("sends %s before the freeze", async (_name, send) => {
    jest.useFakeTimers({ now: WAVES_FREEZE_MS - 1 });
    await send();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it.each(WRITES)(
    "refuses %s from the freeze without sending it",
    async (_name, send) => {
      jest.useFakeTimers({ now: WAVES_FREEZE_MS });
      await expect(send()).rejects.toThrow(
        "Paused for the move to the 6529 Network."
      );
      expect(fetchMock).not.toHaveBeenCalled();
    }
  );

  it("keeps chat and reads going from the freeze", async () => {
    jest.useFakeTimers({ now: WAVES_FREEZE_MS });
    await commonApiPost({
      endpoint: "drops",
      body: { wave_id: "w1", drop_type: "CHAT", parts: [] },
    });
    await commonApiFetch({ endpoint: "v3/waves/w1" });
    await commonApiDelete({ endpoint: "waves/dm1" });
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });
});

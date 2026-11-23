/** @jest-environment node */
import { MEMES_CONTRACT } from "@/constants/constants";
import type { ApiDropV2View } from "@/services/api/drop-v2-view.types";
import { getLatestDropTransitionTime } from "@/helpers/mint-visibility.helpers";
import { dateFromMintNumber } from "@/shared/memes-calendar/calendar";
import { mintPhaseWindowsForDay } from "@/shared/memes-calendar/phases";

jest.mock("next/dist/compiled/server-only", () => ({}), { virtual: true });

const mockFetch = jest.fn();
const mockReadClaim = jest.fn();
const mockMapDecisions = jest.fn();
const mockWinner = {
  id: "next-artwork",
  title: "Upcoming artwork",
} as ApiDropV2View;
const latest = { id: 536, name: "Current artwork", floor_price: 0 };
const waveId = "test-memes-wave-id";
const transitionTime = getLatestDropTransitionTime(latest.id)!;

jest.mock("@/lib/fetch/ssrFetch", () => ({
  publicSsrFetch: (...args: unknown[]) => mockFetch(...args),
}));
jest.mock("@/lib/ethereum/mainnetClient", () => ({
  getEthereumMainnetClient: () => ({ readContract: mockReadClaim }),
}));
jest.mock("@/services/api/wave-decisions-v2-api", () => ({
  mapWaveDecisionsV2: (...args: unknown[]) => mockMapDecisions(...args),
}));

let getInitialHomeDrop: typeof import("@/app/(home)/homeDrop.server").getInitialHomeDrop;

beforeEach(async () => {
  jest.useFakeTimers().setSystemTime(transitionTime);
  jest.resetAllMocks();
  mockFetch.mockImplementation(async (url: string) => {
    const pathname = new URL(url).pathname;
    switch (pathname) {
      case "/api/memes_latest":
        return Response.json(latest);
      case "/api/settings":
        return Response.json({ memes_wave_id: waveId });
      case `/api/waves/${waveId}`:
        return Response.json({ id: waveId });
      case `/api/v2/waves/${waveId}/decisions`:
        return Response.json({ data: [] });
      case `/api/minting-claims/${MEMES_CONTRACT}/${latest.id}/roots`:
        return Response.json([]);
      default:
        throw new Error(`Unmocked path ${pathname}`);
    }
  });
  mockReadClaim.mockResolvedValue([
    1n,
    {
      total: 50,
      totalMax: 100,
      startDate: 1,
      endDate: 2,
      merkleRoot: `0x${"0".repeat(64)}`,
    },
  ]);
  mockMapDecisions.mockReturnValue({
    data: [{ winners: [{ drop: mockWinner }] }],
  });

  // Each worker has its own public data cache.
  await jest.isolateModulesAsync(async () => {
    ({ getInitialHomeDrop } = await import("@/app/(home)/homeDrop.server"));
  });
});

afterEach(() => {
  jest.useRealTimers();
});

it("uses the same grace deadline on the server and reuses cached reads across visits", async () => {
  jest.setSystemTime(transitionTime - 1);
  await expect(getInitialHomeDrop()).resolves.toEqual({
    kind: "latest",
    nft: latest,
  });
  expect(mockReadClaim).not.toHaveBeenCalled();

  jest.setSystemTime(transitionTime);
  const expected = { kind: "next", mintNumber: latest.id, drop: mockWinner };
  const results = await Promise.all([
    getInitialHomeDrop(),
    getInitialHomeDrop(),
  ]);
  expect(results).toEqual([expected, expected]);
  expect(mockReadClaim).toHaveBeenCalledTimes(1);
  expect(mockFetch).toHaveBeenCalledTimes(4);
});

it("keeps Latest Drop when the completed mint has no next winner", async () => {
  mockMapDecisions.mockReturnValue({ data: [] });
  await expect(getInitialHomeDrop()).resolves.toEqual({
    kind: "latest",
    nft: latest,
  });
});

it("keeps Latest Drop if the current claim is still live", async () => {
  mockReadClaim.mockResolvedValue([
    1n,
    {
      total: 50,
      totalMax: 100,
      startDate: 1,
      endDate: transitionTime / 1000 + 60,
      merkleRoot: `0x${"0".repeat(64)}`,
    },
  ]);
  await expect(getInitialHomeDrop()).resolves.toEqual({
    kind: "latest",
    nft: latest,
  });
});

it("keeps Latest Drop between mint phases even after the grace deadline", async () => {
  const [phase] = mintPhaseWindowsForDay(dateFromMintNumber(latest.id));
  mockReadClaim.mockResolvedValue([
    1n,
    {
      total: 50,
      totalMax: 100,
      startDate: phase!.start.getTime() / 1000,
      endDate: phase!.end.getTime() / 1000,
      merkleRoot: `0x${"1".repeat(64)}`,
    },
  ]);

  await expect(getInitialHomeDrop()).resolves.toEqual({
    kind: "latest",
    nft: latest,
  });
});

it.each([false, true])(
  "keeps the card selection accurate during a winner outage (mint complete: %s)",
  async (complete) => {
    mockFetch
      .mockResolvedValueOnce(Response.json(latest))
      .mockResolvedValueOnce(Response.json({}, { status: 503 }));
    if (!complete) {
      mockReadClaim.mockResolvedValue([
        1n,
        {
          total: 50,
          totalMax: 100,
          startDate: 1,
          endDate: transitionTime / 1000 + 60,
          merkleRoot: `0x${"0".repeat(64)}`,
        },
      ]);
    }
    await expect(getInitialHomeDrop()).resolves.toEqual(
      complete ? null : { kind: "latest", nft: latest }
    );
  }
);

it("leaves the slot empty when mint completion could not be checked", async () => {
  mockReadClaim.mockRejectedValue(new Error("Unavailable"));
  await expect(getInitialHomeDrop()).resolves.toBeNull();
});

it("bounds the wait for a cold dependency and lets it warm the next visit", async () => {
  let resolveArtwork!: (response: Response) => void;
  mockFetch.mockReturnValueOnce(
    new Promise<Response>((resolve) => {
      resolveArtwork = resolve;
    })
  );
  const slowRender = getInitialHomeDrop();
  await jest.advanceTimersByTimeAsync(1250);
  await expect(slowRender).resolves.toBeNull();

  resolveArtwork(Response.json(latest));
  await expect(getInitialHomeDrop()).resolves.toMatchObject({ kind: "next" });
  expect(mockReadClaim).toHaveBeenCalledTimes(1);
});

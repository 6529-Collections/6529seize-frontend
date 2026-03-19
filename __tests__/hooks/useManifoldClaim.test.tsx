import { MEMES_CONTRACT, NULL_MERKLE } from "@/constants/constants";
import { Time } from "@/helpers/time";
import {
  buildMemesPhases,
  ManifoldClaimStatus,
  ManifoldPhase,
  useManifoldClaim,
} from "@/hooks/useManifoldClaim";
import { getMemesMintingRoots } from "@/services/api/memes-minting-claims-api";
import { renderHook, waitFor } from "@testing-library/react";
import { useReadContract } from "wagmi";

jest.mock("wagmi", () => ({ useReadContract: jest.fn() }));
jest.mock("@/services/api/memes-minting-claims-api", () => ({
  getMemesMintingRoots: jest.fn(),
}));

const mockRead = useReadContract as jest.Mock;
const mockGetMemesMintingRoots = getMemesMintingRoots as jest.Mock;

beforeEach(() => {
  jest.spyOn(Date, "now").mockReturnValue(150 * 1000);
  mockGetMemesMintingRoots.mockReset();
  mockGetMemesMintingRoots.mockResolvedValue([]);
});

afterEach(() => {
  jest.restoreAllMocks();
});

test("builds claim from contract data", async () => {
  mockRead.mockReturnValue({
    data: [
      BigInt(3),
      {
        total: BigInt(1),
        totalMax: BigInt(2),
        cost: BigInt(0),
        startDate: BigInt(0),
        endDate: BigInt(9999999999),
        merkleRoot: NULL_MERKLE,
      },
    ],
    isFetching: false,
    error: null,
  });
  const { result } = renderHook(() =>
    useManifoldClaim({
      chainId: 1,
      contract: "0x1",
      proxy: "0x2",
      abi: [],
      identifier: 1,
    })
  );
  await waitFor(() => expect(result.current.claim).toBeDefined());
  expect(result.current.claim?.status).toBe(ManifoldClaimStatus.ACTIVE);
  expect(result.current.claim?.phase).toBe(ManifoldPhase.PUBLIC);
  expect(result.current.claim?.remaining).toBe(1);
});

test("builds claim from getClaim tuple shape", async () => {
  mockRead.mockReturnValue({
    data: {
      total: BigInt(1),
      totalMax: BigInt(3),
      cost: BigInt(0),
      startDate: BigInt(0),
      endDate: BigInt(9999999999),
      merkleRoot: NULL_MERKLE,
      location: "ipfs://example",
    },
    isFetching: false,
    error: null,
  });

  const { result } = renderHook(() =>
    useManifoldClaim({
      chainId: 11155111,
      contract: "0x1",
      proxy: "0x2",
      abi: [],
      identifier: 459,
    })
  );

  await waitFor(() => expect(result.current.claim).toBeDefined());
  expect(result.current.claim?.instanceId).toBe(459);
  expect(result.current.claim?.status).toBe(ManifoldClaimStatus.ACTIVE);
  expect(result.current.claim?.phase).toBe(ManifoldPhase.PUBLIC);
  expect(result.current.claim?.remaining).toBe(2);
});

test("keeps memes drops active across phased allowlists", async () => {
  const [phase0, phase1] = buildMemesPhases(
    Time.fromString("2024-07-03T00:00:00.000Z")
  );

  jest.spyOn(Date, "now").mockReturnValue(phase0.end.plusMinutes(5).toMillis());

  mockRead.mockReturnValue({
    data: [
      BigInt(7),
      {
        total: BigInt(153),
        totalMax: BigInt(328),
        cost: BigInt(0),
        startDate: BigInt(phase0.start.toSeconds()),
        endDate: BigInt(phase0.end.toSeconds()),
        merkleRoot: `0x${"1".repeat(64)}`,
      },
    ],
    isFetching: false,
    error: null,
    refetch: jest.fn(),
  });
  mockGetMemesMintingRoots.mockResolvedValue([
    {
      phase: "Phase 0",
      merkle_root: `0x${"1".repeat(64)}`,
      addresses_count: 10,
      total_spots: 10,
    },
    {
      phase: "Phase 1",
      merkle_root: `0x${"2".repeat(64)}`,
      addresses_count: 20,
      total_spots: 20,
    },
  ]);

  const { result } = renderHook(() =>
    useManifoldClaim({
      chainId: 1,
      contract: MEMES_CONTRACT,
      proxy: "0x2",
      abi: [],
      identifier: 1,
    })
  );

  await waitFor(() =>
    expect(result.current.claim?.nextMemePhase?.id).toBe("1")
  );

  expect(result.current.claim?.phase).toBe(ManifoldPhase.ALLOWLIST);
  expect(result.current.claim?.isFinalized).toBe(true);
  expect(result.current.claim?.isDropComplete).toBe(false);
  expect(result.current.claim?.nextMemePhase?.id).toBe(phase1.id);
  expect(mockRead.mock.lastCall?.[0].query.enabled).toBe(true);
});

test("maps memes phase from roots using the onchain merkle root", async () => {
  const [phase0] = buildMemesPhases(
    Time.fromString("2024-07-03T00:00:00.000Z")
  );

  mockRead.mockReturnValue({
    data: [
      BigInt(8),
      {
        total: BigInt(12),
        totalMax: BigInt(328),
        cost: BigInt(0),
        startDate: BigInt(phase0.start.toSeconds()),
        endDate: BigInt(phase0.end.toSeconds()),
        merkleRoot: `0x${"2".repeat(64)}`,
      },
    ],
    isFetching: false,
    error: null,
    refetch: jest.fn(),
  });
  mockGetMemesMintingRoots.mockResolvedValue([
    {
      phase: "Phase 0",
      merkle_root: `0x${"1".repeat(64)}`,
      addresses_count: 10,
      total_spots: 10,
    },
    {
      phase: "Phase 1",
      merkle_root: `0x${"2".repeat(64)}`,
      addresses_count: 20,
      total_spots: 20,
    },
  ]);

  const { result } = renderHook(() =>
    useManifoldClaim({
      chainId: 1,
      contract: MEMES_CONTRACT,
      proxy: "0x2",
      abi: [],
      identifier: 1,
    })
  );

  await waitFor(() => expect(result.current.claim?.memePhase?.id).toBe("1"));
  expect(result.current.claim?.memePhase?.name).toBe("Phase 1 (Allowlist)");
});

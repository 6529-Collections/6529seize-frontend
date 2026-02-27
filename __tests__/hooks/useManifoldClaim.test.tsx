import { NULL_MERKLE } from "@/constants/constants";
import {
  ManifoldClaimStatus,
  ManifoldPhase,
  useManifoldClaim,
} from "@/hooks/useManifoldClaim";
import { renderHook, waitFor } from "@testing-library/react";
import { useReadContract } from "wagmi";

jest.mock("wagmi", () => ({ useReadContract: jest.fn() }));

const mockRead = useReadContract as jest.Mock;

beforeEach(() => {
  jest.spyOn(Date, "now").mockReturnValue(150 * 1000);
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

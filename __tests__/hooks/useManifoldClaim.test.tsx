import { renderHook, waitFor } from "@testing-library/react";
import { useReadContract } from "wagmi";
import { NULL_MERKLE } from "@/constants";
import {
  ManifoldClaimStatus,
  ManifoldPhase,
  useManifoldClaim,
} from "@/hooks/useManifoldClaim";

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
        startDate: BigInt(100),
        endDate: BigInt(200),
        merkleRoot: NULL_MERKLE,
      },
    ],
    isFetching: false,
    error: null,
  });
  const { result } = renderHook(() => useManifoldClaim("0x1", "0x2", [], 1));
  await waitFor(() => expect(result.current).toBeDefined());
  expect(result.current?.status).toBe(ManifoldClaimStatus.ACTIVE);
  expect(result.current?.phase).toBe(ManifoldPhase.PUBLIC);
  expect(result.current?.remaining).toBe(1);
});

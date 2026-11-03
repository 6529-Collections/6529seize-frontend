import { renderHook } from "@testing-library/react";
import { useReadContracts } from "wagmi";
import { useIsDropForgeAdmin } from "@/hooks/useIsDropForgeAdmin";
const owner = "0x0000000000000000000000000000000000000001";
const admin = "0x0000000000000000000000000000000000000002";
type ContractRead =
  | { status: "success"; result: unknown }
  | { status: "failure"; error: Error };
type MockReads = {
  data: ContractRead[] | undefined;
  isError: boolean;
  isPending: boolean;
};
const success = (result: unknown): ContractRead => ({
  status: "success",
  result,
});
const failure = (): ContractRead => ({
  status: "failure",
  error: new Error("execution reverted"),
});
let mockWallet: string | undefined = admin;
let mockReads: MockReads = settledReads(success(owner), success(true));
function settledReads(
  ownerRead: ContractRead,
  adminRead: ContractRead
): MockReads {
  return { data: [ownerRead, adminRead], isError: false, isPending: false };
}
jest.mock("wagmi", () => ({
  useReadContracts: jest.fn(() => mockReads),
}));
jest.mock("@/components/auth/SeizeConnectContext", () => ({
  useSeizeConnectContext: () => ({ address: mockWallet }),
}));
jest.mock("@/components/drop-forge/drop-forge-config", () => ({
  useDropForgeMintingConfig: () => ({
    contract: owner,
    chain: { id: 11155111 },
  }),
}));
const lastOptions = () => {
  const calls = jest.mocked(useReadContracts).mock.calls;
  return calls[calls.length - 1]?.[0] as unknown as {
    contracts: { functionName: string; args?: unknown[] }[];
    query: Record<string, unknown>;
  };
};
beforeEach(() => {
  jest.clearAllMocks();
  mockWallet = admin;
  mockReads = settledReads(success(owner), success(true));
});
it("recognizes an approved admin, without granting owner rights", () => {
  const { result } = renderHook(() => useIsDropForgeAdmin());
  expect(result.current).toMatchObject({
    isDropForgeAdmin: true,
    isDropForgeOwner: false,
  });
});
it("batches the owner and admin reads into one cached query without polling", () => {
  renderHook(() => useIsDropForgeAdmin());
  expect(useReadContracts).toHaveBeenCalledTimes(1);
  const { contracts, query } = lastOptions();
  expect(contracts).toEqual([
    expect.objectContaining({
      address: owner,
      chainId: 11155111,
      functionName: "owner",
    }),
    expect.objectContaining({
      address: owner,
      chainId: 11155111,
      functionName: "isAdmin",
      args: [admin],
    }),
  ]);
  expect(query).toEqual({ enabled: true, staleTime: 5 * 60_000 });
  expect(query).not.toHaveProperty("refetchInterval");
});
it("recognizes ownership even if the secondary admin read fails", () => {
  mockWallet = owner;
  mockReads = settledReads(success(owner), failure());
  const { result } = renderHook(() => useIsDropForgeAdmin());
  expect(result.current).toMatchObject({
    isDropForgeAdmin: true,
    isDropForgeOwner: true,
  });
});
it("does not grant admin when the admin read fails for a non-owner", () => {
  mockReads = settledReads(success(owner), failure());
  const { result } = renderHook(() => useIsDropForgeAdmin());
  expect(result.current).toMatchObject({
    isDropForgeAdmin: false,
    isDropForgeOwner: false,
  });
});
it("fails closed instead of trusting stale data after a read error", () => {
  mockWallet = owner;
  mockReads = { ...settledReads(success(owner), success(true)), isError: true };
  const { result } = renderHook(() => useIsDropForgeAdmin());
  expect(result.current).toMatchObject({
    isDropForgeAdmin: false,
    isDropForgeOwner: false,
  });
});
it("revokes permission when the next onchain read is false", () => {
  const { result, rerender } = renderHook(() => useIsDropForgeAdmin());
  mockReads = settledReads(success(owner), success(false));
  rerender();
  expect(result.current.isDropForgeAdmin).toBe(false);
});
it("reports loading only while the enabled query is pending", () => {
  mockReads = { data: undefined, isError: false, isPending: true };
  const { result } = renderHook(() => useIsDropForgeAdmin());
  expect(result.current).toMatchObject({
    isDropForgeAdmin: false,
    isDropForgeOwner: false,
    isFetching: true,
  });
});
it("does not grant permission to a disconnected wallet from cached results", () => {
  mockWallet = undefined;
  const { result } = renderHook(() => useIsDropForgeAdmin());
  expect(lastOptions().query).toMatchObject({ enabled: false });
  expect(result.current).toMatchObject({
    isDropForgeAdmin: false,
    isDropForgeOwner: false,
    isFetching: false,
  });
});
it("skips the onchain reads when the caller already knows the wallet is an admin", () => {
  mockReads = { data: undefined, isError: false, isPending: true };
  const { result } = renderHook(() => useIsDropForgeAdmin({ skip: true }));
  expect(lastOptions().query).toMatchObject({ enabled: false });
  expect(result.current).toEqual({
    isDropForgeAdmin: false,
    isDropForgeOwner: false,
    isFetching: false,
  });
});
it("ignores cached reads while skipped", () => {
  mockWallet = owner;
  const { result } = renderHook(() => useIsDropForgeAdmin({ skip: true }));
  expect(result.current).toMatchObject({
    isDropForgeAdmin: false,
    isDropForgeOwner: false,
  });
});

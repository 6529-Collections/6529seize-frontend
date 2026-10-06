import { renderHook } from "@testing-library/react";
import { useReadContract } from "wagmi";
import { useIsDropForgeAdmin } from "@/hooks/useIsDropForgeAdmin";
const owner = "0x0000000000000000000000000000000000000001";
const admin = "0x0000000000000000000000000000000000000002";
let mockWallet: string | undefined = admin;
let mockOwnerRead = { data: owner, isError: false, isPending: false };
let mockAdminRead = { data: true, isError: false, isPending: false };
jest.mock("wagmi", () => ({
  useReadContract: jest.fn(({ functionName }) =>
    functionName === "owner" ? mockOwnerRead : mockAdminRead
  ),
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
beforeEach(() => {
  jest.clearAllMocks();
  mockWallet = admin;
  mockOwnerRead = { data: owner, isError: false, isPending: false };
  mockAdminRead = { data: true, isError: false, isPending: false };
});
it("recognizes an approved admin, without granting owner rights", () => {
  const { result } = renderHook(useIsDropForgeAdmin);
  expect(result.current).toMatchObject({
    isDropForgeAdmin: true,
    isDropForgeOwner: false,
  });
  expect(useReadContract).toHaveBeenCalledWith(
    expect.objectContaining({
      address: owner,
      chainId: 11155111,
      functionName: "isAdmin",
      args: [admin],
      query: expect.objectContaining({ staleTime: 0, refetchInterval: 15000 }),
    })
  );
});
it("recognizes ownership even if the secondary admin read fails", () => {
  mockWallet = owner;
  mockAdminRead.isError = true;
  const { result } = renderHook(useIsDropForgeAdmin);
  expect(result.current).toMatchObject({
    isDropForgeAdmin: true,
    isDropForgeOwner: true,
  });
});
it("fails closed instead of trusting stale data after a read error", () => {
  mockWallet = owner;
  mockOwnerRead.isError = true;
  mockAdminRead.isError = true;
  const { result } = renderHook(useIsDropForgeAdmin);
  expect(result.current).toMatchObject({
    isDropForgeAdmin: false,
    isDropForgeOwner: false,
  });
});
it("revokes permission when the next onchain read is false", () => {
  const { result, rerender } = renderHook(useIsDropForgeAdmin);
  mockAdminRead.data = false;
  rerender();
  expect(result.current.isDropForgeAdmin).toBe(false);
});
it("does not grant permission to a disconnected wallet from cached results", () => {
  mockWallet = undefined;
  const { result } = renderHook(useIsDropForgeAdmin);
  expect(result.current).toMatchObject({
    isDropForgeAdmin: false,
    isDropForgeOwner: false,
    isFetching: false,
  });
});

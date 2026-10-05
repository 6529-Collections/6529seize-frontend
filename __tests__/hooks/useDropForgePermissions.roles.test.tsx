import { renderHook } from "@testing-library/react";
import { useDropForgePermissions } from "@/hooks/useDropForgePermissions";

const wallet = "0x0000000000000000000000000000000000000123";
let mockRole = { owner: false, admin: false, pending: false };
let mockSettings = {
  distribution_admin_wallets: [] as string[],
  claims_admin_wallets: [] as string[],
};
jest.mock("@/components/auth/SeizeConnectContext", () => ({
  useSeizeConnectContext: () => ({
    address: wallet,
    connectionState: "connected",
  }),
}));
jest.mock("@/contexts/SeizeSettingsContext", () => ({
  useSeizeSettings: () => ({ seizeSettings: mockSettings, isLoaded: true }),
}));
jest.mock("@/hooks/useIsDropForgeAdmin", () => ({
  useIsDropForgeAdmin: () => ({
    isDropForgeAdmin: mockRole.owner || mockRole.admin,
    isDropForgeOwner: mockRole.owner,
    isFetching: mockRole.pending,
  }),
}));

it.each([
  ["distribution", true, false, false],
  ["claims", false, true, true],
  ["owner", false, true, true],
  ["onchain admin", false, true, false],
  ["ordinary wallet", false, false, false],
])(
  "gates %s separately for craft, launch, and admin management",
  (role, craft, launch, manage) => {
    mockRole = {
      owner: role === "owner",
      admin: role === "onchain admin",
      pending: false,
    };
    mockSettings = {
      distribution_admin_wallets:
        role === "distribution" ? [wallet.toUpperCase()] : [],
      claims_admin_wallets: role === "claims" ? [wallet.toUpperCase()] : [],
    };
    const { result } = renderHook(useDropForgePermissions);
    expect(result.current.canAccessCraft).toBe(craft);
    expect(result.current.canAccessLaunchPage).toBe(launch);
    expect(result.current.canManageClaimActions).toBe(launch);
    expect(result.current.canManageContractAdmins).toBe(manage);
    expect(result.current.canAccessLanding).toBe(craft || launch);
  }
);

it("does not block configured claims admins on a pending RPC read", () => {
  mockRole = { owner: false, admin: false, pending: true };
  mockSettings = {
    distribution_admin_wallets: [],
    claims_admin_wallets: [wallet],
  };
  const { result } = renderHook(useDropForgePermissions);
  expect(result.current.permissionsLoading).toBe(false);
  expect(result.current.canAccessLaunchPage).toBe(true);
});

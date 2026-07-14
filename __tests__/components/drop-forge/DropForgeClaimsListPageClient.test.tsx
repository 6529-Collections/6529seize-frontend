import { render, screen } from "@testing-library/react";
import type { MintingClaim } from "@/generated/models/MintingClaim";
import DropForgeClaimsListPageClient from "@/components/drop-forge/DropForgeClaimsListPageClient";

const mockSetToast = jest.fn();
const mockGetClaimsPage = jest.fn();
const mockGetMemesMintingClaimActions = jest.fn();
const mockUseDropForgeManifoldClaim = jest.fn();

jest.mock("@/components/auth/Auth", () => ({
  useAuth: () => ({ setToast: mockSetToast }),
}));

jest.mock("@/components/drop-forge/DropForgeTestnetIndicator", () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock("@/hooks/useDropForgePermissions", () => ({
  useDropForgePermissions: () => ({
    hasWallet: true,
    permissionsLoading: false,
    canAccessCraft: true,
    canAccessLaunchPage: true,
  }),
}));

jest.mock("@/hooks/useDropForgeManifoldClaim", () => ({
  useDropForgeManifoldClaim: (...args: unknown[]) =>
    mockUseDropForgeManifoldClaim(...args),
}));

jest.mock("@/services/api/memes-minting-claims-api", () => ({
  getClaimsPage: (...args: unknown[]) => mockGetClaimsPage(...args),
  getMemesMintingClaimActions: (...args: unknown[]) =>
    mockGetMemesMintingClaimActions(...args),
}));

function createClaim(claimId: number): MintingClaim {
  return {
    claim_id: claimId,
    contract: "0xcontract",
    drop_id: `drop-${claimId}`,
    description: "",
    name: `Claim ${claimId}`,
    attributes: [],
  } as MintingClaim;
}

describe("DropForgeClaimsListPageClient", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseDropForgeManifoldClaim.mockReturnValue({
      claim: undefined,
      isFetching: false,
      refetch: jest.fn(),
    });
    mockGetMemesMintingClaimActions.mockResolvedValue({ actions: [] });
    mockGetClaimsPage.mockResolvedValue({
      claims: [createClaim(101), createClaim(102)],
      count: 2,
      page: 1,
      page_size: 5,
      next: false,
    });
  });

  it("disables the per-card roots lookup for launch claims", async () => {
    render(<DropForgeClaimsListPageClient mode="launch" />);

    await screen.findByText("Claim 101");
    await screen.findByText("Claim 102");

    expect(mockGetClaimsPage).toHaveBeenCalledTimes(1);
    expect(mockUseDropForgeManifoldClaim).toHaveBeenCalledTimes(2);

    const calledClaimIds = mockUseDropForgeManifoldClaim.mock.calls.map(
      ([claimId]) => claimId
    );
    expect(new Set(calledClaimIds)).toEqual(new Set([101, 102]));
    expect(
      mockUseDropForgeManifoldClaim.mock.calls.every(
        ([, options]) =>
          (options as { fetchMemesRoots?: boolean }).fetchMemesRoots === false
      )
    ).toBe(true);
  });
});

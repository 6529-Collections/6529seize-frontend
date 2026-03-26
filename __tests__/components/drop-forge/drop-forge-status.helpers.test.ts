jest.mock("@/components/drop-forge/launch/launchClaimHelpers", () => ({
  isMissingRequiredLaunchInfo: jest.fn(),
}));

import { getClaimPrimaryStatus } from "@/components/drop-forge/drop-forge-status.helpers";
import { isMissingRequiredLaunchInfo } from "@/components/drop-forge/launch/launchClaimHelpers";
import type { MintingClaim } from "@/generated/models/MintingClaim";

const mockedIsMissingRequiredLaunchInfo = jest.mocked(
  isMissingRequiredLaunchInfo
);

describe("getClaimPrimaryStatus", () => {
  const baseClaim = {
    claim_id: 123,
    metadata_location: "ar://example",
    media_uploading: false,
  } as MintingClaim;

  beforeEach(() => {
    mockedIsMissingRequiredLaunchInfo.mockReturnValue(false);
  });

  it("returns a loading status while launch onchain state is still fetching", () => {
    expect(
      getClaimPrimaryStatus({
        claim: baseClaim,
        manifoldClaim: null,
        isManifoldClaimFetching: true,
      })
    ).toMatchObject({
      key: "checking_onchain",
      label: "Checking Onchain",
      tone: "pending",
    });
  });

  it("returns pending initialization after launch onchain state has finished loading", () => {
    expect(
      getClaimPrimaryStatus({
        claim: baseClaim,
        manifoldClaim: null,
        isManifoldClaimFetching: false,
      })
    ).toMatchObject({
      key: "pending_initialization",
      label: "Pending Initialization",
      tone: "pending",
    });
  });

  it("keeps craft claims in the published state", () => {
    expect(getClaimPrimaryStatus({ claim: baseClaim })).toMatchObject({
      key: "published",
      label: "Published",
      tone: "success",
    });
  });
});

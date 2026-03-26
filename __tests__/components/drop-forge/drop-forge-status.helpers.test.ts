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

  it("returns draft when there is no metadata and nothing is initialized", () => {
    expect(
      getClaimPrimaryStatus({
        claim: {
          ...baseClaim,
          metadata_location: null,
        },
        manifoldClaim: null,
      })
    ).toMatchObject({
      key: "draft",
      label: "Draft",
      tone: "neutral",
    });
  });

  it("returns pending initialization missing info when launch fields are incomplete", () => {
    mockedIsMissingRequiredLaunchInfo.mockReturnValue(true);

    expect(
      getClaimPrimaryStatus({
        claim: baseClaim,
        manifoldClaim: null,
        isManifoldClaimFetching: false,
      })
    ).toMatchObject({
      key: "pending_initialization_missing_info",
      label: "Pending Initialization — Missing Info",
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

  it("returns live when onchain and local metadata match", () => {
    expect(
      getClaimPrimaryStatus({
        claim: baseClaim,
        manifoldClaim: {
          instanceId: 123,
          location: "ar://example",
        },
      })
    ).toMatchObject({
      key: "live",
      label: "Live",
      tone: "success",
    });
  });

  it("returns live needs update when onchain metadata differs", () => {
    expect(
      getClaimPrimaryStatus({
        claim: baseClaim,
        manifoldClaim: {
          instanceId: 123,
          location: "ar://older",
        },
      })
    ).toMatchObject({
      key: "live_needs_update",
      label: "Live — Needs Update",
      tone: "update",
    });
  });

  it("returns diverged when initialized onchain without local metadata", () => {
    expect(
      getClaimPrimaryStatus({
        claim: {
          ...baseClaim,
          metadata_location: null,
        },
        manifoldClaim: {
          instanceId: 123,
          location: "ar://example",
        },
      })
    ).toMatchObject({
      key: "diverged",
      label: "Diverged",
      tone: "destructive",
    });
  });
});

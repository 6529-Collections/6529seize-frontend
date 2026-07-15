import {
  clampResearchTargetEditionSize,
  findBestMatchingLaunchActionName,
  getAutoSelectedLaunchPhase,
  getDefaultResearchTargetEditionSize,
  getLaunchListStatus,
  getResearchTargetEditionSizeLimit,
} from "@/components/drop-forge/launch/drop-forge-launch-claim-page-client.helpers";
import type { ClaimPrimaryStatus } from "@/components/drop-forge/drop-forge-status.helpers";
import { ManifoldClaimStatus } from "@/hooks/useManifoldClaim";

type AutoSelectedLaunchPhaseArgs = Parameters<
  typeof getAutoSelectedLaunchPhase
>[0];

// Wrapper that supplies sensible defaults for the booleans each test would
// otherwise have to pass; individual tests can override via `overrides`.
function callGetAutoSelectedLaunchPhase(
  overrides: Omit<
    AutoSelectedLaunchPhaseArgs,
    "researchAirdropCompleted" | "payArtistCompleted"
  > &
    Partial<
      Pick<
        AutoSelectedLaunchPhaseArgs,
        "researchAirdropCompleted" | "payArtistCompleted"
      >
    >
): ReturnType<typeof getAutoSelectedLaunchPhase> {
  return getAutoSelectedLaunchPhase({
    researchAirdropCompleted: false,
    payArtistCompleted: false,
    ...overrides,
  });
}

describe("getAutoSelectedLaunchPhase", () => {
  const phases = [
    {
      key: "phase0" as const,
      schedule: {
        startMs: 1_000,
        endMs: 2_000,
      },
    },
    {
      key: "phase1" as const,
      schedule: {
        startMs: 3_000,
        endMs: 4_000,
      },
    },
    {
      key: "phase2" as const,
      schedule: {
        startMs: 5_000,
        endMs: 6_000,
      },
    },
    {
      key: "publicphase" as const,
      schedule: {
        startMs: 7_000,
        endMs: 8_000,
      },
    },
  ];

  it("returns blank when metadata is not published", () => {
    expect(
      callGetAutoSelectedLaunchPhase({
        hasPublishedMetadata: false,
        isInitialized: true,
        nowMs: 1_500,
        phases,
      })
    ).toBe("");
  });

  it("keeps phase0 selected until the claim is initialized", () => {
    expect(
      callGetAutoSelectedLaunchPhase({
        hasPublishedMetadata: true,
        isInitialized: false,
        nowMs: 7_500,
        phases,
      })
    ).toBe("phase0");
  });

  it("selects phase0 before it starts and while it is active", () => {
    expect(
      callGetAutoSelectedLaunchPhase({
        hasPublishedMetadata: true,
        isInitialized: true,
        nowMs: 500,
        phases,
      })
    ).toBe("phase0");

    expect(
      callGetAutoSelectedLaunchPhase({
        hasPublishedMetadata: true,
        isInitialized: true,
        nowMs: 1_500,
        phases,
      })
    ).toBe("phase0");
  });

  it("moves to the next upcoming phase after a phase ends", () => {
    expect(
      callGetAutoSelectedLaunchPhase({
        hasPublishedMetadata: true,
        isInitialized: true,
        nowMs: 2_500,
        phases,
      })
    ).toBe("phase1");

    expect(
      callGetAutoSelectedLaunchPhase({
        hasPublishedMetadata: true,
        isInitialized: true,
        nowMs: 4_500,
        phases,
      })
    ).toBe("phase2");
  });

  it("selects public phase until it ends, then research", () => {
    expect(
      callGetAutoSelectedLaunchPhase({
        hasPublishedMetadata: true,
        isInitialized: true,
        nowMs: 7_500,
        phases,
      })
    ).toBe("publicphase");

    expect(
      callGetAutoSelectedLaunchPhase({
        hasPublishedMetadata: true,
        isInitialized: true,
        nowMs: 8_001,
        phases,
      })
    ).toBe("research");
  });

  it("does not fall back to phase0 when phase0's schedule is null but later phases still exist", () => {
    expect(
      callGetAutoSelectedLaunchPhase({
        hasPublishedMetadata: true,
        isInitialized: true,
        nowMs: 8_001,
        phases: phases.map((phase, index) =>
          index === 0 ? { ...phase, schedule: null } : phase
        ),
      })
    ).toBe("research");
  });

  it("ignores a null schedule on a later phase when an earlier valid phase still matches", () => {
    expect(
      callGetAutoSelectedLaunchPhase({
        hasPublishedMetadata: true,
        isInitialized: true,
        nowMs: 3_500,
        phases: phases.map((phase, index) =>
          index === 2 ? { ...phase, schedule: null } : phase
        ),
      })
    ).toBe("phase1");
  });
});

describe("research target edition size helpers", () => {
  it("uses the live onchain total max when it is available", () => {
    expect(getResearchTargetEditionSizeLimit(400, 250)).toBe(250);
    expect(getResearchTargetEditionSizeLimit(250, 400)).toBe(400);
  });

  it("defaults to the lower of the claim edition size and 310", () => {
    expect(getDefaultResearchTargetEditionSize(305)).toBe(305);
    expect(getDefaultResearchTargetEditionSize(500)).toBe(310);
  });

  it("defaults to the onchain cap whenever it is available", () => {
    expect(getDefaultResearchTargetEditionSize(500, 275)).toBe(275);
    expect(getDefaultResearchTargetEditionSize(250, 400)).toBe(310);
  });

  it("falls back to 310 when the claim edition size is missing", () => {
    expect(getDefaultResearchTargetEditionSize(null)).toBe(310);
    expect(getDefaultResearchTargetEditionSize(0)).toBe(310);
  });

  it("caps the research target at the claim edition size", () => {
    expect(clampResearchTargetEditionSize(310, 305)).toBe(305);
    expect(clampResearchTargetEditionSize(304.8, 305)).toBe(304);
  });

  it("caps the research target at the live onchain total max", () => {
    expect(clampResearchTargetEditionSize(310, 500, 275)).toBe(275);
    expect(clampResearchTargetEditionSize(450, 250, 400)).toBe(400);
  });

  it("keeps the research target uncapped when there is no edition size limit", () => {
    expect(clampResearchTargetEditionSize(310, null)).toBe(310);
  });
});

describe("findBestMatchingLaunchActionName", () => {
  it("does not treat pay artist as an artist airdrop action", () => {
    expect(
      findBestMatchingLaunchActionName(
        ["Pay Artist", "Artist Airdrop", "Team Airdrop"],
        "artist"
      )
    ).toBe("Artist Airdrop");
  });
});

describe("getLaunchListStatus", () => {
  const livePrimaryStatus: ClaimPrimaryStatus = {
    key: "live",
    label: "Live",
    tone: "success",
    reason: "DB, Arweave, and onchain metadata all match",
  };

  it("keeps live claims live when the current manifold phase is upcoming", () => {
    expect(
      getLaunchListStatus({
        primaryStatus: livePrimaryStatus,
        manifoldClaim: {
          status: ManifoldClaimStatus.UPCOMING,
          nextMemePhase: {
            id: "1",
            name: "Phase 1",
          },
        } as any,
        researchAirdropCompleted: false,
        payArtistCompleted: false,
      })
    ).toEqual(livePrimaryStatus);
  });

  it("keeps live claims live when manifold only exposes a next phase", () => {
    expect(
      getLaunchListStatus({
        primaryStatus: livePrimaryStatus,
        manifoldClaim: {
          status: ManifoldClaimStatus.ENDED,
          nextMemePhase: {
            id: "public",
            name: "Public Phase",
          },
        } as any,
        researchAirdropCompleted: false,
        payArtistCompleted: false,
      })
    ).toEqual(livePrimaryStatus);
  });

  it("falls back to Airdrop Research when the drop has ended and actions are loaded", () => {
    expect(
      getLaunchListStatus({
        primaryStatus: livePrimaryStatus,
        manifoldClaim: {
          status: ManifoldClaimStatus.ENDED,
        } as any,
        researchAirdropCompleted: false,
        payArtistCompleted: false,
        actionsLoaded: true,
      })
    ).toEqual({
      key: "live",
      label: "Airdrop Research",
      tone: "post_mint",
      reason: "Mint phases are complete. Research airdrop is next",
    });
  });

  it("shows Checking Onchain for ended drops while action state is still loading", () => {
    expect(
      getLaunchListStatus({
        primaryStatus: livePrimaryStatus,
        manifoldClaim: {
          status: ManifoldClaimStatus.ENDED,
        } as any,
        researchAirdropCompleted: false,
        payArtistCompleted: false,
        actionsLoaded: false,
      })
    ).toEqual({
      key: "checking_onchain",
      label: "Checking Onchain",
      tone: "pending",
      reason: "Loading post-launch action state",
    });
  });

  it("prefers Pay Artist over the loading state when research is already marked complete", () => {
    expect(
      getLaunchListStatus({
        primaryStatus: livePrimaryStatus,
        manifoldClaim: {
          status: ManifoldClaimStatus.ENDED,
        } as any,
        researchAirdropCompleted: true,
        payArtistCompleted: false,
        actionsLoaded: false,
      })
    ).toEqual({
      key: "live",
      label: "Pay Artist",
      tone: "post_mint",
      reason: "Research airdrop is complete. Artist payment remains",
    });
  });
});

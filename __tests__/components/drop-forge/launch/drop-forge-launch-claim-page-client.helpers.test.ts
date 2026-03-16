import { getAutoSelectedLaunchPhase } from "@/components/drop-forge/launch/drop-forge-launch-claim-page-client.helpers";

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
      getAutoSelectedLaunchPhase({
        hasPublishedMetadata: false,
        isInitialized: true,
        nowMs: 1_500,
        phases,
      })
    ).toBe("");
  });

  it("keeps phase0 selected until the claim is initialized", () => {
    expect(
      getAutoSelectedLaunchPhase({
        hasPublishedMetadata: true,
        isInitialized: false,
        nowMs: 7_500,
        phases,
      })
    ).toBe("phase0");
  });

  it("selects phase0 before it starts and while it is active", () => {
    expect(
      getAutoSelectedLaunchPhase({
        hasPublishedMetadata: true,
        isInitialized: true,
        nowMs: 500,
        phases,
      })
    ).toBe("phase0");

    expect(
      getAutoSelectedLaunchPhase({
        hasPublishedMetadata: true,
        isInitialized: true,
        nowMs: 1_500,
        phases,
      })
    ).toBe("phase0");
  });

  it("moves to the next upcoming phase after a phase ends", () => {
    expect(
      getAutoSelectedLaunchPhase({
        hasPublishedMetadata: true,
        isInitialized: true,
        nowMs: 2_500,
        phases,
      })
    ).toBe("phase1");

    expect(
      getAutoSelectedLaunchPhase({
        hasPublishedMetadata: true,
        isInitialized: true,
        nowMs: 4_500,
        phases,
      })
    ).toBe("phase2");
  });

  it("selects public phase until it ends, then research", () => {
    expect(
      getAutoSelectedLaunchPhase({
        hasPublishedMetadata: true,
        isInitialized: true,
        nowMs: 7_500,
        phases,
      })
    ).toBe("publicphase");

    expect(
      getAutoSelectedLaunchPhase({
        hasPublishedMetadata: true,
        isInitialized: true,
        nowMs: 8_001,
        phases,
      })
    ).toBe("research");
  });

  it("falls back to phase0 when phase0's schedule is null", () => {
    expect(
      getAutoSelectedLaunchPhase({
        hasPublishedMetadata: true,
        isInitialized: true,
        nowMs: 8_001,
        phases: phases.map((phase, index) =>
          index === 0 ? { ...phase, schedule: null } : phase
        ),
      })
    ).toBe("phase0");
  });
});

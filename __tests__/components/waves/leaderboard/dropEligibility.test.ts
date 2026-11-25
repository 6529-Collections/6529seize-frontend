import { getWaveDropEligibility } from "@/components/waves/leaderboard/dropEligibility";
import { SubmissionStatus } from "@/hooks/useWave";

describe("ended submission restrictions", () => {
  it.each([
    { isLoggedIn: true, isProxy: false, isCurationWave: false },
    { isLoggedIn: false, isProxy: false, isCurationWave: false },
    { isLoggedIn: true, isProxy: true, isCurationWave: false },
    { isLoggedIn: true, isProxy: false, isCurationWave: true },
  ])("explains a confirmed end before viewer restrictions: %j", (viewer) => {
    expect(
      getWaveDropEligibility({
        ...viewer,
        participation: {
          status: SubmissionStatus.ENDED,
          isEligible: false,
          hasReachedLimit: true,
          canSubmitNow: false,
        },
      })
    ).toEqual({
      canCreateDrop: false,
      restrictionMessage: "Submission period has ended",
      restrictionLink: null,
    });
  });

  it("keeps the permission restriction during an open submission period", () => {
    expect(
      getWaveDropEligibility({
        isLoggedIn: true,
        isProxy: false,
        isCurationWave: false,
        participation: { status: SubmissionStatus.ACTIVE, isEligible: false },
      })
    ).toMatchObject({
      canCreateDrop: false,
      restrictionMessage: "You don't have permission to submit in this wave",
    });
  });
});

describe("the move to the 6529 Network", () => {
  it.each([
    { isLoggedIn: true, isProxy: false, isCurationWave: false },
    { isLoggedIn: false, isProxy: false, isCurationWave: false },
    { isLoggedIn: true, isProxy: true, isCurationWave: true },
  ])("says entries are paused: %j", (viewer) => {
    expect(
      getWaveDropEligibility({
        ...viewer,
        participation: {
          status: SubmissionStatus.ACTIVE,
          isEligible: true,
          canSubmitNow: false,
          isPausedForMove: true,
        },
      })
    ).toEqual({
      canCreateDrop: false,
      restrictionMessage: "Paused for the move to the 6529 Network.",
      restrictionLink: null,
    });
  });

  it("still says submissions haven't started", () => {
    expect(
      getWaveDropEligibility({
        isLoggedIn: true,
        isProxy: false,
        isCurationWave: false,
        participation: {
          status: SubmissionStatus.NOT_STARTED,
          isPausedForMove: true,
        },
      }).restrictionMessage
    ).toBe("Submissions haven't started yet");
  });

  it("still says a closed period has ended", () => {
    expect(
      getWaveDropEligibility({
        isLoggedIn: true,
        isProxy: false,
        isCurationWave: false,
        participation: {
          status: SubmissionStatus.ENDED,
          isPausedForMove: true,
        },
      }).restrictionMessage
    ).toBe("Submission period has ended");
  });
});

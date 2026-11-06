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

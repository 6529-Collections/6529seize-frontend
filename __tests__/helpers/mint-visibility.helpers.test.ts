import {
  shouldShowNextMintInLatestDrop,
  shouldShowNextWinnerInComingUp,
} from "@/helpers/mint-visibility.helpers";

describe("mint visibility helpers", () => {
  it("shows latest drop next mint only when the overall mint is complete", () => {
    expect(
      shouldShowNextMintInLatestDrop({
        isMintEnded: false,
        nextMintExists: true,
      })
    ).toBe(false);

    expect(
      shouldShowNextMintInLatestDrop({
        isMintEnded: true,
        nextMintExists: true,
      })
    ).toBe(true);
  });

  it("keeps coming-up next mint visible while the overall mint is not complete", () => {
    expect(
      shouldShowNextWinnerInComingUp({
        isMintEnded: false,
        nextMintExists: true,
      })
    ).toBe(true);

    expect(
      shouldShowNextWinnerInComingUp({
        isMintEnded: true,
        nextMintExists: true,
      })
    ).toBe(false);
  });
});

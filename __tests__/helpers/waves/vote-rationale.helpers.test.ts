import { getVoteRationaleReplyMarkdown } from "@/helpers/waves/vote-rationale.helpers";

describe("getVoteRationaleReplyMarkdown", () => {
  it("uses the total-only prefix when the total and change match", () => {
    expect(getVoteRationaleReplyMarkdown({ voteTotal: 5, voteChange: 5 })).toBe(
      "Vote rationale (+5 at time of posting):\n\n"
    );
  });

  it("includes both total and change when they differ", () => {
    expect(getVoteRationaleReplyMarkdown({ voteTotal: 8, voteChange: 3 })).toBe(
      "Vote rationale (+8 total, +3 change at time of posting):\n\n"
    );
  });

  it("formats vote values for the selected locale", () => {
    expect(
      getVoteRationaleReplyMarkdown({
        voteTotal: 1234,
        voteChange: 1234,
        locale: "de-DE",
      })
    ).toBe("Vote rationale (+1.234 at time of posting):\n\n");
  });
});

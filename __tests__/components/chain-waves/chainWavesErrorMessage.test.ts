import { chainWavesErrorMessage } from "@/components/chain-waves/chainWavesErrorMessage";
import { ChainOperationError } from "@/lib/chain-identity/operation";

const refused = (name: string) =>
  new ChainOperationError(
    "failed",
    `The 6529 Network refused this change: ${name}.`,
    name
  );

describe("chainWavesErrorMessage", () => {
  it.each([
    ["OVER_CREDIT", "You don't have enough voting credit for this vote."],
    ["VOTING_CLOSED", "Voting is closed in this decision."],
    [
      "STALE_VERSION",
      "This changed on the 6529 Network since you opened it. Try again.",
    ],
    ["POLL_CLOSED", "This poll is closed."],
  ])("says %s in plain words", (name, sentence) => {
    expect(chainWavesErrorMessage("en-US", refused(name))).toBe(sentence);
  });

  it("reads the name from the gateway's wording when the error carries no name", () => {
    expect(
      chainWavesErrorMessage(
        "en-US",
        new Error("refused: 0x2603 OVER_CREDIT, detail 0")
      )
    ).toBe("You don't have enough voting credit for this vote.");
  });

  it("words other refusals as the identity flows do", () => {
    expect(chainWavesErrorMessage("en-US", refused("SELF_RATING"))).not.toMatch(
      /SELF_RATING/
    );
  });

  it("is null when the wallet prompt was declined", () => {
    expect(
      chainWavesErrorMessage(
        "en-US",
        Object.assign(new Error("User rejected the request."), { code: 4001 })
      )
    ).toBeNull();
  });
});

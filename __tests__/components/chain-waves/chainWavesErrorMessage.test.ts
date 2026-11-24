import {
  chainWavesErrorMessage,
  chainWriteDetails,
  chainWriteFailure,
} from "@/components/chain-waves/chainWavesErrorMessage";
import { ChainOperationError } from "@/lib/chain-identity/operation";

const CHARGED = "The change didn't go through, and its fee was still charged.";

/** A refusal from a block: the chain ran the write and charged its fee. */
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
    ["DECISION_NOT_OPEN", "This decision isn't open."],
    ["ENTRY_NOT_IN_DECISION", "This entry isn't in this decision."],
  ])(
    "says %s in plain words, and that the fee was charged",
    (name, sentence) => {
      expect(chainWavesErrorMessage("en-US", refused(name))).toBe(
        `${CHARGED} ${sentence}`
      );
    }
  );

  it("says nothing of a fee for a refusal before anything was sent", () => {
    expect(
      chainWavesErrorMessage(
        "en-US",
        new ChainOperationError(
          "rejected",
          "Voting is closed in this decision."
        )
      )
    ).toBe("Voting is closed in this decision.");
  });

  it.each([
    ["vote", "You can't vote in this decision."],
    ["ballot", "You can't answer this poll."],
    ["rating", "You can't rate this wave."],
  ] as const)("words NOT_ELIGIBLE for a %s", (write, sentence) => {
    expect(
      chainWavesErrorMessage("en-US", refused("NOT_ELIGIBLE"), write)
    ).toBe(`${CHARGED} ${sentence}`);
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

describe("chainWriteFailure and chainWriteDetails", () => {
  it("gives the chain's reason and no second line for a write that went there", () => {
    const error = refused("OVER_CREDIT");
    expect(chainWriteFailure("en-US", error, "Please try again.")).toBe(
      `${CHARGED} You don't have enough voting credit for this vote.`
    );
    // 6529.io's sanitizer would read "6529 Network" as a connection error.
    expect(chainWriteDetails(error)).toBeUndefined();
    expect(
      chainWriteDetails(
        new ChainOperationError(
          "rejected",
          "None of this identity's wallets holds TDH, so it has no ballot in this poll."
        )
      )
    ).toBeUndefined();
  });

  it("keeps 6529.io's own wording for a write that didn't go to the chain", () => {
    const error = new Error("Request failed with status 500");
    expect(chainWriteFailure("en-US", error, "Please try again.")).toBe(
      "Please try again."
    );
    expect(chainWriteDetails(error)).not.toBeUndefined();
  });
});

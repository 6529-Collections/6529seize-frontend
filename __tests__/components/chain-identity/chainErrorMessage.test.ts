import {
  chainErrorMessage,
  chainFailureText,
  chainRatingFailureText,
  chainRefusalName,
  isFeeShortfall,
} from "@/components/chain-identity/chainErrorMessage";
import { ChainGatewayError } from "@/lib/chain-identity/gateway";
import { ChainOperationError } from "@/lib/chain-identity/operation";
import { ChainRelayError } from "@/lib/chain-identity/relay";

const L = "en-US" as const;

describe("the 6529 Network's refusals in plain words", () => {
  it("reads the chain's name exactly, never a longer name that contains it", () => {
    const window = new ChainGatewayError(
      422,
      "inadmissible",
      "0x0381 NONCE_WINDOW, detail 0"
    );
    expect(chainRefusalName(window)).toBe("NONCE_WINDOW");
    const legacy = new ChainGatewayError(
      422,
      "inadmissible",
      "0x2107 LEGACY_EXPIRED, detail 0"
    );
    expect(chainRefusalName(legacy)).toBe("LEGACY_EXPIRED");
    expect(chainErrorMessage(L, legacy)).toBe(
      "The 6529 Network refused this change. Its reason code is LEGACY_EXPIRED. Reload the page and try again."
    );
  });

  it("words the refusals a person can act on", () => {
    expect(
      chainErrorMessage(
        L,
        new ChainOperationError("failed", "refused", "OVER_RATING_BUDGET")
      )
    ).toBe("That is more than your TDH lets you give.");
    expect(
      chainErrorMessage(
        L,
        new ChainGatewayError(
          422,
          "inadmissible",
          "0x210E REJOIN_WAIT, detail 1"
        )
      )
    ).toBe(
      "That wallet left another identity recently. It has to wait before it joins a different identity or creates one."
    );
    // The relay words a refusal its own way, with the chain's code inside.
    expect(
      chainErrorMessage(
        L,
        new Error(
          "The 6529 Network refused the operation: 0x2101 ADDRESS_BOUND, detail 1"
        )
      )
    ).toBe("That wallet already belongs to an identity.");
    expect(
      chainErrorMessage(
        L,
        new ChainGatewayError(422, "inadmissible", "0x2112 REMOVE_NOT_SELF")
      )
    ).toBe(
      'For now only the wallet that is leaving can sign this. Switch to that wallet and use "Leave this identity" on its row.'
    );
    expect(
      chainErrorMessage(
        L,
        new ChainOperationError("failed", "refused", "LAST_WALLET")
      )
    ).toBe("An identity's last wallet can't leave it.");
    expect(
      chainErrorMessage(
        L,
        new ChainOperationError("failed", "refused", "IDENTITY_FULL")
      )
    ).toBe(
      "Your identity has as many wallets as the 6529 Network allows. One of its wallets has to leave before you can add another."
    );
  });

  it("says what went wrong with the gateway itself", () => {
    expect(
      chainErrorMessage(L, new ChainGatewayError(0, "network", "no answer"))
    ).toBe("The 6529 Network didn't answer. Try again in a minute.");
    expect(
      chainErrorMessage(L, new ChainGatewayError(429, "rate_limited", "slow"))
    ).toBe("Too many requests. Wait a minute and try again.");
    expect(
      chainErrorMessage(L, new ChainGatewayError(503, "busy", "busy"))
    ).toBe("The 6529 Network is busy. Try again in a minute.");
    expect(chainErrorMessage(L, new Error("socket hang up"))).toBe(
      "Something went wrong. Try again."
    );
  });

  it("treats a declined wallet prompt as no change", () => {
    const declined = Object.assign(new Error("User rejected the request."), {
      code: 4001,
    });
    expect(chainErrorMessage(L, declined)).toBeNull();
    expect(chainFailureText(L, declined)).toBe(
      "You declined in your wallet. Nothing changed."
    );
  });

  it("says the fee was paid only when the chain ran the change and it failed", () => {
    const ran = new ChainOperationError("failed", "refused", "STALE_VERSION");
    expect(chainFailureText(L, ran)).toBe(
      "The change didn't go through, and its fee was still charged. This changed since the page loaded. Reload and try again."
    );
    const refused = new ChainGatewayError(
      422,
      "inadmissible",
      "0x2103 HANDLE_TAKEN, detail 1"
    );
    expect(chainFailureText(L, refused)).toBe(
      "Nothing changed. That handle is taken."
    );
  });

  it("points a profile page's rater to fees when the identity can't pay", () => {
    const short = new ChainGatewayError(
      422,
      "inadmissible",
      "0x0305 FEE_UNCOVERED, detail 0"
    );
    expect(chainRatingFailureText(L, short)).toBe(
      "Nothing changed. Not enough $fake6529 to pay the fee. Get $fake6529 for fees on your identity page."
    );
  });
});

describe("a fee the chain wouldn't take, by its cause", () => {
  const refusal = (detail: number) =>
    new ChainGatewayError(
      422,
      "inadmissible",
      `0x0305 FEE_UNCOVERED, detail ${detail}`
    );
  it("tells a short balance from a fee limit and a browser key's budget", () => {
    // detail 0: the payer's balance doesn't cover the fee.
    expect(chainErrorMessage(L, refusal(0))).toBe(
      "Not enough $fake6529 to pay the fee."
    );
    expect(isFeeShortfall(refusal(0))).toBe(true);
    // Header field 13, maxFee: the limit signed is below the fee now.
    expect(chainErrorMessage(L, refusal((0x100 + 13) * 0x10000))).toBe(
      "Fees rose past the most this change allowed. Try again."
    );
    expect(isFeeShortfall(refusal((0x100 + 13) * 0x10000))).toBe(false);
    // Header field 5, authRef: the browser key's fee budget is spent.
    expect(chainErrorMessage(L, refusal((0x100 + 5) * 0x10000))).toBe(
      "This browser's key has used up its fee budget. Turn its key off and on again on your identity page."
    );
    expect(isFeeShortfall(refusal((0x100 + 5) * 0x10000))).toBe(false);
  });
});

describe("errors that aren't the 6529 Network's", () => {
  it("words 6529.io's relay as 6529.io, never as the network", () => {
    expect(chainErrorMessage(L, new ChainRelayError(401, "x"))).toBe(
      "Sign in to 6529.io with this wallet, then try again."
    );
    expect(chainErrorMessage(L, new ChainRelayError(404, "x"))).toBe(
      "This request is no longer open: it was withdrawn, it expired, or it already went through."
    );
    expect(chainErrorMessage(L, new ChainRelayError(400, "x", true))).toBe(
      "6529.io couldn't keep this request. Try again, or sign with another wallet app."
    );
    expect(chainErrorMessage(L, new ChainRelayError(502, "x"))).toBe(
      "6529.io couldn't reach the 6529 Network. Try again in a minute."
    );
    expect(chainErrorMessage(L, new ChainRelayError(503, "x"))).toBe(
      "6529.io isn't answering right now. Try again in a minute."
    );
  });

  it("words this site's own refusals from the copy file", () => {
    expect(
      chainErrorMessage(
        L,
        new ChainOperationError("signer_mismatch", "x", "WRONG_WALLET", {
          wallet: "0x0000…00aa",
        })
      )
    ).toBe("Switch your wallet app to 0x0000…00aa and try again.");
    expect(
      chainErrorMessage(L, new ChainOperationError("draft_mismatch", "x"))
    ).toBe(
      "6529.io couldn't confirm this change before signing, so nothing was signed. Try again."
    );
    expect(chainErrorMessage(L, new ChainOperationError("timeout", "x"))).toBe(
      "The change was sent but isn't final yet. Check again in a few minutes."
    );
  });

  it("says the fee when it is above what this browser's key signs on its own", () => {
    const aboveCap = new ChainOperationError("fee_above_cap", "x", null, {
      maxFee: "412500000000000001",
    });
    expect(chainFailureText(L, aboveCap)).toBe(
      "Nothing changed. The fee, at most 0.412501 $fake6529, is more than this browser's key signs on its own. Sign this change with your wallet."
    );
  });
});

it("tells a profile page's rater, before any prompt, that the identity can't pay", () => {
  expect(
    chainRatingFailureText(
      L,
      new ChainOperationError("rejected", "x", "IDENTITY_FEE_SHORT")
    )
  ).toBe(
    "Nothing changed. Your identity doesn't have enough $fake6529 for this rating's fee. Get $fake6529 for fees on your identity page."
  );
});

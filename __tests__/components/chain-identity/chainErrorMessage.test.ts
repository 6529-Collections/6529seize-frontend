import {
  chainErrorMessage,
  chainFailureText,
  chainRatingFailureText,
  chainRefusalName,
} from "@/components/chain-identity/chainErrorMessage";
import { ChainGatewayError } from "@/lib/chain-identity/gateway";
import { ChainOperationError } from "@/lib/chain-identity/operation";

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
      "The 6529 Network refused this change (LEGACY_EXPIRED)."
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
    ).toBe("That wallet left an identity too recently to join one again yet.");
    // The relay words a refusal its own way, with the chain's code inside.
    expect(
      chainErrorMessage(
        L,
        new Error(
          "The 6529 Network refused the operation: 0x2101 ADDRESS_BOUND, detail 1"
        )
      )
    ).toBe("That wallet already belongs to an identity.");
  });

  it("says what went wrong with the gateway itself", () => {
    expect(
      chainErrorMessage(L, new ChainGatewayError(0, "network", "no answer"))
    ).toBe("The 6529 Network gateway did not answer. Try again in a minute.");
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
      "The change didn't go through, and its fee was paid. This changed since the page loaded. Reload and try again."
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

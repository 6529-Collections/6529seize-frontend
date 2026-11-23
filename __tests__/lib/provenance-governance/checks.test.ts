/**
 * @jest-environment node
 */
import { registryPins } from "@/lib/provenance-core/config/registries";
import {
  buildGovernanceSafeTxs,
  type GovernanceCheck,
} from "@/lib/provenance-core/governance";
import { errorText, signingProblems } from "@/lib/provenance-governance/checks";

const pin = registryPins[1]!;
const ok: GovernanceCheck = {
  ownerIsPinnedSafe: true,
  signerIsSafeOwner: true,
  safeNonce: 19n,
  nonce: "current",
  pendingOwnerIsSafe: false,
  problems: [],
};
const [freeze] = buildGovernanceSafeTxs(pin, [{ kind: "freeze" }], 19n);
const [accept] = buildGovernanceSafeTxs(
  pin,
  [{ kind: "acceptOwnership" }],
  19n
);

describe("signingProblems", () => {
  it("passes a current, owned, signed SafeTx", () => {
    expect(signingProblems(ok, freeze!)).toEqual([]);
  });
  it("names every failed check", () => {
    expect(
      signingProblems(
        {
          ...ok,
          ownerIsPinnedSafe: false,
          signerIsSafeOwner: false,
          nonce: "used",
          safeNonce: 21n,
        },
        freeze!
      )
    ).toEqual([
      { key: "provenance.governance.sign.problem.owner" },
      { key: "provenance.governance.sign.problem.signer" },
      {
        key: "provenance.governance.sign.problem.nonce",
        nonce: "19",
        current: "21",
      },
    ]);
  });
  it("checks the pending owner, not the owner, for acceptOwnership", () => {
    expect(
      signingProblems({ ...ok, ownerIsPinnedSafe: false }, accept!)
    ).toEqual([{ key: "provenance.governance.sign.problem.pendingOwner" }]);
    expect(
      signingProblems(
        { ...ok, ownerIsPinnedSafe: false, pendingOwnerIsSafe: true },
        accept!
      )
    ).toEqual([]);
  });
});

describe("errorText", () => {
  it("prefers viem's details, then its short message", () => {
    expect(errorText({ details: "d", shortMessage: "s", message: "m" })).toBe(
      "d"
    );
    expect(errorText({ shortMessage: "s", message: "m" })).toBe("s");
    expect(errorText(new Error("m"))).toBe("m");
    expect(errorText("plain")).toBe("plain");
  });
});

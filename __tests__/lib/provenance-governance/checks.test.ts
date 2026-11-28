/**
 * @jest-environment node
 */
import { registryPins } from "@/lib/provenance-core/config/registries";
import {
  buildGovernanceSafeTxs,
  decodeGovernanceSafeTx,
  type GovernanceCheck,
  type GovernanceSafeTx,
} from "@/lib/provenance-core/governance";
import { errorText, signingProblems } from "@/lib/provenance-governance/checks";

const pin = registryPins[1]!;
const [freeze] = buildGovernanceSafeTxs(pin, [{ kind: "freeze" }], 19n);
const [accept] = buildGovernanceSafeTxs(
  pin,
  [{ kind: "acceptOwnership" }],
  19n
);

/** A check that passes, as checkBeforeSigning reports it for `g`. */
function passing(g: GovernanceSafeTx): GovernanceCheck {
  const decoded = decodeGovernanceSafeTx(pin, g.tx);
  return {
    chainId: pin.chainId,
    block: 100n,
    decoded,
    risk: decoded.some((c) => c.risk === "high") ? "high" : "normal",
    knownBuild: true,
    safeVersion: "1.4.1",
    ownerIsPinnedSafe: true,
    signerIsSafeOwner: true,
    safeNonce: 19n,
    nonce: "current",
    pendingOwnerIsSafe: false,
    problems: [],
  };
}
const ok = passing(freeze!);

describe("signingProblems", () => {
  it("passes a current, owned, signed SafeTx", () => {
    expect(signingProblems(ok, pin, freeze!)).toEqual([]);
  });

  it("names every failed check", () => {
    const check: GovernanceCheck = {
      ...ok,
      knownBuild: false,
      safeVersion: "1.1.1",
      ownerIsPinnedSafe: false,
      signerIsSafeOwner: false,
      nonce: "used",
      safeNonce: 21n,
      problems: ["build", "version", "owner", "signer", "nonce"],
    };
    expect(signingProblems(check, pin, freeze!)).toEqual([
      { key: "provenance.governance.sign.problem.build" },
      {
        key: "provenance.governance.sign.problem.safeVersion",
        version: "1.1.1",
      },
      { key: "provenance.governance.sign.problem.owner" },
      { key: "provenance.governance.sign.problem.signer" },
      {
        key: "provenance.governance.sign.problem.nonce",
        nonce: "19",
        current: "21",
      },
    ]);
  });

  it("names a Safe whose version could not be read", () => {
    expect(
      signingProblems(
        { ...ok, safeVersion: undefined, problems: ["version"] },
        pin,
        freeze!
      )
    ).toEqual([
      { key: "provenance.governance.sign.problem.safeVersionUnreadable" },
    ]);
  });

  it("checks the pending owner, not the owner, for acceptOwnership", () => {
    const accepting = passing(accept!);
    expect(
      signingProblems(
        { ...accepting, ownerIsPinnedSafe: false, problems: ["pending"] },
        pin,
        accept!
      )
    ).toEqual([{ key: "provenance.governance.sign.problem.pendingOwner" }]);
    expect(
      signingProblems(
        { ...accepting, ownerIsPinnedSafe: false, pendingOwnerIsSafe: true },
        pin,
        accept!
      )
    ).toEqual([]);
  });

  it("decides from the decoded calldata, not the actions listed with the SafeTx", () => {
    // The calldata accepts ownership; the listed actions say freeze and normal risk.
    const listed: GovernanceSafeTx = {
      ...accept!,
      actions: freeze!.actions,
      risk: "normal",
    };
    const check: GovernanceCheck = {
      ...passing(accept!),
      ownerIsPinnedSafe: false,
      problems: ["calls", "risk", "pending"],
    };
    expect(signingProblems(check, pin, listed)).toEqual([
      { key: "provenance.governance.sign.problem.calls" },
      { key: "provenance.governance.sign.problem.risk" },
      { key: "provenance.governance.sign.problem.pendingOwner" },
    ]);
  });

  it("names a hash that is not the SafeTx's hash", () => {
    const g: GovernanceSafeTx = { ...freeze!, hash: accept!.hash };
    expect(signingProblems({ ...ok, problems: ["hash"] }, pin, g)).toEqual([
      { key: "provenance.governance.sign.problem.hash" },
    ]);
  });

  it("keeps the package's words for a broken SafeTx schema rule", () => {
    const g: GovernanceSafeTx = {
      ...freeze!,
      tx: { ...freeze!.tx, value: 1n },
    };
    const problems = signingProblems(
      { ...ok, problems: ["value", "hash"] },
      pin,
      g
    );
    expect(problems[0]).toEqual({
      key: "provenance.governance.sign.problem.rule",
      detail: "value is not 0",
    });
    expect(problems.at(-1)).toEqual({
      key: "provenance.governance.sign.problem.hash",
    });
  });

  it("shows a problem it does not name in the package's own words", () => {
    expect(
      signingProblems(
        { ...ok, problems: ["A rule from a newer package."] },
        pin,
        freeze!
      )
    ).toEqual([
      {
        key: "provenance.governance.sign.problem.rule",
        detail: "A rule from a newer package.",
      },
    ]);
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

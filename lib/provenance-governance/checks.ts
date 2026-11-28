import "@/i18n/namespaces/provenance-governance";
import { encodeAction } from "@/lib/provenance-core/actions";
import type { RegistryPin } from "@/lib/provenance-core/config/registries";
import {
  checkGovernanceSafeTx,
  safeVersionAtLeast130,
  type GovernanceCheck,
  type GovernanceSafeTx,
} from "@/lib/provenance-core/governance";
import { safeTxHash } from "@/lib/provenance-core/safe";

/** A reason signing is blocked, as a message key with its values. */
export type SigningProblem =
  | { key: "provenance.governance.sign.problem.rule"; detail: string }
  | { key: "provenance.governance.sign.problem.calls" }
  | { key: "provenance.governance.sign.problem.risk" }
  | { key: "provenance.governance.sign.problem.hash" }
  | { key: "provenance.governance.sign.problem.build" }
  | { key: "provenance.governance.sign.problem.safeVersion"; version: string }
  | { key: "provenance.governance.sign.problem.safeVersionUnreadable" }
  | { key: "provenance.governance.sign.problem.owner" }
  | { key: "provenance.governance.sign.problem.pendingOwner" }
  | { key: "provenance.governance.sign.problem.signer" }
  | {
      key: "provenance.governance.sign.problem.nonce";
      nonce: string;
      current: string;
    };

function sameCalls(check: GovernanceCheck, g: GovernanceSafeTx): boolean {
  const listed = g.actions.map((a) => encodeAction(a).toLowerCase());
  const real = check.decoded.map((c) => encodeAction(c.action).toLowerCase());
  return listed.length === real.length && listed.every((d, i) => d === real[i]);
}

/** Problems with the SafeTx itself: its schema rules, its listed calls and risk, its hash. */
function safeTxProblems(
  check: GovernanceCheck,
  pin: RegistryPin,
  g: GovernanceSafeTx
): SigningProblem[] {
  const out: SigningProblem[] = checkGovernanceSafeTx(pin, g.tx).map(
    (detail) => ({ key: "provenance.governance.sign.problem.rule", detail })
  );
  if (check.decoded.length > 0) {
    if (!sameCalls(check, g))
      out.push({ key: "provenance.governance.sign.problem.calls" });
    if (g.risk !== check.risk)
      out.push({ key: "provenance.governance.sign.problem.risk" });
  }
  if (
    safeTxHash(pin.chainId, pin.safe, g.tx).toLowerCase() !==
    g.hash.toLowerCase()
  )
    out.push({ key: "provenance.governance.sign.problem.hash" });
  return out;
}

/** Problems with the chain: the registry's build and owner, the Safe's version, signers and nonce. */
function chainProblems(
  check: GovernanceCheck,
  g: GovernanceSafeTx
): SigningProblem[] {
  const out: SigningProblem[] = [];
  if (!check.knownBuild)
    out.push({ key: "provenance.governance.sign.problem.build" });
  if (!safeVersionAtLeast130(check.safeVersion)) {
    out.push(
      check.safeVersion === undefined
        ? { key: "provenance.governance.sign.problem.safeVersionUnreadable" }
        : {
            key: "provenance.governance.sign.problem.safeVersion",
            version: check.safeVersion,
          }
    );
  }
  const accepting = check.decoded.some(
    (c) => c.action.kind === "acceptOwnership"
  );
  if (accepting ? check.pendingOwnerIsSafe !== true : !check.ownerIsPinnedSafe)
    out.push({
      key: accepting
        ? "provenance.governance.sign.problem.pendingOwner"
        : "provenance.governance.sign.problem.owner",
    });
  if (!check.signerIsSafeOwner)
    out.push({ key: "provenance.governance.sign.problem.signer" });
  if (check.nonce === "used") {
    out.push({
      key: "provenance.governance.sign.problem.nonce",
      nonce: g.tx.nonce.toString(),
      current: check.safeNonce.toString(),
    });
  }
  return out;
}

/**
 * The localizable reasons a check blocks signing, one for each problem `checkBeforeSigning` lists
 * and in the same order. Everything is decided from the check, which decodes the SafeTx's own
 * calldata: for acceptOwnership the registry's pending owner must be the Safe; for every other
 * call its owner must be. A rule of the SafeTx schema keeps the package's own wording.
 */
export function signingProblems(
  check: GovernanceCheck,
  pin: RegistryPin,
  g: GovernanceSafeTx
): SigningProblem[] {
  const out = [...safeTxProblems(check, pin, g), ...chainProblems(check, g)];
  // A newer package rule this list does not name still blocks signing, so its problems are shown
  // in the package's own words rather than blocking without a reason.
  for (const detail of check.problems.slice(out.length))
    out.push({ key: "provenance.governance.sign.problem.rule", detail });
  return out;
}

/** The message shown for any thrown value: viem's details first, then its short message. */
export function errorText(e: unknown): string {
  if (typeof e === "object" && e !== null) {
    const x = e as {
      details?: unknown;
      shortMessage?: unknown;
      message?: unknown;
    };
    for (const v of [x.details, x.shortMessage, x.message])
      if (typeof v === "string" && v !== "") return v;
  }
  return String(e);
}

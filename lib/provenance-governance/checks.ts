import "@/i18n/namespaces/provenance-governance";
import type {
  GovernanceCheck,
  GovernanceSafeTx,
} from "@/lib/provenance-core/governance";

/** A reason signing is blocked, as a message key with its values. */
type SigningProblem =
  | { key: "provenance.governance.sign.problem.owner" }
  | { key: "provenance.governance.sign.problem.pendingOwner" }
  | { key: "provenance.governance.sign.problem.signer" }
  | {
      key: "provenance.governance.sign.problem.nonce";
      nonce: string;
      current: string;
    };

/**
 * The localizable reasons a check blocks signing. For acceptOwnership the registry's pending
 * owner must be the Safe; for every other call its owner must be.
 */
export function signingProblems(
  check: GovernanceCheck,
  g: GovernanceSafeTx
): SigningProblem[] {
  const out: SigningProblem[] = [];
  const accepting = g.actions.some((a) => a.kind === "acceptOwnership");
  if (accepting && check.pendingOwnerIsSafe !== true)
    out.push({ key: "provenance.governance.sign.problem.pendingOwner" });
  if (!accepting && !check.ownerIsPinnedSafe)
    out.push({ key: "provenance.governance.sign.problem.owner" });
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

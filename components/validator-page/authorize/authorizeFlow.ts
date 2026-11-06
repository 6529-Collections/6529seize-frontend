// The phone page's decisions, kept out of the hook so each stays small.

import { UserRejectedRequestError } from "viem";

import type { Draft } from "@/lib/validator-page/authorize/draftLink";
import {
  checkTypedData,
  grantDigest,
  type GrantTypedData,
} from "@/lib/validator-page/authorize/typedData";

/** True for "the holder said no in the wallet", however the wallet says it. */
export function isUserRejection(error: unknown): boolean {
  let current: unknown = error;
  for (let depth = 0; depth < 5; depth += 1) {
    if (current instanceof UserRejectedRequestError) {
      return true;
    }
    if (typeof current !== "object" || current === null) {
      return false;
    }
    const fields = current as Record<string, unknown>;
    if (
      fields["name"] === "UserRejectedRequestError" ||
      fields["code"] === 4001 ||
      fields["code"] === "4001"
    ) {
      return true;
    }
    current = fields["cause"];
  }
  return false;
}

export type GrantReview = {
  readonly grant: GrantTypedData;
  /** Empty when the draft is exactly a 6529 Validator authorization. */
  readonly problems: readonly string[];
};

/**
 * The link's draft as typed data, checked as the validator's own page checks
 * a draft before any wallet sees it.
 */
export function reviewDraft(draft: Draft): GrantReview {
  const grant = JSON.parse(draft.typedDataJson) as GrantTypedData;
  const problems = checkTypedData(grant, {
    account: draft.account,
    network: draft.network,
    sessionKeys: draft.keys.filter((key) => key.mine).map((key) => key.pubkey),
  });
  if (problems.length === 0) {
    try {
      grantDigest(grant);
    } catch {
      problems.push("Its EIP-712 digest can't be worked out.");
    }
  }
  return { grant, problems };
}

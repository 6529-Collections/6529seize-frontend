import type { MessageKey } from "@/i18n/messages";
import type { E2eeEligibilityReason } from "@/lib/e2ee/types";
import type { E2eeEligibilityState } from "./useE2eeEligibility";

const STATUS_KEYS: Record<E2eeEligibilityState, MessageKey> = {
  OK: "e2ee.new.eligibility.OK",
  POLICY: "e2ee.new.eligibility.POLICY",
  BLOCKED: "e2ee.new.eligibility.BLOCKED",
  NO_DEVICES: "e2ee.new.eligibility.NO_DEVICES",
  checking: "e2ee.new.eligibility.checking",
  error: "e2ee.new.eligibility.error",
};

const POLICY_REASON_KEYS: Partial<Record<E2eeEligibilityReason, MessageKey>> = {
  DM_RECIPIENT_PEOPLE_I_FOLLOW_ONLY:
    "e2ee.new.eligibility.POLICY.peopleIFollowOnly",
  DM_RECIPIENT_GROUP_MEMBERS_ONLY:
    "e2ee.new.eligibility.POLICY.groupMembersOnly",
};

/**
 * Copy for one person's eligibility. POLICY names the recipient's rule when
 * the API reports it (people they follow, members of a group they chose);
 * otherwise, including when they blocked the viewer, it stays the generic
 * "doesn't accept messages from you". BLOCKED is only the viewer's own block.
 */
export function getE2eeEligibilityKey(
  status: E2eeEligibilityState,
  reason: E2eeEligibilityReason | null | undefined
): MessageKey {
  if (status === "POLICY" && reason) {
    return POLICY_REASON_KEYS[reason] ?? STATUS_KEYS.POLICY;
  }
  return STATUS_KEYS[status];
}

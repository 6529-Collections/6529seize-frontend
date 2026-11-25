import type { WaveEligibility } from "@/contexts/wave/WaveEligibilityContext";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import { DropClientDeliveryState } from "@/helpers/waves/drop.helpers";
import { ChatRestriction } from "@/hooks/useDropPriviledges";

/** Open replies and slow mode can permit starting a reply while chat is blocked. */
export function isDropReplyEligible(
  drop: {
    readonly wave: Pick<
      ApiDrop["wave"],
      | "authenticated_user_eligible_to_chat"
      | "authenticated_user_eligible_to_reply"
    >;
  },
  eligibility: Partial<WaveEligibility> | null
): boolean {
  const canChat =
    eligibility?.authenticated_user_eligible_to_chat ??
    drop.wave.authenticated_user_eligible_to_chat;
  const canReply =
    eligibility?.authenticated_user_eligible_to_reply ??
    drop.wave.authenticated_user_eligible_to_reply;
  return (
    canChat === true ||
    canReply === true ||
    eligibility?.authenticated_user_chat_restriction ===
      ChatRestriction.SLOW_MODE
  );
}

/** Only posted, available drops from the current wave can become a target. */
export function isDropReplyTargetAvailable(
  drop: Pick<ApiDrop, "id" | "wave"> & {
    readonly clientDeliveryState?: DropClientDeliveryState | undefined;
  },
  waveId: string
): boolean {
  return (
    drop.wave.id === waveId &&
    !drop.id.startsWith("temp-") &&
    drop.clientDeliveryState !== DropClientDeliveryState.MODERATION_REJECTED
  );
}

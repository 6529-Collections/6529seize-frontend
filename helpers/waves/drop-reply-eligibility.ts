import type { WaveEligibility } from "@/contexts/wave/WaveEligibilityContext";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import { ChatRestriction } from "@/hooks/useDropPriviledges";

/** Open replies and slow mode can permit starting a reply while chat is blocked. */
export function isDropReplyEligible(
  drop: Pick<ApiDrop, "wave">,
  eligibility: WaveEligibility | null
): boolean {
  const canChat =
    eligibility?.authenticated_user_eligible_to_chat ??
    drop.wave.authenticated_user_eligible_to_chat;
  const canReply =
    eligibility?.authenticated_user_eligible_to_reply ??
    drop.wave.authenticated_user_eligible_to_reply;
  return (
    canChat !== false ||
    canReply === true ||
    eligibility?.authenticated_user_chat_restriction ===
      ChatRestriction.SLOW_MODE
  );
}

"use client";

import { useContentModerationDropGateContext } from "@/components/content-moderation/ContentModerationDropGateContext";
import { ApiDropModerationStatus } from "@/generated/models/ApiDropModerationStatus";
import {
  DropClientDeliveryState,
  type ExtendedDrop,
} from "@/helpers/waves/drop.helpers";

export const useWaveDropModerationPresentation = (
  drop: Pick<ExtendedDrop, "clientDeliveryState">,
  showInteractions: boolean
) => {
  const moderationGate = useContentModerationDropGateContext();
  const isModerationRejected =
    drop.clientDeliveryState === DropClientDeliveryState.MODERATION_REJECTED;
  const isGloballyUnavailable =
    moderationGate?.globalModerationStatus !== null &&
    moderationGate?.globalModerationStatus !== undefined &&
    moderationGate.globalModerationStatus !== ApiDropModerationStatus.Visible;

  return {
    isModerationRejected,
    effectiveShowInteractions:
      showInteractions && !isModerationRejected && !isGloballyUnavailable,
  };
};

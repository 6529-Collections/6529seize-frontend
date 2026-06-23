import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import type { ActiveDropState } from "@/types/dropInteractionTypes";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import type { ImageScale } from "@/helpers/image.helpers";
import React from "react";
import { useDropInteractionRules } from "@/hooks/drops/useDropInteractionRules";
import OngoingParticipationDrop from "./OngoingParticipationDrop";
import EndedParticipationDrop from "./EndedParticipationDrop";
import type {
  DropIdentityMode,
  DropInteractionParams,
  DropLocation,
  DropTimestampLayout,
} from "../drop.types";

interface DefaultParticipationDropProps {
  readonly drop: ExtendedDrop;
  readonly showWaveInfo: boolean;
  readonly activeDrop: ActiveDropState | null;
  readonly showReplyAndQuote: boolean;
  readonly location: DropLocation;
  readonly onReply: (param: DropInteractionParams) => void;
  readonly onQuoteClick: (drop: ApiDrop) => void;
  readonly onDropContentClick?: ((drop: ExtendedDrop) => void) | undefined;
  readonly parentContainerRef?: React.RefObject<HTMLElement | null> | undefined;
  readonly footer?: React.ReactNode;
  readonly identityMode?: DropIdentityMode | undefined;
  readonly timestampLayout?: DropTimestampLayout | undefined;
  readonly showInteractions?: boolean | undefined;
  readonly inlineAuthorOnDesktop?: boolean | undefined;
  readonly mediaImageScale?: ImageScale | undefined;
  readonly fullWidthMedia?: boolean | undefined;
  readonly fullWidthLinkPreviews?: boolean | undefined;
  readonly winningThreshold?: number | null | undefined;
  readonly winningThresholdMinDurationMs?: number | null | undefined;
  readonly isVotingClosed?: boolean | undefined;
  readonly isVotingControlsLocked?: boolean | undefined;
}

export default function ParticipationDrop(
  props: DefaultParticipationDropProps
) {
  const { drop, winningThreshold } = props;
  const { isVotingEnded } = useDropInteractionRules(drop);
  const hasWinningThreshold =
    typeof winningThreshold === "number" &&
    Number.isFinite(winningThreshold) &&
    winningThreshold > 0;

  // Render either the ongoing or ended drop component based on the voting state
  if (isVotingEnded) {
    if (hasWinningThreshold) {
      return <OngoingParticipationDrop {...props} isVotingClosed={true} />;
    }

    return <EndedParticipationDrop {...props} />;
  }

  return <OngoingParticipationDrop {...props} />;
}

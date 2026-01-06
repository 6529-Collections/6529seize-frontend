import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import type { ActiveDropState } from "@/types/dropInteractionTypes";
import type { DropInteractionParams, DropLocation } from "../Drop";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import React from "react";
import { useDropInteractionRules } from "@/hooks/drops/useDropInteractionRules";
import OngoingParticipationDrop from "./OngoingParticipationDrop";
import EndedParticipationDrop from "./EndedParticipationDrop";

interface DefaultParticipationDropProps {
  readonly drop: ExtendedDrop;
  readonly showWaveInfo: boolean;
  readonly activeDrop: ActiveDropState | null;
  readonly showReplyAndQuote: boolean;
  readonly location: DropLocation;
  readonly onReply: (param: DropInteractionParams) => void;
  readonly onQuote: (param: DropInteractionParams) => void;
  readonly onQuoteClick: (drop: ApiDrop) => void;
  readonly onDropContentClick?: ((drop: ExtendedDrop) => void) | undefined;
  readonly parentContainerRef?: React.RefObject<HTMLElement | null> | undefined;
}

export default function ParticipationDrop(
  props: DefaultParticipationDropProps
) {
  const { drop } = props;
  const { isVotingEnded } = useDropInteractionRules(drop);

  // Render either the ongoing or ended drop component based on the voting state
  if (isVotingEnded) {
    return <EndedParticipationDrop {...props} />;
  } else {
    return <OngoingParticipationDrop {...props} />;
  }
}

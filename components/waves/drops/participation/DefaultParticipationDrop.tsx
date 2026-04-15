import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import type { ActiveDropState } from "@/types/dropInteractionTypes";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import React from "react";
import { useDropInteractionRules } from "@/hooks/drops/useDropInteractionRules";
import OngoingParticipationDrop from "./OngoingParticipationDrop";
import EndedParticipationDrop from "./EndedParticipationDrop";
import type {
  DropIdentityMode,
  DropInteractionParams,
  DropLocation,
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
  readonly identityMode?: DropIdentityMode | undefined;
  readonly showInteractions?: boolean | undefined;
}

export default function ParticipationDrop(
  props: DefaultParticipationDropProps
) {
  const { drop } = props;
  const { isVotingEnded } = useDropInteractionRules(drop);

  // Render either the ongoing or ended drop component based on the voting state
  if (isVotingEnded) {
    return <EndedParticipationDrop {...props} />;
  }

  return <OngoingParticipationDrop {...props} />;
}

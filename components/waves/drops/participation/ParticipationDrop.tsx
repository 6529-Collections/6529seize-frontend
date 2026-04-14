import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import type { ActiveDropState } from "@/types/dropInteractionTypes";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import React from "react";
import DefaultParticipationDrop from "./DefaultParticipationDrop";
import MemeParticipationDrop from "@/components/memes/drops/MemeParticipationDrop";
import { useSeizeSettings } from "@/contexts/SeizeSettingsContext";
import type {
  DropIdentityMode,
  DropInteractionParams,
  DropLocation,
} from "../drop.types";

interface ParticipationDropProps {
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
}

export default function ParticipationDrop(props: ParticipationDropProps) {
  const { drop } = props;

  const { isMemesWave } = useSeizeSettings();

  if (isMemesWave(drop.wave.id.toLowerCase())) {
    return <MemeParticipationDrop {...props} />;
  }

  return <DefaultParticipationDrop {...props} />;
}

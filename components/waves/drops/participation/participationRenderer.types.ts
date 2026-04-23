import type { ComponentType, RefObject } from "react";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import type { WaveParticipationVariant } from "@/helpers/waves/wave-participation-presentation.helpers";
import type { ActiveDropState } from "@/types/dropInteractionTypes";
import type {
  DropIdentityMode,
  DropInteractionParams,
  DropLocation,
} from "../drop.types";

export interface ParticipationDropProps {
  readonly drop: ExtendedDrop;
  readonly showWaveInfo: boolean;
  readonly activeDrop: ActiveDropState | null;
  readonly showReplyAndQuote: boolean;
  readonly location: DropLocation;
  readonly onReply: (param: DropInteractionParams) => void;
  readonly onQuoteClick: (drop: ApiDrop) => void;
  readonly onDropContentClick?: ((drop: ExtendedDrop) => void) | undefined;
  readonly parentContainerRef?: RefObject<HTMLElement | null> | undefined;
  readonly identityMode?: DropIdentityMode | undefined;
  readonly showInteractions?: boolean | undefined;
}

export interface SingleWaveDropProps {
  readonly drop: ExtendedDrop;
  readonly onClose: () => void;
}

export interface WaveParticipationRendererSet {
  readonly ParticipationDrop: ComponentType<ParticipationDropProps>;
  readonly SingleWaveDrop: ComponentType<SingleWaveDropProps>;
}

export interface ResolvedWaveParticipationRendererSet extends WaveParticipationRendererSet {
  readonly variant: WaveParticipationVariant;
}

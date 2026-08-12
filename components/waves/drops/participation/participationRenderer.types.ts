import type { ComponentType, ReactNode, RefObject } from "react";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import type { ImageScale } from "@/helpers/image.helpers";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import type { WaveParticipationVariant } from "@/helpers/waves/wave-participation-presentation.helpers";
import type { ActiveDropState } from "@/types/dropInteractionTypes";
import type {
  DropIdentityMode,
  DropInteractionParams,
  DropLocation,
  DropTimestampLayout,
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
  readonly footer?: ReactNode;
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
  readonly embedPath?: readonly string[] | undefined;
  readonly quotePath?: readonly string[] | undefined;
  readonly embedDepth?: number | undefined;
  readonly maxEmbedDepth?: number | undefined;
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

import type { ApiDrop } from "@/generated/models/ApiDrop";
import type { ImageScale } from "@/helpers/image.helpers";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import type { ActiveDropState } from "@/types/dropInteractionTypes";
import type { ReactNode } from "react";
import type {
  DropIdentityMode,
  DropInteractionParams,
  DropLocation,
  DropTimestampLayout,
} from "./drop.types";

export interface WaveDropProps {
  readonly drop: ExtendedDrop;
  readonly previousDrop: ExtendedDrop | null;
  readonly nextDrop: ExtendedDrop | null;
  readonly showWaveInfo: boolean;
  readonly activeDrop: ActiveDropState | null;
  readonly showReplyAndQuote: boolean;
  readonly location: DropLocation;
  readonly dropViewDropId: string | null;
  readonly onReply: (param: DropInteractionParams) => void;
  readonly onReplyClick: (serialNo: number) => void;
  readonly onQuoteClick: (drop: ApiDrop) => void;
  readonly onDropContentClick?: ((drop: ExtendedDrop) => void) | undefined;
  readonly wrapContentOnly?: ((content: ReactNode) => ReactNode) | undefined;
  readonly footer?: ReactNode;
  readonly identityMode?: DropIdentityMode | undefined;
  readonly timestampLayout?: DropTimestampLayout | undefined;
  readonly showInteractions?: boolean | undefined;
  readonly inlineAuthorOnDesktop?: boolean | undefined;
  readonly mediaImageScale?: ImageScale | undefined;
  readonly fullWidthMedia?: boolean | undefined;
  readonly fullWidthLinkPreviews?: boolean | undefined;
  readonly embedPath?: readonly string[] | undefined;
  readonly quotePath?: readonly string[] | undefined;
  readonly embedDepth?: number | undefined;
  readonly maxEmbedDepth?: number | undefined;
}

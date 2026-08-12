import { memo } from "react";
import type { Drop, ExtendedDrop } from "@/helpers/waves/drop.helpers";
import type { ActiveDropState } from "@/types/dropInteractionTypes";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import type { ImageScale } from "@/helpers/image.helpers";
import MemeWinnerDrop from "@/components/memes/drops/MemeWinnerDrop";
import DefaultWinnerDrop from "./DefaultWinnerDrop";
import { useSeizeSettings } from "@/contexts/SeizeSettingsContext";
import type {
  DropIdentityMode,
  DropInteractionParams,
  DropLocation,
  DropTimestampLayout,
} from "../drop.types";

interface WinnerDropProps {
  readonly drop: ExtendedDrop;
  readonly previousDrop: Drop | null;
  readonly nextDrop: Drop | null;
  readonly showWaveInfo: boolean;
  readonly activeDrop: ActiveDropState | null;
  readonly showReplyAndQuote: boolean;
  readonly location: DropLocation;
  readonly dropViewDropId: string | null;
  readonly onReply: (param: DropInteractionParams) => void;
  readonly onReplyClick: (serialNo: number) => void;
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
  readonly embedPath?: readonly string[] | undefined;
  readonly quotePath?: readonly string[] | undefined;
  readonly embedDepth?: number | undefined;
  readonly maxEmbedDepth?: number | undefined;
}

const WinnerDrop = (props: WinnerDropProps) => {
  const { isMemesWave } = useSeizeSettings();

  if (isMemesWave(props.drop.wave.id.toLowerCase())) {
    return <MemeWinnerDrop {...props} />;
  }

  return <DefaultWinnerDrop {...props} />;
};

export default memo(WinnerDrop);

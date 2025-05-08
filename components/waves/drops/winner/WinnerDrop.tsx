import { memo } from "react";
import { Drop, ExtendedDrop } from "../../../../helpers/waves/drop.helpers";
import { ActiveDropState } from "../../../../types/dropInteractionTypes";
import { DropInteractionParams, DropLocation } from "../Drop";
import { ApiDrop } from "../../../../generated/models/ApiDrop";
import MemeWinnerDrop from "../../../memes/drops/MemeWinnerDrop";
import DefaultWinnerDrop from "./DefaultWinnerDrop";
import { useSeizeSettings } from "../../../../contexts/SeizeSettingsContext";

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
  readonly onQuote: (param: DropInteractionParams) => void;
  readonly onReplyClick: (serialNo: number) => void;
  readonly onQuoteClick: (drop: ApiDrop) => void;
  readonly onDropContentClick?: (drop: ExtendedDrop) => void;
  readonly parentContainerRef?: React.RefObject<HTMLElement>;
}

const WinnerDrop = (props: WinnerDropProps) => {
  const { isMemesWave } = useSeizeSettings();

  if (isMemesWave(props.drop.wave?.id?.toLowerCase())) {
    return <MemeWinnerDrop {...props} />;
  }

  return <DefaultWinnerDrop {...props} />;
};

export default memo(WinnerDrop);

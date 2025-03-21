import { memo } from "react";
import { ExtendedDrop } from "../../../../helpers/waves/drop.helpers";
import { ActiveDropState } from "../../../../types/dropInteractionTypes";
import { DropInteractionParams, DropLocation } from "../Drop";
import { ApiDrop } from "../../../../generated/models/ApiDrop";
import MemeWinnerDrop from "../../../memes/drops/MemeWinnerDrop";
import DefaultWinnerDrop from "./DefaultWinnerDrop";
import { isMemesWave } from "../../../../helpers/waves/waves.helpers";

interface WinnerDropProps {
  readonly drop: ExtendedDrop;
  readonly previousDrop: ExtendedDrop | null;
  readonly nextDrop: ExtendedDrop | null;
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
  if (isMemesWave(props.drop.wave?.id?.toLowerCase())) {
    return <MemeWinnerDrop {...props} />;
  }

  return <DefaultWinnerDrop {...props} />;
};

export default memo(WinnerDrop);

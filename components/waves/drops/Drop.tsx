import { ExtendedDrop } from "../../../helpers/waves/drop.helpers";
import { ActiveDropState } from "../../../types/dropInteractionTypes";
import WaveDrop from "./WaveDrop";
import { ApiDrop } from "../../../generated/models/ApiDrop";
import { ApiDropType } from "../../../generated/models/ApiDropType";
import ParticipationDrop from "./participation/ParticipationDrop";
import WinnerDrop from "./winner/WinnerDrop";

export interface DropInteractionParams {
  drop: ExtendedDrop;
  partId: number;
}

export enum DropLocation {
  MY_STREAM = "MY_STREAM",
  WAVE = "WAVE",
}

interface DropProps {
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

export default function Drop({
  drop,
  previousDrop,
  nextDrop,
  showWaveInfo,
  activeDrop,
  location,
  dropViewDropId,
  onReply,
  onQuote,
  onReplyClick,
  onQuoteClick,
  onDropContentClick,
  showReplyAndQuote,
  parentContainerRef,
}: DropProps) {
  if (drop.drop_type === ApiDropType.Participatory) {
    return (
      <ParticipationDrop
        drop={drop}
        showWaveInfo={showWaveInfo}
        activeDrop={activeDrop}
        location={location}
        onReply={onReply}
        onQuote={onQuote}
        onQuoteClick={onQuoteClick}
        onDropContentClick={onDropContentClick}
        showReplyAndQuote={showReplyAndQuote}
        parentContainerRef={parentContainerRef}
      />
    );
  } else if (drop.drop_type === ApiDropType.Winner) {    
    return (
      <WinnerDrop
        drop={drop}
        previousDrop={previousDrop}
        nextDrop={nextDrop}
        showWaveInfo={showWaveInfo}
        activeDrop={activeDrop}
        location={location}
        dropViewDropId={dropViewDropId}
        onReply={onReply}
        onQuote={onQuote}
        onReplyClick={onReplyClick}
        onQuoteClick={onQuoteClick}
        onDropContentClick={onDropContentClick}
        showReplyAndQuote={showReplyAndQuote}
        parentContainerRef={parentContainerRef}
      />
    );
  }
  return (
    <WaveDrop
      drop={drop}
      previousDrop={previousDrop}
      nextDrop={nextDrop}
      showWaveInfo={showWaveInfo}
      activeDrop={activeDrop}
      location={location}
      dropViewDropId={dropViewDropId}
      onReply={onReply}
      onQuote={onQuote}
      onReplyClick={onReplyClick}
      onQuoteClick={onQuoteClick}
      onDropContentClick={onDropContentClick}
      showReplyAndQuote={showReplyAndQuote}
      parentContainerRef={parentContainerRef}
    />
  );
}

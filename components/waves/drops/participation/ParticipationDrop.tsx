import { ExtendedDrop } from "../../../../helpers/waves/drop.helpers";
import { ActiveDropState } from "../../../../types/dropInteractionTypes";
import { DropInteractionParams, DropLocation } from "../Drop";
import { ApiDrop } from "../../../../generated/models/ApiDrop";
import React from "react";
import DefaultParticipationDrop from "./DefaultParticipationDrop";
import MemeParticipationDrop from "../../../memes/drops/MemeParticipationDrop";

interface ParticipationDropProps {
  readonly drop: ExtendedDrop;
  readonly showWaveInfo: boolean;
  readonly activeDrop: ActiveDropState | null;
  readonly showReplyAndQuote: boolean;
  readonly location: DropLocation;
  readonly onReply: (param: DropInteractionParams) => void;
  readonly onQuote: (param: DropInteractionParams) => void;
  readonly onQuoteClick: (drop: ApiDrop) => void;
  readonly onDropContentClick?: (drop: ExtendedDrop) => void;
  readonly parentContainerRef?: React.RefObject<HTMLElement>;
}

export default function ParticipationDrop(props: ParticipationDropProps) {
  const { 
    drop, 
    showWaveInfo, 
    activeDrop, 
    location, 
    onReply, 
    onQuote, 
    onQuoteClick, 
    onDropContentClick, 
    showReplyAndQuote, 
    parentContainerRef 
  } = props;
  const isMemesWave = drop.wave?.id?.toLowerCase() === "87eb0561-5213-4cc6-9ae6-06a3793a5e58";
  if (isMemesWave) {
     return (
       <MemeParticipationDrop
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
   } else {
  return <DefaultParticipationDrop {...props} />
}
}
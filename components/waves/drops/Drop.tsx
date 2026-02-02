"use client";

import type { ApiDrop } from "@/generated/models/ApiDrop";
import { ApiDropType } from "@/generated/models/ApiDropType";
import type {
  Drop as DropType,
  ExtendedDrop,
} from "@/helpers/waves/drop.helpers";
import { DropSize } from "@/helpers/waves/drop.helpers";
import type { ActiveDropState } from "@/types/dropInteractionTypes";
import { useMemo } from "react";
import DropContext from "./DropContext";
import ParticipationDrop from "./participation/ParticipationDrop";
import WaveDrop from "./WaveDrop";
import WinnerDrop from "./winner/WinnerDrop";

export interface DropInteractionParams {
  drop: ExtendedDrop;
  partId: number;
}

export enum DropLocation {
  MY_STREAM = "MY_STREAM",
  WAVE = "WAVE",
  PROFILE = "PROFILE",
}

interface DropProps {
  readonly drop: ExtendedDrop;
  readonly previousDrop: DropType | null;
  readonly nextDrop: DropType | null;
  readonly showWaveInfo: boolean;
  readonly activeDrop: ActiveDropState | null;
  readonly showReplyAndQuote: boolean;
  readonly location: DropLocation;
  readonly dropViewDropId: string | null;
  readonly onReply: (param: DropInteractionParams) => void;
  readonly onQuote: (param: DropInteractionParams) => void;
  readonly onReplyClick: (serialNo: number) => void;
  readonly onQuoteClick: (drop: ApiDrop) => void;
  readonly onDropContentClick?: ((drop: ExtendedDrop) => void) | undefined;
  readonly parentContainerRef?: React.RefObject<HTMLElement | null> | undefined;
  readonly wrapContentOnly?: (content: React.ReactNode) => React.ReactNode;
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
  wrapContentOnly,
}: DropProps) {
  const components: Record<ApiDropType, React.ReactNode> = {
    [ApiDropType.Participatory]: (
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
    ),
    [ApiDropType.Winner]: (
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
    ),
    [ApiDropType.Chat]: (
      <WaveDrop
        drop={drop}
        previousDrop={
          previousDrop?.type === DropSize.FULL ? previousDrop : null
        }
        nextDrop={nextDrop?.type === DropSize.FULL ? nextDrop : null}
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
        wrapContentOnly={wrapContentOnly}
      />
    ),
  };

  const memoizedValue = useMemo(() => ({ drop, location }), [drop, location]);

  return (
    <DropContext.Provider value={memoizedValue}>
      {components[drop.drop_type]}
    </DropContext.Provider>
  );
}

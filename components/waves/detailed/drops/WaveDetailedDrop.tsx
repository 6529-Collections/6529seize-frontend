import { Drop } from "../../../../generated/models/Drop";
import WaveDetailedDropActions from "./WaveDetailedDropActions";
import WaveDetailedDropReply from "./WaveDetailedDropReply";
import WaveDetailedDropContent from "./WaveDetailedDropContent";
import WaveDetailedDropHeader from "./WaveDetailedDropHeader";
import WaveDetailedDropAuthorPfp from "./WaveDetailedDropAuthorPfp";
import WaveDetailedDropRatings from "./WaveDetailedDropRatings";
import { ActiveDropState } from "../WaveDetailedContent";
import { useState, useRef, useEffect } from "react";
import Tippy from "@tippyjs/react";
import { AnimatePresence, motion } from "framer-motion";
import WaveDetailedDropMetadata from "./WaveDetailedDropMetadata";

interface WaveDetailedDropProps {
  readonly drop: Drop;
  readonly showWaveInfo: boolean;
  readonly activeDrop: ActiveDropState | null;
  readonly rootDropId: string | null;
  readonly showReplyAndQuote: boolean;
  readonly onReply: ({ drop, partId }: { drop: Drop; partId: number }) => void;
  readonly onQuote: ({ drop, partId }: { drop: Drop; partId: number }) => void;
}

export default function WaveDetailedDrop({
  drop,
  showWaveInfo,
  activeDrop,
  rootDropId,
  onReply,
  onQuote,
  showReplyAndQuote,
}: WaveDetailedDropProps) {
  const isActiveDrop = activeDrop?.drop.id === drop.id;
  const [activePartIndex, setActivePartIndex] = useState<number>(0);

  return (
    <div
      className={`first:tw-rounded-t-xl tw-relative tw-group tw-w-full tw-flex tw-flex-col tw-px-4 tw-py-4 tw-transition-colors tw-duration-300 ${
        isActiveDrop
          ? "tw-bg-[#3CCB7F]/10 tw-border-l-2 tw-border-l-[#3CCB7F] tw-border-solid tw-border-y-0 tw-border-r-0"
          : "tw-bg-iron-950"
      }`}
    >
      {!!drop.reply_to && drop.reply_to.drop_id !== rootDropId && (
        <WaveDetailedDropReply
          dropId={drop.reply_to.drop_id}
          dropPartId={drop.reply_to.drop_part_id}
        />
      )}
      <div className="tw-flex tw-gap-x-3">
        <WaveDetailedDropAuthorPfp drop={drop} />
        <div className="tw-mt-1 tw-flex tw-flex-col tw-w-full">
          <WaveDetailedDropHeader drop={drop} showWaveInfo={showWaveInfo} />

          <div>
            <WaveDetailedDropContent
              drop={drop}
              activePartIndex={activePartIndex}
              setActivePartIndex={setActivePartIndex}
            />
          </div>
        </div>
      </div>

      {showReplyAndQuote && (
        <WaveDetailedDropActions
          drop={drop}
          activePartIndex={activePartIndex}
          onReply={() =>
            onReply({ drop, partId: drop.parts[activePartIndex].part_id })
          }
          onQuote={() =>
            onQuote({ drop, partId: drop.parts[activePartIndex].part_id })
          }
        />
      )}

      <div className="tw-flex tw-w-full tw-justify-end tw-items-center tw-gap-x-2">
        {drop.metadata.length > 0 && (
          <WaveDetailedDropMetadata metadata={drop.metadata} />
        )}
        {!!drop.raters_count && <WaveDetailedDropRatings drop={drop} />}
      </div>
    </div>
  );
}

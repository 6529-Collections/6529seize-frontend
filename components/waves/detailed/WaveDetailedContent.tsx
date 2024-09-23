import { useState, useRef } from "react";
import { Wave } from "../../../generated/models/Wave";
import { Drop } from "../../../generated/models/Drop";
import CreateDrop from "./CreateDrop";
import WaveDrops from "./drops/WaveDrops";
import WaveDropThread from "./drops/WaveDropThread";
import { AnimatePresence, motion } from "framer-motion";

export enum ActiveDropAction {
  REPLY = "REPLY",
  QUOTE = "QUOTE",
}

export interface ActiveDropState {
  action: ActiveDropAction;
  drop: Drop;
  partId: number; // Add this line
}

interface WaveDetailedContentProps {
  readonly activeDropId: string | null;
  readonly wave: Wave;
  readonly onBackToList: () => void;
}

export default function WaveDetailedContent({
  activeDropId,
  wave,
  onBackToList,
}: WaveDetailedContentProps) {
  const [activeDrop, setActiveDrop] = useState<ActiveDropState | null>(null);
  const createDropRef = useRef<HTMLDivElement>(null);
  const canDrop = wave.participation.authenticated_user_eligible;

  const onReply = (drop: Drop, partId: number) => {
    setActiveDrop({
      action: ActiveDropAction.REPLY,
      drop,
      partId,
    });
  };

  const onQuote = (drop: Drop, partId: number) => {
    setActiveDrop({
      action: ActiveDropAction.QUOTE,
      drop,
      partId,
    });
  };

  const handleReply = ({ drop, partId }: { drop: Drop; partId: number }) => {
    onReply(drop, partId);
  };

  const handleQuote = ({ drop, partId }: { drop: Drop; partId: number }) => {
    onQuote(drop, partId);
  };

  const onCancelReplyQuote = () => {
    setActiveDrop(null);
  };

  return (
    <div>
      <div className="tw-w-full tw-inline-flex ">
        <div className="tw-w-full">
          <WaveDrops
            wave={wave}
            onReply={handleReply}
            onQuote={handleQuote}
            activeDrop={activeDrop}
            rootDropId={null}
          />
        </div>
        {activeDropId && (
          <div className="tw-w-full">
            <WaveDrops
              wave={wave}
              onReply={handleReply}
              onQuote={handleQuote}
              activeDrop={activeDrop}
              rootDropId={activeDropId}
            />
          </div>
        )}
      </div>
      {canDrop && (
        <div ref={createDropRef}>
          <CreateDrop
            activeDrop={activeDrop}
            onCancelReplyQuote={onCancelReplyQuote}
            waveId={wave.id}
            rootDropId={activeDropId}
          />
        </div>
      )}
    </div>
  );
}

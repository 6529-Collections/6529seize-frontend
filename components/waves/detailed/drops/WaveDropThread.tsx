import React, { useEffect, useRef, useState } from "react";
import CreateDrop from "../CreateDrop";
import { Wave } from "../../../../generated/models/Wave";
import { Drop } from "../../../../generated/models/Drop";
import WaveDrops from "./WaveDrops";
import { ActiveDropAction, ActiveDropState } from "../WaveDetailedContent";

interface WaveDropThreadProps {
  rootDropId: string;
  onBackToList: () => void;
  wave: Wave;
}

export default function WaveDropThread({
  rootDropId,
  onBackToList,
  wave,
}: WaveDropThreadProps) {
  const [activeDrop, setActiveDrop] = useState<ActiveDropState | null>(null);
  const createDropRef = useRef<HTMLDivElement>(null);
  const canDrop = wave.participation.authenticated_user_eligible;

  useEffect(() => {
    if (activeDrop && createDropRef.current) {
      const rect = createDropRef.current.getBoundingClientRect();
      const isFullyVisible = rect.top >= 0 && rect.bottom <= window.innerHeight;

      if (!isFullyVisible) {
        const scrollTarget = window.scrollY + rect.top - 20; // 20px extra space
        window.scrollTo({
          top: scrollTarget,
          behavior: "smooth",
        });
      }
    }
  }, [activeDrop]);

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

  const onDropCreated = () => {
    setActiveDrop(null);
  };

  return (
    <div>
      <WaveDrops
        wave={wave}
        onReply={handleReply}
        onQuote={handleQuote}
        activeDrop={activeDrop}
        rootDropId={rootDropId}
        onBackToList={onBackToList}
      />
      {canDrop && (
        <div ref={createDropRef}>
          <CreateDrop
            rootDropId={rootDropId}
            activeDrop={activeDrop}
            onCancelReplyQuote={onCancelReplyQuote}
            waveId={wave.id}
            onDropCreated={onDropCreated}
          />
        </div>
      )}
    </div>
  );
}

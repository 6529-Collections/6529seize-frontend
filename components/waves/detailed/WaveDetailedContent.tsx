import { useState, useRef, useEffect } from "react";
import { Wave } from "../../../generated/models/Wave";
import { Drop } from "../../../generated/models/Drop";
import CreateDrop from "./CreateDrop";
import WaveDrops from "./drops/WaveDrops";
import WaveDropThread from "./drops/WaveDropThread";

export enum ActiveDropAction {
  REPLY,
  QUOTE,
}

export interface ActiveDropState {
  drop: Drop;
  action: ActiveDropAction;
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

  if (activeDropId) {
    return (
      <WaveDropThread
        rootDropId={activeDropId}
        onBackToList={onBackToList}
      />
    );
  }

  const handleReply = ({ drop }: { drop: Drop }) => {
    setActiveDrop({ drop, action: ActiveDropAction.REPLY });
  };

  const handleQuote = ({ drop }: { drop: Drop }) => {
    setActiveDrop({ drop, action: ActiveDropAction.QUOTE });
  };

  const onCancelReplyQuote = () => {
    setActiveDrop(null);
  };

  return (
    <>
      <div ref={createDropRef}>
        <CreateDrop
          activeDrop={activeDrop}
          onCancelReplyQuote={onCancelReplyQuote}
        />
      </div>
      <WaveDrops
        wave={wave}
        onReply={handleReply}
        onQuote={handleQuote}
        activeDrop={activeDrop}
      />
    </>
  );
}

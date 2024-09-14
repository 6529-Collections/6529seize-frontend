import { useState, useRef, useEffect } from "react";
import { Wave } from "../../../generated/models/Wave";
import { Drop } from "../../../generated/models/Drop";
import CreateDrop from "./CreateDrop";
import WaveDrops from "./drops/WaveDrops";
import WaveDropThread from "./drops/WaveDropThread";

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
        wave={wave}
      />
    );
  }

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

  const onDropCreate = () => {
    setActiveDrop(null);
  };

  return (
    <>
      <div ref={createDropRef} className="tw-sticky tw-top-0 tw-z-10">
        <CreateDrop
          activeDrop={activeDrop}
          onCancelReplyQuote={onCancelReplyQuote}
          wave={wave}
          onDropCreate={onDropCreate}
          rootDropId={null}
        />
      </div>
      <WaveDrops
        wave={wave}
        onReply={handleReply}
        onQuote={handleQuote}
        activeDrop={activeDrop}
        rootDropId={null}
      />
    </>
  );
}

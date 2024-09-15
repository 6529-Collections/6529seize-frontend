import { useState, useRef, useEffect } from "react";
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
    <AnimatePresence mode="wait">
      {activeDropId ? (
        <motion.div
          key="thread"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <WaveDropThread
            rootDropId={activeDropId}
            onBackToList={onBackToList}
            wave={wave}
          />
        </motion.div>
      ) : (
        <motion.div
          key="drops"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {canDrop && (
            <div ref={createDropRef} className="tw-sticky tw-top-0 tw-z-10">
              <CreateDrop
                activeDrop={activeDrop}
                onCancelReplyQuote={onCancelReplyQuote}
                wave={{
                  id: wave.id,
                  name: wave.name,
                  picture: wave.picture ?? "",
                  description_drop_id: wave.description_drop.id,
                  authenticated_user_eligible_to_participate:
                    wave.participation.authenticated_user_eligible,
                  authenticated_user_eligible_to_vote:
                    wave.voting.authenticated_user_eligible,
                }}
                onDropCreated={onDropCreated}
                rootDropId={null}
              />
            </div>
          )}
          <WaveDrops
            wave={wave}
            onReply={handleReply}
            onQuote={handleQuote}
            activeDrop={activeDrop}
            rootDropId={null}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

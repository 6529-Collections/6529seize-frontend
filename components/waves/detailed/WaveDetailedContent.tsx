import { useState, useEffect } from "react";
import { Wave } from "../../../generated/models/Wave";
import { Drop } from "../../../generated/models/Drop";
import CreateDrop from "./CreateDrop";
import WaveDrops from "./drops/WaveDrops";
import { AnimatePresence, motion } from "framer-motion";
import WaveDetailedThread from "./WaveDetailedThread";
import { createBreakpoint } from "react-use";

export enum ActiveDropAction {
  REPLY = "REPLY",
  QUOTE = "QUOTE",
}

export interface ActiveDropState {
  action: ActiveDropAction;
  drop: Drop;
  partId: number;
}

interface WaveDetailedContentProps {
  readonly activeDropId: string | null;
  readonly wave: Wave;
  readonly onBackToList: () => void;
}

const useBreakpoint = createBreakpoint({ MD: 768, S: 0 });

export default function WaveDetailedContent({
  activeDropId,
  wave,
  onBackToList,
}: WaveDetailedContentProps) {
  const [activeDrop, setActiveDrop] = useState<ActiveDropState | null>(null);
  const [isThreadOpen, setIsThreadOpen] = useState(false);
  const canDrop = wave.participation.authenticated_user_eligible;

  useEffect(() => {
    setIsThreadOpen(!!activeDropId);
  }, [activeDropId]);

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

  const closeActiveDropId = () => {
    onBackToList();
    setIsThreadOpen(false);
  };

  const breakpoint = useBreakpoint();

  const threadAnimationVariants = {
    S: {
      initial: { opacity: 0, width: 0, x: "100%" },
      animate: { opacity: 1, width: "100%", x: 0 },
      exit: { opacity: 0, width: 0, x: "100%" },
    },
    default: {
      initial: { width: 0, opacity: 0 },
      animate: { width: "75%", opacity: 1 },
      exit: { width: 0, opacity: 0 },
    },
  };

  return (
    <div className="tw-w-full tw-flex tw-items-stretch lg:tw-divide-x-4 lg:tw-divide-iron-600 lg:tw-divide-solid lg:tw-divide-y-0">
      <div className="tw-w-full tw-flex tw-flex-col">
        <WaveDrops
          wave={wave}
          onReply={handleReply}
          onQuote={handleQuote}
          activeDrop={activeDrop}
          rootDropId={null}
        />
        {canDrop && (
          <div className="tw-mt-auto">
            <CreateDrop
              activeDrop={activeDrop}
              onCancelReplyQuote={onCancelReplyQuote}
              waveId={wave.id}
              rootDropId={null}
            />
          </div>
        )}
      </div>
      <AnimatePresence>
        {isThreadOpen && (
          <motion.div
            variants={
              threadAnimationVariants[breakpoint === "S" ? "S" : "default"]
            }
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className={`tw-w-full ${
              breakpoint === "S"
                ? "tw-fixed tw-inset-x-0  tw-z-50 tw-bg-iron-900 tw-h-full"
                : "tw-relative"
            }`}
          >
            <WaveDetailedThread
              wave={wave}
              rootDropId={activeDropId}
              closeActiveDropId={closeActiveDropId}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

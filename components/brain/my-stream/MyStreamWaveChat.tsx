import React, { useMemo, useState, useEffect } from "react";
import useCapacitor from "../../../hooks/useCapacitor";
import {
  ActiveDropAction,
  ActiveDropState,
} from "../../../types/dropInteractionTypes";
import { ApiDrop } from "../../../generated/models/ApiDrop";
import WaveDropsAll from "../../waves/drops/WaveDropsAll";
import { CreateDropWaveWrapper } from "../../waves/CreateDropWaveWrapper";
import PrivilegedDropCreator, {
  DropMode,
} from "../../waves/PrivilegedDropCreator";
import { ApiWave } from "../../../generated/models/ApiWave";
import { useRouter } from "next/router";
import { useSearchParams } from "next/navigation";

interface MyStreamWaveChatProps {
  readonly wave: ApiWave;
}

// Height calculations based on wave type and viewport size
const calculateHeight = (isCapacitor: boolean, isMemesWave: boolean, isSimpleWave: boolean) => {
  if (isCapacitor) {
    return isMemesWave 
      ? "tw-h-[calc(100vh-21rem)]"  // More space for Memes wave header
      : "tw-h-[calc(100vh-18rem)]";
  }
  
  if (isMemesWave) {
    // Values for memes wave with title + tabs + submit button
    return `tw-h-[calc(100vh-11.5rem)] lg:tw-h-[calc(100vh-11.875rem)] min-[1200px]:tw-h-[calc(100vh-12.875rem)]`;
  }
  
  if (isSimpleWave) {
    // Heights for simple waves without tabs - more vertical space
    return `tw-h-[calc(100vh-11.5rem)] lg:tw-h-[calc(100vh-8.75rem)] min-[1200px]:tw-h-[calc(100vh-9.5rem)]`;
  }
  
  // Heights for standard waves with tabs
  return `tw-h-[calc(100vh-11.5rem)] lg:tw-h-[calc(100vh-10.625rem)] min-[1200px]:tw-h-[calc(100vh-11.375rem)]`;
};

const MyStreamWaveChat: React.FC<MyStreamWaveChatProps> = ({
  wave
}) => {
  const capacitor = useCapacitor();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [initialDrop, setInitialDrop] = useState<number | null>(null);
  const [searchParamsDone, setSearchParamsDone] = useState(false);
  useEffect(() => {
    const dropParam = searchParams.get("serialNo");
    if (dropParam) {
      setInitialDrop(parseInt(dropParam));
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete("serialNo");
      router.replace(newUrl.pathname + newUrl.search);
    } else {
      setInitialDrop(null);
    }
    setSearchParamsDone(true);
  }, [searchParams, router]);

  // Check if this is the specific Memes wave
  const isMemesWave = wave.id.toLowerCase() === "87eb0561-5213-4cc6-9ae6-06a3793a5e58";
  
  // Check if this is a wave with at least one decision point
  const hasDecisionPoints = !!wave.wave.decisions_strategy?.first_decision_time;
  
  // Check if this is a multi-decision wave
  const hasMultipleDecisions = 
    !!wave.wave.decisions_strategy?.subsequent_decisions && 
    wave.wave.decisions_strategy.subsequent_decisions.length > 0;
  
  // Check if this is a rolling wave
  const isRollingWave = 
    !!wave.wave.decisions_strategy?.is_rolling;
  
  // Determine if this is a "simple wave" (no decision points at all, not rolling, not memes)
  // Simple waves shouldn't show tabs at all
  const isSimpleWave = !hasDecisionPoints && !hasMultipleDecisions && !isRollingWave && !isMemesWave;
  
  const containerClassName = useMemo(() => {
    // Ensure the container is always scrollable and has scroll shadows
    return `tw-w-full tw-flex tw-flex-col tw-rounded-t-xl tw-overflow-y-auto tw-overflow-x-hidden lg:tw-scrollbar-thin tw-scrollbar-thumb-iron-500 tw-scrollbar-track-iron-800 desktop-hover:hover:tw-scrollbar-thumb-iron-300 scroll-shadow ${calculateHeight(
      capacitor.isCapacitor,
      isMemesWave,
      isSimpleWave
    )}`;
  }, [capacitor.isCapacitor, isMemesWave, isSimpleWave]);

  const [activeDrop, setActiveDrop] = useState<ActiveDropState | null>(null);
  useEffect(() => setActiveDrop(null), [wave]);

  const onReply = (drop: ApiDrop, partId: number) => {
    setActiveDrop({
      action: ActiveDropAction.REPLY,
      drop,
      partId,
    });
  };

  const onQuote = (drop: ApiDrop, partId: number) => {
    setActiveDrop({
      action: ActiveDropAction.QUOTE,
      drop,
      partId,
    });
  };

  const handleReply = ({ drop, partId }: { drop: ApiDrop; partId: number }) => {
    onReply(drop, partId);
  };

  const handleQuote = ({ drop, partId }: { drop: ApiDrop; partId: number }) => {
    onQuote(drop, partId);
  };

  const onCancelReplyQuote = () => {
    setActiveDrop(null);
  };

  if (!searchParamsDone) {
    return null;
  }

  return (
    <div className={containerClassName}>
      <WaveDropsAll
        key={wave.id}
        waveId={wave.id}
        onReply={handleReply}
        onQuote={handleQuote}
        activeDrop={activeDrop}
        initialDrop={initialDrop}
        dropId={null}
      />
      <div className="tw-mt-auto">
        <CreateDropWaveWrapper>
          <PrivilegedDropCreator
            activeDrop={activeDrop}
            onCancelReplyQuote={onCancelReplyQuote}
            onDropAddedToQueue={onCancelReplyQuote}
            wave={wave}
            dropId={null}
            fixedDropMode={DropMode.BOTH}
          />
        </CreateDropWaveWrapper>
      </div>
    </div>
  );
};

export default MyStreamWaveChat;

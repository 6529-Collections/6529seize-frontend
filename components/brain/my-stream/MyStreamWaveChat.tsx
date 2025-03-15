import React, { useMemo, useState, useEffect, useRef } from "react";
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
// We're now using only the dynamic height calculation
import { ContentView, useContentHeight } from "../../../hooks/useContentHeight";

interface MyStreamWaveChatProps {
  readonly wave: ApiWave;
  // New explicit props for wave types to avoid duplicate logic
  readonly isMemesWave?: boolean;
  readonly isRollingWave?: boolean;
  readonly isSimpleWave?: boolean;
}

const MyStreamWaveChat: React.FC<MyStreamWaveChatProps> = ({
  wave,
  isMemesWave: propsIsMemesWave,
  isRollingWave: propsIsRollingWave,
  isSimpleWave: propsIsSimpleWave,
}) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const containerRef = useRef<HTMLDivElement>(null);
  const [initialDrop, setInitialDrop] = useState<number | null>(null);
  const [searchParamsDone, setSearchParamsDone] = useState(false);

  // Handle URL parameters
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

  // Use props if provided, otherwise calculate wave types
  const isMemesWave =
    propsIsMemesWave ??
    wave.id.toLowerCase() === "87eb0561-5213-4cc6-9ae6-06a3793a5e58";

  const isRollingWave =
    propsIsRollingWave ?? !!wave.wave.decisions_strategy?.is_rolling;

  const hasDecisionPoints = !!wave.wave.decisions_strategy?.first_decision_time;
  const hasMultipleDecisions =
    !!wave.wave.decisions_strategy?.subsequent_decisions &&
    wave.wave.decisions_strategy.subsequent_decisions.length > 0;

  const isSimpleWave =
    propsIsSimpleWave ??
    (!hasDecisionPoints &&
      !hasMultipleDecisions &&
      !isRollingWave &&
      !isMemesWave);

  // Use our dynamic content height hook
  const { heightStyle, ready } = useContentHeight({
    view: ContentView.CHAT,
    isMemesWave,
    isRollingWave,
    isSimpleWave,
    componentId: `wave-chat-${wave.id}`,
  });


  // Create container class based on wave type
  const containerClassName = useMemo(() => {
    const baseStyles =
      "tw-w-full tw-flex tw-flex-col tw-rounded-t-xl tw-overflow-y-auto tw-overflow-x-hidden lg:tw-scrollbar-thin tw-scrollbar-thumb-iron-500 tw-scrollbar-track-iron-800 desktop-hover:hover:tw-scrollbar-thumb-iron-300 scroll-shadow";

    // Always use flex-grow for consistent height handling
    const heightClass = "tw-flex-grow";

    return `${baseStyles} ${heightClass}`;
  }, [isSimpleWave]);

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
    <div
      ref={containerRef}
      className={`wave-chat-container ${containerClassName}`}
      style={heightStyle}
      data-wave-type={
        isRollingWave
          ? "rolling"
          : isMemesWave
          ? "memes"
          : isSimpleWave
          ? "simple"
          : "standard"
      }
    >
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

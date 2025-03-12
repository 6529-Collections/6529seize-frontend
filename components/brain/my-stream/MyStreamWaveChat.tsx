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

const calculateHeight = (isCapacitor: boolean, isMemesWave: boolean) => {
  if (isCapacitor) {
    return isMemesWave 
      ? "tw-h-[calc(100vh-21rem)]"  // More space for Memes wave header
      : "tw-h-[calc(100vh-18rem)]";
  }
  
  if (isMemesWave) {
    // Account for the title and button in Memes waves
    // Using rem units to match other components, and fixed height instead of max-height
    return `tw-h-[calc(100vh-15rem)] lg:tw-h-[calc(100vh-13rem)] min-[1200px]:tw-h-[calc(100vh-16.25rem)]`;
  }
  
  // Original heights for non-Memes waves, using fixed height instead of max-height
  return `tw-h-[calc(100vh-11.875rem)] lg:tw-h-[calc(100vh-9.125rem)] min-[1200px]:tw-h-[calc(100vh-11.75rem)]`;
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
  
  const containerClassName = useMemo(() => {
    return `tw-w-full tw-flex tw-flex-col tw-rounded-t-xl tw-overflow-y-auto no-scrollbar lg:tw-scrollbar-thin tw-scrollbar-thumb-iron-500 tw-scrollbar-track-iron-800 desktop-hover:hover:tw-scrollbar-thumb-iron-300 tw-overflow-x-hidden ${calculateHeight(
      capacitor.isCapacitor,
      isMemesWave
    )}`;
  }, [capacitor.isCapacitor, isMemesWave]);

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

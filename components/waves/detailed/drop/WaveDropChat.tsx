import React, { useMemo, useRef, useState } from "react";
import {
  ApiDrop,
  ApiWave,
} from "../../../../generated/models/ObjectSerializer";
import useCapacitor from "../../../../hooks/useCapacitor";
import WaveDropsAll from "../drops/WaveDropsAll";
import { CreateDropWaveWrapper } from "../CreateDropWaveWrapper";
import CreateDrop from "../CreateDrop";
import { ActiveDropAction, ActiveDropState } from "../chat/WaveChat";

interface WaveDropChatProps {
  readonly wave: ApiWave;
  readonly drop: ApiDrop;
}

export const WaveDropChat: React.FC<WaveDropChatProps> = ({ wave, drop }) => {
  const contentWrapperRef = useRef<HTMLDivElement | null>(null);
  const capacitor = useCapacitor();
  const containerClassName = useMemo(() => {
    return `tw-w-full tw-flex tw-flex-col ${
      capacitor.isCapacitor
        ? "tw-h-[calc(100vh-14.7rem)]"
        : `tw-h-[calc(100vh-8.8rem)] lg:tw-h-[calc(100vh-102px)]`
    }`;
  }, [capacitor.isCapacitor]);

  const [activeDrop, setActiveDrop] = useState<ActiveDropState | null>({
    action: ActiveDropAction.REPLY,
    drop: drop,
    partId: 1,
  });

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
    setActiveDrop({
      action: ActiveDropAction.REPLY,
      drop: drop,
      partId: 1,
    });
  };


  return (
    <div className="tw-flex-1">
      <div
        ref={contentWrapperRef}
        className="tw-h-full tw-overflow-hidden tw-bg-iron-950 tw-ring-1 tw-ring-iron-800 tw-relative"
      >
        <div className="tw-relative tw-h-full">
          <div className="tw-h-full tw-w-full tw-flex tw-items-stretch lg:tw-divide-x-4 lg:tw-divide-iron-600 lg:tw-divide-solid lg:tw-divide-y-0">
            <div className={containerClassName}>
              <WaveDropsAll
                waveId={wave.id}
                onReply={handleReply}
                onQuote={handleQuote}
                activeDrop={activeDrop}
                initialDrop={null}
                dropId={drop.id}
                // TODO: Implement this
                onDropClick={() => {}}
              />
              {true && (
                <div className="tw-mt-auto">
                  <CreateDropWaveWrapper>
                    <CreateDrop
                      activeDrop={activeDrop}
                      onCancelReplyQuote={onCancelReplyQuote}
                      wave={wave}
                      dropId={drop.id}
                    />
                  </CreateDropWaveWrapper>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

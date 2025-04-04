import React, { useMemo, useRef, useState } from "react";
import {
  ApiDrop,
  ApiWave,
} from "../../../generated/models/ObjectSerializer";
import useCapacitor from "../../../hooks/useCapacitor";
import WaveDropsAll from "../drops/WaveDropsAll";
import {
  CreateDropWaveWrapper,
  CreateDropWaveWrapperContext,
} from "../CreateDropWaveWrapper";
import { ActiveDropAction, ActiveDropState } from "../../../types/dropInteractionTypes";
import PrivilegedDropCreator, { DropMode } from "../PrivilegedDropCreator";
import { useLayout } from "../../../components/brain/my-stream/layout/LayoutContext";

interface SingleWaveDropChatProps {
  readonly wave: ApiWave;
  readonly drop: ApiDrop;
}

export const SingleWaveDropChat: React.FC<SingleWaveDropChatProps> = ({ wave, drop }) => {
  const contentWrapperRef = useRef<HTMLDivElement | null>(null);
  const capacitor = useCapacitor();
  const { spaces } = useLayout();
  
  const containerStyle = useMemo(() => {
    if (!spaces.measurementsComplete) {
      return {};
    }
    
    // Use similar calculation to SingleWaveDropInfoContainer
    return {
      height: `calc(100vh - ${spaces.headerSpace}px - var(--tab-height, 47px))`,
    };
  }, [spaces.measurementsComplete, spaces.headerSpace]);
  
  const containerClassName = useMemo(() => {
    return `tw-w-full tw-flex tw-flex-col lg:[--tab-height:0px]`;
  }, []);

  const [activeDrop, setActiveDrop] = useState<ActiveDropState | null>({
    action: ActiveDropAction.REPLY,
    drop: drop,
    partId: 1,
  });

  const handleDropAction = ({ drop, partId, action }: { drop: ApiDrop; partId: number; action: ActiveDropAction }) => {
    setActiveDrop({ action, drop, partId });
  };

  const resetActiveDrop = () => {
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
        className="tw-h-full tw-overflow-hidden tw-bg-iron-950 tw-relative"
      >
        <div className="tw-relative tw-h-full">
          <div className="tw-h-full tw-w-full tw-flex tw-items-stretch lg:tw-divide-x-4 lg:tw-divide-iron-600 lg:tw-divide-solid lg:tw-divide-y-0">
            <div 
              className={containerClassName}
              style={containerStyle}
            >
              <WaveDropsAll
                waveId={wave.id}
                onReply={({ drop, partId }: { drop: ApiDrop; partId: number }) => 
                  handleDropAction({ drop, partId, action: ActiveDropAction.REPLY })
                }
                onQuote={({ drop, partId }: { drop: ApiDrop; partId: number }) => 
                  handleDropAction({ drop, partId, action: ActiveDropAction.QUOTE })
                }
                activeDrop={activeDrop}
                initialDrop={null}
                dropId={drop.id}
              />
              <div className="tw-mt-auto">
                <CreateDropWaveWrapper
                  context={CreateDropWaveWrapperContext.SINGLE_DROP}
                >
                  <PrivilegedDropCreator
                    activeDrop={activeDrop}
                    onCancelReplyQuote={resetActiveDrop}
                    onDropAddedToQueue={resetActiveDrop}
                    wave={wave}
                    dropId={drop.id}
                    fixedDropMode={DropMode.BOTH}
                  />
                </CreateDropWaveWrapper>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 
"use client";

import React, { useMemo, useRef, useState } from "react";
import { ApiDrop, ApiWave } from "@/generated/models/ObjectSerializer";
import useDeviceInfo from "@/hooks/useDeviceInfo";
import WaveDropsAll from "../drops/wave-drops-all";
import {
  CreateDropWaveWrapper,
  CreateDropWaveWrapperContext,
} from "../CreateDropWaveWrapper";
import {
  ActiveDropAction,
  ActiveDropState,
} from "@/types/dropInteractionTypes";
import PrivilegedDropCreator, { DropMode } from "../PrivilegedDropCreator";
import { useAndroidKeyboard } from "@/hooks/useAndroidKeyboard";

interface SingleWaveDropChatProps {
  readonly wave: ApiWave;
  readonly drop: ApiDrop;
}

export const SingleWaveDropChat: React.FC<SingleWaveDropChatProps> = ({
  wave,
  drop,
}) => {
  const contentWrapperRef = useRef<HTMLDivElement | null>(null);
  const { isApp } = useDeviceInfo();
  const { isVisible: isKeyboardVisible } = useAndroidKeyboard();

  // Apply Android keyboard adjustments to the fixed input area
  const inputContainerStyle = useMemo(() => {
    return {
      paddingBottom: isKeyboardVisible ? "0px" : "calc(env(safe-area-inset-bottom))",
    };
  }, [isKeyboardVisible]);
  
  const [activeDrop, setActiveDrop] = useState<ActiveDropState | null>({
    action: ActiveDropAction.REPLY,
    drop: drop,
    partId: 1,
  });

  const handleDropAction = ({
    drop,
    partId,
    action,
  }: {
    drop: ApiDrop;
    partId: number;
    action: ActiveDropAction;
  }) => {
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
    <div className="tw-flex-1 tw-flex tw-flex-col tw-h-full tw-min-h-0">
      <div
        ref={contentWrapperRef}
        className="tw-flex-1 tw-flex tw-flex-col tw-min-h-0 tw-overflow-hidden tw-bg-iron-950 tw-relative lg:tw-border tw-border-l-0 lg:tw-border-r lg:tw-border-solid tw-border-iron-800 tw-border-y-0">
        <div className="tw-flex-1 tw-flex tw-flex-col tw-min-h-0 tw-relative">
          <div className="tw-w-full tw-flex tw-flex-col tw-flex-1 tw-min-h-0">
            <div className="tw-w-full tw-flex tw-flex-col tw-flex-1 tw-min-h-0">
              <div className="tw-flex-1 tw-min-h-0">
                <WaveDropsAll
                  waveId={wave.id}
                  onReply={({
                    drop,
                    partId,
                  }: {
                    drop: ApiDrop;
                    partId: number;
                  }) =>
                    handleDropAction({
                      drop,
                      partId,
                      action: ActiveDropAction.REPLY,
                    })
                  }
                  onQuote={({
                    drop,
                    partId,
                  }: {
                    drop: ApiDrop;
                    partId: number;
                  }) =>
                    handleDropAction({
                      drop,
                      partId,
                      action: ActiveDropAction.QUOTE,
                    })
                  }
                  activeDrop={activeDrop}
                  initialDrop={null}
                  dropId={drop.id}
                />
              </div>
              <div
                style={isApp ? inputContainerStyle : {
                  paddingBottom: "calc(env(safe-area-inset-bottom))",
                }}
                className="tw-mt-auto">
                <CreateDropWaveWrapper
                  context={CreateDropWaveWrapperContext.SINGLE_DROP}>
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

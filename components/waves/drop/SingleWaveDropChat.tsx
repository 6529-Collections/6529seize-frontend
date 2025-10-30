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
import { useLayout } from "@/components/brain/my-stream/layout/LayoutContext";
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
  const { spaces } = useLayout();
  const { getContainerStyle, isVisible: isKeyboardVisible } = useAndroidKeyboard();

  const containerStyle = useMemo(() => {
    if (!spaces.measurementsComplete) {
      return {};
    }
    return {
      height: `calc(100vh - ${spaces.headerSpace}px - var(--tab-height, 47px))`,
    };
  }, [spaces.measurementsComplete, spaces.headerSpace]);

  const containerClassName = useMemo(() => {
    return `tw-w-full tw-flex tw-flex-col lg:[--tab-height:0px]`;
  }, []);

  // Apply Android keyboard adjustments to the fixed input area
  const inputContainerStyle = useMemo(() => {
    return getContainerStyle({
      paddingBottom: isKeyboardVisible ? "0px" : "calc(env(safe-area-inset-bottom))",
    }, 0);
  }, [getContainerStyle, isKeyboardVisible]);
  
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
    <div className="tw-flex-1">
      <div
        ref={contentWrapperRef}
        className="tw-h-full tw-overflow-hidden tw-bg-iron-950 tw-relative lg:tw-border lg:tw-border-l-0 lg:tw-border-r lg:tw-border-solid tw-border-iron-900 tw-border-y-0">
        <div className="tw-relative tw-h-full">
          <div className="tw-h-full tw-w-full tw-flex tw-items-stretch">
            <div className={containerClassName} style={containerStyle}>
              <div
                className={`tw-flex-1 tw-min-h-0 ${isApp ? "tw-mb-8" : ""}`}>
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
                className={`${
                  isApp
                    ? "tw-fixed tw-bottom-0 tw-left-0 tw-right-0 tw-bg-iron-950 tw-z-10"
                    : "tw-mt-auto"
                }`}>
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

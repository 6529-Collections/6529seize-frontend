"use client";

import React, { useMemo, useState } from "react";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import type { ApiWave } from "@/generated/models/ApiWave";
import useDeviceInfo from "@/hooks/useDeviceInfo";
import { useApprovalWaveStatus } from "@/hooks/waves/useApprovalWaveStatus";
import WaveDropsAll from "../drops/wave-drops-all";
import {
  CreateDropWaveWrapper,
  CreateDropWaveWrapperContext,
} from "../CreateDropWaveWrapper";
import type { ActiveDropState } from "@/types/dropInteractionTypes";
import { ActiveDropAction } from "@/types/dropInteractionTypes";
import PrivilegedDropCreator from "../PrivilegedDropCreator";
import { useAndroidKeyboard } from "@/hooks/useAndroidKeyboard";
import { DropMode } from "../dropComposer.types";
import { WaveDropLayerProvider } from "../drops/WaveDropLayerContext";

interface SingleWaveDropChatProps {
  readonly wave: ApiWave;
  readonly drop: ApiDrop;
}

export const SingleWaveDropChat: React.FC<SingleWaveDropChatProps> = ({
  wave,
  drop,
}) => {
  const { isApp } = useDeviceInfo();
  const { isVisible: isKeyboardVisible } = useAndroidKeyboard();

  // Apply Android keyboard adjustments to the fixed input area
  const inputContainerStyle = useMemo(() => {
    return {
      paddingBottom: isKeyboardVisible
        ? "0px"
        : "calc(env(safe-area-inset-bottom))",
    };
  }, [isKeyboardVisible]);

  const [activeDrop, setActiveDrop] = useState<ActiveDropState | null>({
    action: ActiveDropAction.REPLY,
    drop: drop,
    partId: 1,
  });
  const { winningThreshold, isVotingControlsLocked } = useApprovalWaveStatus({
    wave,
  });
  const fixedDropMode = isVotingControlsLocked ? DropMode.CHAT : DropMode.BOTH;

  const handleDropAction = ({
    targetDrop,
    partId,
    action,
  }: {
    targetDrop: ApiDrop;
    partId: number;
    action: ActiveDropAction;
  }) => {
    setActiveDrop({ action, drop: targetDrop, partId });
  };

  const resetActiveDrop = () => {
    setActiveDrop({
      action: ActiveDropAction.REPLY,
      drop: drop,
      partId: 1,
    });
  };

  return (
    <WaveDropLayerProvider
      value={{
        mobileMenuZIndexClassName: "tw-z-[1020]",
        mobileDialogZIndexClassName: "tw-z-[1030]",
      }}
    >
      <div className="tw-flex tw-h-full tw-min-h-0 tw-flex-1 tw-flex-col">
        <div className="tw-relative tw-flex tw-min-h-0 tw-flex-1 tw-flex-col tw-overflow-hidden tw-border-y-0 tw-border-l-0 tw-border-iron-800 tw-bg-iron-950 lg:tw-border lg:tw-border-r lg:tw-border-solid">
          <div className="tw-relative tw-flex tw-min-h-0 tw-flex-1 tw-flex-col">
            <div className="tw-flex tw-min-h-0 tw-w-full tw-flex-1 tw-flex-col">
              <div className="tw-flex tw-min-h-0 tw-w-full tw-flex-1 tw-flex-col">
                <div className="tw-min-h-0 tw-flex-1">
                  <WaveDropsAll
                    waveId={wave.id}
                    onReply={({
                      drop: repliedDrop,
                      partId,
                    }: {
                      drop: ApiDrop;
                      partId: number;
                    }) =>
                      handleDropAction({
                        targetDrop: repliedDrop,
                        partId,
                        action: ActiveDropAction.REPLY,
                      })
                    }
                    activeDrop={activeDrop}
                    initialDrop={null}
                    unreadCount={wave.metrics.your_unread_drops_count}
                    dropId={drop.id}
                    isMuted={wave.metrics.muted}
                    winningThreshold={winningThreshold}
                    isVotingClosed={isVotingControlsLocked}
                  />
                </div>
                <div
                  style={
                    isApp
                      ? inputContainerStyle
                      : {
                          paddingBottom: "calc(env(safe-area-inset-bottom))",
                        }
                  }
                  className="tw-mt-auto"
                >
                  <CreateDropWaveWrapper
                    context={CreateDropWaveWrapperContext.SINGLE_DROP}
                  >
                    <PrivilegedDropCreator
                      activeDrop={activeDrop}
                      onCancelReplyQuote={resetActiveDrop}
                      onDropAddedToQueue={resetActiveDrop}
                      wave={wave}
                      dropId={drop.id}
                      fixedDropMode={fixedDropMode}
                    />
                  </CreateDropWaveWrapper>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </WaveDropLayerProvider>
  );
};

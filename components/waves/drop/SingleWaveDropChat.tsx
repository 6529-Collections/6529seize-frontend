"use client";

import React, { useMemo, useState } from "react";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import type { ApiWave } from "@/generated/models/ApiWave";
import useDeviceInfo from "@/hooks/useDeviceInfo";
import WaveDropsAll from "../drops/wave-drops-all";
import {
  CreateDropWaveWrapper,
  CreateDropWaveWrapperContext,
} from "../CreateDropWaveWrapper";
import type { ActiveDropState } from "@/types/dropInteractionTypes";
import { ActiveDropAction } from "@/types/dropInteractionTypes";
import PrivilegedDropCreator from "../PrivilegedDropCreator";
import { useNativeKeyboard } from "@/hooks/useNativeKeyboard";
import { DropMode } from "../dropComposer.types";
import { WaveDropLayerProvider } from "../drops/WaveDropLayerContext";
import { useWaveEligibility } from "@/contexts/wave/WaveEligibilityContext";

interface SingleWaveDropChatProps {
  readonly wave: ApiWave;
  readonly drop: ApiDrop;
  readonly winningThreshold?: number | null | undefined;
  readonly winningThresholdMinDurationMs?: number | null | undefined;
  readonly isVotingClosed?: boolean | undefined;
  readonly isVotingControlsLocked?: boolean | undefined;
}

export const SingleWaveDropChat: React.FC<SingleWaveDropChatProps> = ({
  wave,
  drop,
  winningThreshold = null,
  winningThresholdMinDurationMs = null,
  isVotingClosed = false,
  isVotingControlsLocked = false,
}) => {
  const { isApp } = useDeviceInfo();
  const nativeKeyboard = useNativeKeyboard();
  const { updateEligibility } = useWaveEligibility();
  const isKeyboardOccupyingViewport =
    nativeKeyboard.isVisible ||
    nativeKeyboard.phase === "hiding" ||
    nativeKeyboard.keyboardHeight > 0;

  // Drop safe-area padding as soon as the native keyboard starts moving.
  const inputContainerStyle = useMemo(() => {
    return {
      paddingBottom: isKeyboardOccupyingViewport
        ? "0px"
        : "calc(env(safe-area-inset-bottom))",
    };
  }, [isKeyboardOccupyingViewport]);

  const [activeDrop, setActiveDrop] = useState<ActiveDropState | null>({
    action: ActiveDropAction.REPLY,
    drop: drop,
    partId: 1,
  });
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

  React.useEffect(() => {
    updateEligibility(wave.id, {
      authenticated_user_eligible_to_chat:
        wave.chat.authenticated_user_eligible,
      authenticated_user_eligible_to_vote:
        wave.voting.authenticated_user_eligible,
      authenticated_user_eligible_to_participate:
        wave.participation.authenticated_user_eligible,
      authenticated_user_admin: wave.wave.authenticated_user_eligible_for_admin,
    });
  }, [updateEligibility, wave]);

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
                    wave={wave}
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
                    winningThresholdMinDurationMs={
                      winningThresholdMinDurationMs
                    }
                    isVotingClosed={isVotingClosed}
                    isVotingControlsLocked={isVotingControlsLocked}
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
                      fixedDropMode={DropMode.CHAT}
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

"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
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
import { useAuth } from "@/components/auth/Auth";
import type { WsDropDeleteMessage } from "@/helpers/Types";
import { WsMessageType } from "@/helpers/Types";
import { t } from "@/i18n/messages";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { useWebSocketMessage } from "@/services/websocket/useWebSocketMessage";
import { REPLY_TARGET_UNAVAILABLE_TOAST_ID } from "../create-drop-content/reply-target-unavailable";

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
  const { isVisible: isKeyboardVisible } = useNativeKeyboard();
  const { updateEligibility } = useWaveEligibility();
  const { setToast } = useAuth();
  const locale = useBrowserLocale();
  const rootDropAvailableRef = useRef(true);

  // Drop safe-area padding as soon as the native keyboard starts moving.
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
  const activeDropRef = useRef(activeDrop);

  useEffect(() => {
    rootDropAvailableRef.current = true;
  }, [drop.id]);

  useEffect(() => {
    activeDropRef.current = activeDrop;
  }, [activeDrop]);

  const handleDropAction = useCallback(
    ({
      targetDrop,
      partId,
      action,
    }: {
      targetDrop: ApiDrop;
      partId: number;
      action: ActiveDropAction;
    }) => {
      setActiveDrop({ action, drop: targetDrop, partId });
    },
    []
  );

  const clearUnavailableReplyTarget = useCallback(() => {
    setActiveDrop(null);
  }, []);

  const resetActiveDrop = useCallback(() => {
    if (!rootDropAvailableRef.current) {
      setActiveDrop(null);
      return;
    }

    setActiveDrop({
      action: ActiveDropAction.REPLY,
      drop: drop,
      partId: 1,
    });
  }, [drop]);

  useWebSocketMessage<WsDropDeleteMessage["data"]>(
    WsMessageType.DROP_DELETE,
    useCallback(
      (messageData) => {
        if (messageData.wave_id !== wave.id) {
          return;
        }

        const deletedRootDrop = messageData.drop_id === drop.id;
        if (deletedRootDrop) {
          rootDropAvailableRef.current = false;
        }

        if (
          activeDropRef.current?.drop.id !== messageData.drop_id &&
          !deletedRootDrop
        ) {
          return;
        }

        setActiveDrop(null);
        setToast({
          type: "warning",
          title: t(locale, "waves.chat.replyTargetDeletedToast.title"),
          description: t(
            locale,
            "waves.chat.replyTargetDeletedToast.description"
          ),
          toastId: REPLY_TARGET_UNAVAILABLE_TOAST_ID,
        });
      },
      [drop.id, locale, setToast, wave.id]
    )
  );

  React.useEffect(() => {
    updateEligibility(wave.id, {
      authenticated_user_eligible_to_chat:
        wave.chat?.authenticated_user_eligible ?? false,
      authenticated_user_eligible_to_vote:
        wave.voting?.authenticated_user_eligible ?? false,
      authenticated_user_eligible_to_participate:
        wave.participation?.authenticated_user_eligible ?? false,
      authenticated_user_admin:
        wave.wave?.authenticated_user_eligible_for_admin ?? false,
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
                      onReplyTargetUnavailable={clearUnavailableReplyTarget}
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

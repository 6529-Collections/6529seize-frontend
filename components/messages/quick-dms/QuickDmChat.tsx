"use client";

import MyStreamWaveChat from "@/components/brain/my-stream/MyStreamWaveChat";
import { useMyStream } from "@/contexts/wave/MyStreamContext";
import { useWaveEligibility } from "@/contexts/wave/WaveEligibilityContext";
import type { MinimalWave } from "@/contexts/wave/hooks/useEnhancedWavesListCore";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import { getMessagePathRoute } from "@/helpers/navigation.helpers";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { useWaveData } from "@/hooks/useWaveData";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { getDropQueryKey } from "@/services/api/drop-api";
import { useDmUnreadConversation } from "@/services/dm-unread/DmUnreadStateProvider";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import type React from "react";
import { useCallback, useEffect, useRef } from "react";
import {
  QuickDmHeaderAvatar,
  QuickDmLoadingRows,
  QuickDmPanelHeader,
} from "./QuickDmPanelPieces";
import {
  getFormattedWaveName,
  getQuickDmAvatarSource,
} from "./QuickDirectMessagesUtils";

interface QuickDmChatProps {
  readonly hasUnreadOutsideCurrentChat: boolean;
  readonly listWave: MinimalWave | null;
  readonly locale: SupportedLocale;
  readonly onBack: () => void;
  readonly onClose: () => void;
  readonly onOpenAll: () => void;
  readonly waveId: string;
}

const CHAT_PANEL_STYLE: React.CSSProperties = {
  height: "100%",
  maxHeight: "100%",
};

export const QuickDmChat = ({
  hasUnreadOutsideCurrentChat,
  listWave,
  locale,
  onBack,
  onClose,
  onOpenAll,
  waveId,
}: QuickDmChatProps) => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { directMessages, registerWave } = useMyStream();
  const markDirectMessageRead = directMessages.markWaveRead;
  const { updateEligibility } = useWaveEligibility();
  const { data: wave, isFetching, isError } = useWaveData({ waveId });
  const unreadConversation = useDmUnreadConversation(waveId);
  const title = getFormattedWaveName({
    name: wave?.name ?? listWave?.name ?? "",
  });
  const avatar = getQuickDmAvatarSource(title, listWave, wave);
  const listUnreadCount = unreadConversation?.unread_count ?? 0;
  const hasMarkedInitialReadRef = useRef<string | null>(null);
  let chatContent: React.ReactNode = null;

  const markQuickDmRead = useCallback(() => {
    if (
      typeof document === "undefined" ||
      document.visibilityState !== "visible"
    ) {
      return;
    }

    markDirectMessageRead(waveId, unreadConversation?.latest_drop_serial_no);
  }, [
    markDirectMessageRead,
    unreadConversation?.latest_drop_serial_no,
    waveId,
  ]);

  useEffect(() => {
    const shouldMarkRead =
      hasMarkedInitialReadRef.current !== waveId || listUnreadCount > 0;

    hasMarkedInitialReadRef.current = waveId;
    if (!shouldMarkRead) {
      return;
    }

    queueMicrotask(markQuickDmRead);
  }, [listUnreadCount, markQuickDmRead, waveId]);

  useEffect(() => {
    registerWave(waveId, true);
  }, [registerWave, waveId]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        markQuickDmRead();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [markQuickDmRead]);

  useEffect(() => {
    if (!wave) {
      return;
    }

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

  const openDropInMessages = useCallback(
    (drop: ExtendedDrop) => {
      queryClient.setQueryData<ApiDrop>(getDropQueryKey(drop.id), drop);
      router.push(
        `${getMessagePathRoute(waveId)}?drop=${encodeURIComponent(drop.id)}`
      );
    },
    [queryClient, router, waveId]
  );

  if (wave) {
    chatContent = (
      <MyStreamWaveChat
        wave={wave}
        firstUnreadSerialNo={listWave?.firstUnreadDropSerialNo ?? null}
        viewMode="chat"
        onDropClick={openDropInMessages}
        waveViewStyleOverride={CHAT_PANEL_STYLE}
        composerDensity="compact"
      />
    );
  } else if (isFetching) {
    chatContent = <QuickDmLoadingRows locale={locale} />;
  } else if (isError) {
    chatContent = (
      <div className="tw-flex tw-h-full tw-items-center tw-justify-center tw-bg-iron-950 tw-p-8 tw-text-center tw-text-sm tw-leading-5 tw-text-iron-300">
        {t(locale, "quickDm.chatLoadError")}
      </div>
    );
  }

  return (
    <div className="tw-flex tw-h-[560px] tw-max-h-[calc(100dvh-8rem)] tw-w-[380px] tw-flex-col tw-overflow-hidden tw-rounded-xl tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-950 tw-shadow-[0_24px_80px_rgba(0,0,0,0.55)]">
      <QuickDmPanelHeader
        hasBackUnreadIndicator={hasUnreadOutsideCurrentChat}
        locale={locale}
        title={title || t(locale, "quickDm.chatTitleFallback")}
        avatar={avatar ? <QuickDmHeaderAvatar avatar={avatar} /> : undefined}
        openAllHref={getMessagePathRoute(waveId)}
        onBack={onBack}
        onClose={onClose}
        onOpenAll={onOpenAll}
      />
      <div className="tw-min-h-0 tw-flex-1 tw-bg-iron-950">{chatContent}</div>
    </div>
  );
};

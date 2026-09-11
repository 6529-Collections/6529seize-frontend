"use client";

import { useCallback, useEffect, useRef } from "react";
import { flushSync } from "react-dom";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import type { NotificationDisplayItem } from "@/types/feed.types";
import type { ActiveDropState } from "@/types/dropInteractionTypes";
import { ActiveDropAction } from "@/types/dropInteractionTypes";
import type { DropInteractionParams } from "@/components/waves/drops/Drop";
import NotificationItems from "./NotificationItems";
import { useRouter } from "next/navigation";
import useDeviceInfo from "@/hooks/useDeviceInfo";
import { getWaveRoute } from "@/helpers/navigation.helpers";
import { usePrefetchWaveData } from "@/hooks/usePrefetchWaveData";

type WaveWithChatScope = ExtendedDrop["wave"] & {
  is_direct_message?: boolean | undefined;
  chat?:
    | {
        scope?:
          | {
              group?:
                | {
                    is_direct_message?: boolean | undefined;
                  }
                | undefined;
            }
          | undefined;
      }
    | undefined;
};

const hasChatScope = (wave: ExtendedDrop["wave"]): wave is WaveWithChatScope =>
  "chat" in wave || "is_direct_message" in wave;

interface NotificationsWrapperProps {
  readonly items: NotificationDisplayItem[];
  readonly loadingOlder: boolean;
  readonly activeDrop: ActiveDropState | null;
  readonly setActiveDrop: (drop: ActiveDropState | null) => void;
  readonly markNotificationIdsAsRead?: (ids: number[]) => Promise<void>;
}

export default function NotificationsWrapper({
  items,
  loadingOlder,
  activeDrop,
  setActiveDrop,
  markNotificationIdsAsRead,
}: NotificationsWrapperProps) {
  const router = useRouter();
  const { isApp } = useDeviceInfo();
  const prefetchWaveData = usePrefetchWaveData();
  const keyboardPrimerRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (activeDrop || document.activeElement !== keyboardPrimerRef.current) {
      return;
    }

    keyboardPrimerRef.current?.blur();
  }, [activeDrop]);

  const focusKeyboardPrimer = useCallback(() => {
    keyboardPrimerRef.current?.focus({ preventScroll: true });
  }, []);

  const onDropContentClick = useCallback(
    (drop: ExtendedDrop) => {
      if (!drop.wave.id) {
        return;
      }

      const isDirectMessage = hasChatScope(drop.wave)
        ? (drop.wave.chat?.scope?.group?.is_direct_message ??
          drop.wave.is_direct_message ??
          false)
        : false;

      const href = getWaveRoute({
        waveId: drop.wave.id,
        serialNo: drop.serial_no,
        isDirectMessage,
        isApp,
      });

      router.push(href);
    },
    [router, isApp]
  );

  const onReply = useCallback(
    (param: DropInteractionParams) => {
      const nextActiveDrop = {
        action: ActiveDropAction.REPLY,
        drop: param.drop,
        partId: param.partId,
      };
      prefetchWaveData(param.drop.wave.id);

      if (isApp) {
        // WKWebView only opens the soft keyboard when focus starts inside the
        // user gesture. This hidden textarea is already mounted; the real
        // Lexical editor takes focus during the synchronous reply render.
        focusKeyboardPrimer();
        flushSync(() => {
          setActiveDrop(nextActiveDrop);
        });
        return;
      }

      setActiveDrop(nextActiveDrop);
    },
    [focusKeyboardPrimer, isApp, prefetchWaveData, setActiveDrop]
  );

  return (
    <div className="tw-relative tw-flex tw-flex-col tw-gap-3">
      {isApp && (
        <textarea
          ref={keyboardPrimerRef}
          tabIndex={-1}
          aria-hidden="true"
          autoCapitalize="none"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          className="tw-pointer-events-none tw-fixed tw-bottom-0 tw-left-0 tw-h-px tw-w-px tw-opacity-0"
        />
      )}
      {loadingOlder && (
        <div className="tw-flex tw-w-full tw-justify-center tw-py-3">
          <div className="tw-flex tw-items-center tw-gap-2 tw-text-xs tw-uppercase tw-tracking-wide tw-text-iron-400">
            <span className="tw-inline-flex tw-h-4 tw-w-4 tw-animate-spin tw-rounded-full tw-border-2 tw-border-iron-400 tw-border-t-transparent" />
            <span>Loading older notifications...</span>
          </div>
        </div>
      )}
      <NotificationItems
        items={items}
        activeDrop={activeDrop}
        onReply={onReply}
        onDropContentClick={onDropContentClick}
        onMarkGroupAsRead={markNotificationIdsAsRead}
      />
    </div>
  );
}

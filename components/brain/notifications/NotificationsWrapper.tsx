"use client";

import { useCallback } from "react";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import type { TypedNotification } from "@/types/feed.types";
import type {
  ActiveDropState} from "@/types/dropInteractionTypes";
import {
  ActiveDropAction
} from "@/types/dropInteractionTypes";
import type { DropInteractionParams } from "@/components/waves/drops/Drop";
import NotificationItems from "./NotificationItems";
import { useRouter } from "next/navigation";
import useDeviceInfo from "@/hooks/useDeviceInfo";
import { getWaveRoute } from "@/helpers/navigation.helpers";

type WaveWithChatScope = ExtendedDrop["wave"] & {
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
  typeof wave === "object" && wave !== null && "chat" in wave;

interface NotificationsWrapperProps {
  readonly items: TypedNotification[];
  readonly loadingOlder: boolean;
  readonly activeDrop: ActiveDropState | null;
  readonly setActiveDrop: (drop: ActiveDropState | null) => void;
}

export default function NotificationsWrapper({
  items,
  loadingOlder,
  activeDrop,
  setActiveDrop,
}: NotificationsWrapperProps) {
  const router = useRouter();
  const { isApp } = useDeviceInfo();

  const onDropContentClick = useCallback(
    (drop: ExtendedDrop) => {
      if (!drop?.wave?.id) {
        return;
      }

      const isDirectMessage = hasChatScope(drop.wave)
        ? drop.wave.chat?.scope?.group?.is_direct_message ?? false
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
      setActiveDrop({
        action: ActiveDropAction.REPLY,
        drop: param.drop,
        partId: param.partId,
      });
    },
    [setActiveDrop]
  );

  const onQuote = useCallback(
    (param: DropInteractionParams) => {
      setActiveDrop({
        action: ActiveDropAction.QUOTE,
        drop: param.drop,
        partId: param.partId,
      });
    },
    [setActiveDrop]
  );

  return (
    <div className="tw-relative tw-flex tw-flex-col tw-gap-3">
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
        onQuote={onQuote}
        onDropContentClick={onDropContentClick}
      />
    </div>
  );
}

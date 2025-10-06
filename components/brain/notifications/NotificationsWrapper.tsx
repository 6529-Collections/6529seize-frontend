"use client";

import React, { useCallback } from "react";
import { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { TypedNotification } from "@/types/feed.types";
import {
  ActiveDropAction,
  ActiveDropState,
} from "@/types/dropInteractionTypes";
import { DropInteractionParams } from "@/components/waves/drops/Drop";
import NotificationItems from "./NotificationItems";
import { useRouter } from "next/navigation";

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

  const onDropContentClick = useCallback(
    (drop: ExtendedDrop) => {
      router.push(
        `/my-stream?wave=${drop.wave.id}&serialNo=${drop.serial_no}/`
      );
    },
    [router]
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

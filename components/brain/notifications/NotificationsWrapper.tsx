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
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import useDeviceInfo from "@/hooks/useDeviceInfo";
import { getWaveRoute } from "@/helpers/navigation.helpers";

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
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const onDropContentClick = useCallback(
    (drop: ExtendedDrop) => {
      // In notifications route, open drop in-place as a modal
      if (pathname === "/notifications") {
        const params = new URLSearchParams(searchParams?.toString() || "");
        params.set("drop", drop.id);
        const newUrl = `${pathname}?${params.toString()}`;
        router.push(newUrl, { scroll: false });
        return;
      }

      // Otherwise, navigate to the appropriate wave route
      const waveInfo = drop.wave as any;
      const isDirectMessage =
        waveInfo?.chat?.scope?.group?.is_direct_message ?? false;

      const href = getWaveRoute({
        waveId: drop.wave.id,
        serialNo: drop.serial_no,
        isDirectMessage,
        isApp,
      });

      router.push(href);
    },
    [router, isApp, pathname, searchParams]
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

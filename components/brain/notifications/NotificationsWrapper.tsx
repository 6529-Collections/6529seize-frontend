"use client";

import React from "react";
import { ExtendedDrop } from "../../../helpers/waves/drop.helpers";
import { TypedNotification } from "../../../types/feed.types";
import {
  ActiveDropAction,
  ActiveDropState,
} from "../../../types/dropInteractionTypes";
import { DropInteractionParams } from "../../waves/drops/Drop";
import NotificationItems from "./NotificationItems";
import { useRouter } from "next/router";

interface NotificationsWrapperProps {
  readonly items: TypedNotification[];
  readonly loading: boolean;
  readonly activeDrop: ActiveDropState | null;
  readonly setActiveDrop: (drop: ActiveDropState | null) => void;
}

export default function NotificationsWrapper({
  items,
  loading,
  activeDrop,
  setActiveDrop,
}: NotificationsWrapperProps) {
  const router = useRouter();

  const onDropContentClick = (drop: ExtendedDrop) => {
    router.push(
      `/my-stream?wave=${drop.wave.id}&serialNo=${drop.serial_no}/`,
      undefined,
      { shallow: true }
    );
  };

  const onReply = (param: DropInteractionParams) => {
    setActiveDrop({
      action: ActiveDropAction.REPLY,
      drop: param.drop,
      partId: param.partId,
    });
  };

  const onQuote = (param: DropInteractionParams) => {
    setActiveDrop({
      action: ActiveDropAction.QUOTE,
      drop: param.drop,
      partId: param.partId,
    });
  };

  return (
    <div className="tw-relative">
      {loading && (
        <div className="tw-w-full tw-py-8">
          <div className="tw-flex tw-flex-col tw-items-center tw-justify-center tw-gap-3">
            <div className="tw-animate-spin">
              <svg
                className="tw-w-8 tw-h-8 tw-text-iron-500"
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24">
                <circle
                  className="tw-opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="tw-opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            </div>
            <div className="tw-text-iron-400 tw-text-sm">
              Loading notifications...
            </div>
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

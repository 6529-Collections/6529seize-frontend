"use client";

import { useUnreadDividerVisibility } from "./useUnreadDividerVisibility";
import { WaveDropsScrollControlsBottomButton } from "./WaveDropsScrollControlsBottomButton";
import { WaveDropsScrollControlsUnreadButton } from "./WaveDropsScrollControlsUnreadButton";

import type { FC, RefObject } from "react";

interface WaveDropsScrollControlsProps {
  readonly unreadDividerSerialNo: number | null;
  readonly unreadCount?: number | undefined;
  readonly scrollContainerRef: RefObject<HTMLDivElement | null>;
  readonly onScrollToUnread: (serialNo: number) => void;
  readonly onDismissUnread: () => void;
  readonly isAtBottom: boolean;
  readonly scrollToBottom: () => void;
  readonly newMessagesCount: number;
  readonly onRevealNewMessages?: (() => void) | undefined;
}

export const WaveDropsScrollControls: FC<WaveDropsScrollControlsProps> = ({
  unreadDividerSerialNo,
  unreadCount,
  scrollContainerRef,
  onScrollToUnread,
  onDismissUnread,
  isAtBottom,
  scrollToBottom,
  newMessagesCount,
  onRevealNewMessages,
}) => {
  const { unreadPosition, isUnreadVisible, dismissUnread } =
    useUnreadDividerVisibility({
      unreadDividerSerialNo,
      scrollContainerRef,
      onDismissUnread,
    });

  const hasPending = newMessagesCount > 0;
  const isBottomVisible = hasPending || !isAtBottom;
  const isCombined = isUnreadVisible && isBottomVisible;

  if (!isUnreadVisible && !isBottomVisible) {
    return null;
  }

  const isPointingUp = unreadPosition === "above";
  const combinedWidthClassName = "tw-w-12 tw-min-w-0 tw-px-0";

  if (isCombined) {
    return (
      <div className="tw-absolute tw-bottom-3 tw-right-2 tw-z-[49] tw-flex tw-flex-col tw-items-stretch lg:tw-right-6">
        <WaveDropsScrollControlsUnreadButton
          unreadDividerSerialNo={unreadDividerSerialNo}
          unreadCount={unreadCount}
          isPointingUp={isPointingUp}
          isCombined={true}
          combinedWidthClassName={combinedWidthClassName}
          roundedClassName="tw-rounded-t-full tw-rounded-b-none"
          onScrollToUnread={onScrollToUnread}
          onDismissUnread={dismissUnread}
        />
        <WaveDropsScrollControlsBottomButton
          hasPending={hasPending}
          newMessagesCount={newMessagesCount}
          isCombined={true}
          combinedWidthClassName={combinedWidthClassName}
          roundedClassName="tw-rounded-b-full tw-rounded-t-none"
          onRevealNewMessages={onRevealNewMessages}
          scrollToBottom={scrollToBottom}
        />
      </div>
    );
  }

  if (isUnreadVisible) {
    return (
      <div className="tw-absolute tw-bottom-14 tw-right-2 tw-z-[49] tw-flex-shrink-0 lg:tw-bottom-12 lg:tw-right-6">
        <WaveDropsScrollControlsUnreadButton
          unreadDividerSerialNo={unreadDividerSerialNo}
          unreadCount={unreadCount}
          isPointingUp={isPointingUp}
          isCombined={false}
          combinedWidthClassName={combinedWidthClassName}
          roundedClassName="tw-rounded-full"
          onScrollToUnread={onScrollToUnread}
          onDismissUnread={dismissUnread}
        />
      </div>
    );
  }

  return (
    <div className="tw-absolute tw-bottom-3 tw-right-2 tw-z-[49] lg:tw-right-6">
      <WaveDropsScrollControlsBottomButton
        hasPending={hasPending}
        newMessagesCount={newMessagesCount}
        isCombined={false}
        combinedWidthClassName={combinedWidthClassName}
        roundedClassName="tw-rounded-full"
        onRevealNewMessages={onRevealNewMessages}
        scrollToBottom={scrollToBottom}
      />
    </div>
  );
};

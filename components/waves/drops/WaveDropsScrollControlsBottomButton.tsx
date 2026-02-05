"use client";

import { formatCountLabel } from "./wave-drops-scroll-controls.utils";

interface WaveDropsScrollControlsBottomButtonProps {
  readonly hasPending: boolean;
  readonly newMessagesCount: number;
  readonly isCombined: boolean;
  readonly combinedWidthClassName: string;
  readonly roundedClassName: string;
  readonly onRevealNewMessages?: (() => void) | undefined;
  readonly scrollToBottom: () => void;
}

export function WaveDropsScrollControlsBottomButton({
  hasPending,
  newMessagesCount,
  isCombined,
  combinedWidthClassName,
  roundedClassName,
  onRevealNewMessages,
  scrollToBottom,
}: WaveDropsScrollControlsBottomButtonProps) {
  const bottomArrowIcon = (
    <svg
      className="tw-size-4 tw-flex-shrink-0"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M19 14l-7 7m0 0l-7-7m7 7V3"
      />
    </svg>
  );

  const newMessagesCountLabel =
    formatCountLabel(newMessagesCount) ?? newMessagesCount;

  let bottomContent = bottomArrowIcon;

  if (!isCombined && hasPending) {
    bottomContent = (
      <span className="tw-text-sm tw-font-medium">{newMessagesCountLabel}</span>
    );
  }

  const handleBottomClick = () => {
    if (hasPending && onRevealNewMessages) {
      onRevealNewMessages();
      return;
    }
    scrollToBottom();
  };

  return (
    <button
      onClick={handleBottomClick}
      className={`tw-flex tw-h-10 tw-min-w-[2.75rem] tw-flex-shrink-0 tw-items-center tw-justify-center tw-gap-2 tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-700 tw-px-4 tw-text-iron-300 tw-transition-all tw-duration-300 hover:tw-border-iron-650 hover:tw-bg-iron-650 lg:tw-h-8 ${roundedClassName} ${isCombined ? combinedWidthClassName : ""}`}
      aria-label={hasPending ? "Reveal new messages" : "Scroll to bottom"}
    >
      {bottomContent}
    </button>
  );
}

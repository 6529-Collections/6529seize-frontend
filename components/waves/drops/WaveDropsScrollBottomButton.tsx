import type { FC } from "react";

interface WaveDropsScrollBottomButtonProps {
  readonly isAtBottom: boolean;
  readonly scrollToBottom: () => void;
  readonly newMessagesCount?: number | undefined;
  readonly onRevealNewMessages?: (() => void) | undefined;
}

export const WaveDropsScrollBottomButton: FC<
  WaveDropsScrollBottomButtonProps
> = ({
  isAtBottom,
  scrollToBottom,
  newMessagesCount = 0,
  onRevealNewMessages,
}) => {
  const hasPending = newMessagesCount > 0;
  if (!hasPending && isAtBottom) return null;

  const handleClick = () => {
    if (hasPending && onRevealNewMessages) {
      onRevealNewMessages();
      return;
    }
    scrollToBottom();
  };

  return (
    <button
      onClick={handleClick}
      className="tw-flex-shrink-0 tw-absolute tw-z-[49] tw-bottom-3 tw-right-2 lg:tw-right-6 tw-rounded-full tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-700 tw-text-iron-300 tw-min-w-[2.75rem] tw-h-10 lg:tw-h-8 tw-px-4 tw-flex tw-items-center tw-justify-center tw-gap-2 hover:tw-bg-iron-650 hover:tw-border-iron-650 tw-transition-all tw-duration-300"
      aria-label={hasPending ? "Reveal new messages" : "Scroll to bottom"}
    >
      {hasPending ? (
        <>
          <span className="tw-text-sm tw-font-medium">{`${newMessagesCount} new ${
            newMessagesCount === 1 ? "message" : "messages"
          }`}</span>
          <svg
            className="tw-flex-shrink-0 tw-size-3"
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
        </>
      ) : (
        <svg
          className="tw-flex-shrink-0 tw-size-4"
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
      )}
    </button>
  );
};

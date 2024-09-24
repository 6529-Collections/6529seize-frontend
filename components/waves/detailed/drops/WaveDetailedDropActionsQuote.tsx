import React from "react";
import Tippy from "@tippyjs/react";
import "tippy.js/dist/tippy.css";
import { Drop } from "../../../../generated/models/Drop";

interface WaveDetailedDropActionsQuoteProps {
  readonly drop: Drop;
  readonly onQuote: () => void;
  readonly activePartIndex: number;
}

const WaveDetailedDropActionsQuote: React.FC<
  WaveDetailedDropActionsQuoteProps
> = ({ onQuote, drop, activePartIndex }) => {
  const canQuote = drop.wave.authenticated_user_eligible_to_participate;
  const quotesCount = drop.parts[activePartIndex].quotes_count;
  const contextProfileQuoted =
    !!drop.parts[activePartIndex].context_profile_context?.quotes_count;
  const isTemporaryDrop = drop.id.startsWith("temp-");
  const isQuoteAllowed = canQuote && !isTemporaryDrop;

  return (
    <Tippy
      content={
        <div className="tw-text-center">
          <span className="tw-text-xs tw-font-normal tw-text-center tw-w-full tw-transition tw-duration-300 tw-ease-out">
            {isQuoteAllowed ? "Quote" : "You can't quote this drop"}
          </span>
        </div>
      }
      placement="top"
      disabled={isTemporaryDrop}
    >
      <div>
        <button
          className={`tw-text-iron-500 icon tw-px-2 tw-h-full tw-group tw-bg-transparent tw-rounded-full tw-border-0 tw-flex tw-items-center tw-gap-x-1.5 tw-text-xs tw-leading-5 tw-font-medium tw-transition tw-ease-out tw-duration-300 ${
            !isQuoteAllowed
              ? "tw-opacity-50 tw-cursor-default"
              : "tw-cursor-pointer"
          }`}
          onClick={isQuoteAllowed ? onQuote : undefined}
          disabled={!isQuoteAllowed}
        >
          <svg
            className={`tw-flex-shrink-0 tw-w-5 tw-h-5 tw-transition tw-ease-out tw-duration-300 ${
              !isQuoteAllowed ? "tw-opacity-50" : ""
            }`}
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M4.9486 14.4306C4.45605 15.6736 3.67749 16.904 2.63489 18.0883C2.3031 18.4652 2.26098 19.0031 2.53015 19.4268C2.73742 19.7528 3.08606 19.9384 3.4552 19.9384C3.5592 19.9384 3.66504 19.9238 3.76941 19.8934C5.97913 19.2478 11.1335 16.9546 11.272 9.62448C11.3254 6.79404 9.25526 4.3624 6.55958 4.08847C5.07385 3.93978 3.5874 4.42245 2.48584 5.41818C1.38281 6.41501 0.75 7.8381 0.75 9.32309C0.75 11.8005 2.50854 13.967 4.9486 14.4306ZM3.49145 6.53109C4.19201 5.89791 5.07385 5.56063 6.00879 5.56063C6.14099 5.56063 6.27429 5.56722 6.40796 5.58114C8.33313 5.77632 9.8108 7.54 9.77198 9.59591C9.6764 14.6679 6.93018 16.9513 4.65601 17.9726C5.37561 16.9992 5.94104 15.998 6.34314 14.9832C6.49988 14.5881 6.47388 14.1465 6.27209 13.7715C6.06079 13.3781 5.68396 13.0991 5.23901 13.0057C3.50683 12.6435 2.25 11.0944 2.25 9.32308C2.25 8.26181 2.70263 7.24411 3.49145 6.53109Z"
              fill="currentColor"
            />
            <path
              d="M14.508 19.4271C14.7153 19.753 15.064 19.9387 15.4331 19.9387C15.5371 19.9387 15.6426 19.924 15.7473 19.8936C17.957 19.248 23.1111 16.9548 23.2495 9.62472C23.3022 6.79427 21.2324 4.36263 18.5364 4.08871C17.0488 3.93746 15.5649 4.42232 14.4634 5.41842C13.3604 6.41525 12.7275 7.83834 12.7275 9.32333C12.7275 11.8007 14.4861 13.9672 16.9258 14.4309C16.4329 15.6749 15.6543 16.9054 14.6121 18.089C14.2803 18.4661 14.2385 19.0037 14.508 19.4271ZM18.3203 14.9842C18.477 14.5891 18.4514 14.1474 18.25 13.7724C18.0383 13.3787 17.6618 13.0997 17.2165 13.0059C15.4844 12.6438 14.2275 11.0947 14.2275 9.32333C14.2275 8.26168 14.6802 7.24435 15.469 6.53133C16.1692 5.89815 17.051 5.56087 17.9863 5.56087C18.1181 5.56087 18.2515 5.56746 18.3855 5.58137C20.3103 5.77656 21.7883 7.54024 21.7495 9.59615C21.6543 14.6685 18.9077 16.9515 16.6335 17.9729C17.3528 17.0002 17.9175 15.999 18.3203 14.9842Z"
              fill="currentColor"
            />
          </svg>
          {!!quotesCount && (
            <span className={contextProfileQuoted ? "tw-text-blue-500" : ""}>
              {quotesCount}
            </span>
          )}
        </button>
      </div>
    </Tippy>
  );
};

export default WaveDetailedDropActionsQuote;

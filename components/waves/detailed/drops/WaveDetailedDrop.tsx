import { useState } from "react";
import WaveDetailedDropActions from "./WaveDetailedDropActions";
import WaveDetailedDropReply from "./WaveDetailedDropReply";
import WaveDetailedDropContent from "./WaveDetailedDropContent";
import WaveDetailedDropHeader from "./WaveDetailedDropHeader";
import WaveDetailedDropAuthorPfp from "./WaveDetailedDropAuthorPfp";
import WaveDetailedDropRatings from "./WaveDetailedDropRatings";
import { ActiveDropState } from "../WaveDetailedContent";
import { ExtendedDrop } from "../../../../helpers/waves/drop.helpers";
import WaveDetailedDropMetadata from "./WaveDetailedDropMetadata";
import { Drop } from "../../../../generated/models/Drop";
import CommonDropdownItemsMobileWrapper from "../../../utils/select/dropdown/CommonDropdownItemsMobileWrapper";
import { createPortal } from "react-dom";
import useIsMobileDevice from "../../../../hooks/isMobileDevice";

enum GroupingThreshold {
  TIME_DIFFERENCE = 60000,
}

const shouldGroupWithDrop = (
  currentDrop: ExtendedDrop,
  otherDrop: ExtendedDrop | null
): boolean => {
  if (!otherDrop || currentDrop.parts.length > 1) {
    return false;
  }

  const isSameAuthor = currentDrop.author.handle === otherDrop.author.handle;
  const isWithinTimeThreshold =
    Math.abs(currentDrop.created_at - otherDrop.created_at) <=
    GroupingThreshold.TIME_DIFFERENCE;

  if (!isSameAuthor || !isWithinTimeThreshold) {
    return false;
  }

  const bothNotReplies = !currentDrop.reply_to && !otherDrop.reply_to;
  const repliesInSameThread =
    currentDrop.reply_to?.drop_id === otherDrop.reply_to?.drop_id;

  return bothNotReplies || repliesInSameThread;
};

interface WaveDetailedDropProps {
  readonly drop: ExtendedDrop;
  readonly previousDrop: ExtendedDrop | null;
  readonly nextDrop: ExtendedDrop | null;
  readonly showWaveInfo: boolean;
  readonly activeDrop: ActiveDropState | null;
  readonly showReplyAndQuote: boolean;
  readonly onReply: ({
    drop,
    partId,
  }: {
    drop: ExtendedDrop;
    partId: number;
  }) => void;
  readonly onQuote: ({
    drop,
    partId,
  }: {
    drop: ExtendedDrop;
    partId: number;
  }) => void;

  readonly onReplyClick: (serialNo: number) => void;
  readonly onQuoteClick: (drop: Drop) => void;
}

export default function WaveDetailedDrop({
  drop,
  previousDrop,
  nextDrop,
  showWaveInfo,
  activeDrop,
  onReply,
  onQuote,
  onReplyClick,
  onQuoteClick,
  showReplyAndQuote,
}: WaveDetailedDropProps) {
  const [activePartIndex, setActivePartIndex] = useState<number>(0);
  const [isSlideUp, setIsSlideUp] = useState(false);

  const isActiveDrop = activeDrop?.drop.id === drop.id;
  const isStorm = drop.parts.length > 1;

  const shouldGroupWithPreviousDrop = shouldGroupWithDrop(drop, previousDrop);
  const shouldGroupWithNextDrop = shouldGroupWithDrop(drop, nextDrop);

  const isMobile = useIsMobileDevice(); // Detect if it's a mobile device

  const getGroupingClass = () => {
    if (shouldGroupWithPreviousDrop) return "";
    if (shouldGroupWithNextDrop) return "tw-pt-4";
    return "tw-py-4";
  };

  const groupingClass = getGroupingClass();

  const onLongPress = () => {
    console.log("onLongPress");
    setIsSlideUp(true);
  };
  return (
    <div
      className={`tw-relative tw-group tw-w-full tw-flex tw-flex-col tw-px-4 tw-rounded-xl tw-transition-colors tw-duration-300 ${
        isActiveDrop
          ? "tw-bg-[#3CCB7F]/10 tw-border-l-2 tw-border-l-[#3CCB7F] tw-border-solid tw-border-y-0 tw-border-r-0"
          : "tw-bg-iron-950"
      } ${groupingClass}`}
    >
      {drop.reply_to &&
        drop.reply_to.drop_id !== previousDrop?.reply_to?.drop_id && (
          <WaveDetailedDropReply
            onReplyClick={onReplyClick}
            dropId={drop.reply_to.drop_id}
            dropPartId={drop.reply_to.drop_part_id}
            maybeDrop={
              drop.reply_to.drop
                ? { ...drop.reply_to.drop, wave: drop.wave }
                : null
            }
          />
        )}
      <div className="tw-flex tw-gap-x-3">
        {!shouldGroupWithPreviousDrop && (
          <WaveDetailedDropAuthorPfp drop={drop} />
        )}
        <div
          className={`${
            shouldGroupWithPreviousDrop ? "" : "tw-mt-1"
          } tw-flex tw-flex-col tw-w-full`}
        >
          {!shouldGroupWithPreviousDrop && (
            <WaveDetailedDropHeader
              drop={drop}
              showWaveInfo={showWaveInfo}
              isStorm={isStorm}
              currentPartIndex={activePartIndex}
              partsCount={drop.parts.length}
            />
          )}
          <div className={shouldGroupWithPreviousDrop ? "tw-ml-[52px]" : ""}>
            <WaveDetailedDropContent
              drop={drop}
              activePartIndex={activePartIndex}
              setActivePartIndex={setActivePartIndex}
              // onDropClick={() => onReply({ drop, partId: drop.parts[activePartIndex].part_id })}
              onDropClick={onLongPress}
              onQuoteClick={onQuoteClick}
            />
          </div>
        </div>
      </div>
      {!isMobile &&
        showReplyAndQuote && ( // Hide actions if mobile
          <WaveDetailedDropActions
            drop={drop}
            activePartIndex={activePartIndex}
            onReply={() =>
              onReply({ drop, partId: drop.parts[activePartIndex].part_id })
            }
            onQuote={() =>
              onQuote({ drop, partId: drop.parts[activePartIndex].part_id })
            }
          />
        )}
      <div className="tw-flex tw-w-full tw-justify-end tw-items-center tw-gap-x-2">
        {drop.metadata.length > 0 && (
          <WaveDetailedDropMetadata metadata={drop.metadata} />
        )}
        {!!drop.raters_count && <WaveDetailedDropRatings drop={drop} />}
      </div>
      {createPortal(
        <CommonDropdownItemsMobileWrapper
          isOpen={isSlideUp}
          setOpen={setIsSlideUp}
        >
          <div className="tw-grid tw-grid-cols-1 tw-gap-y-2">
            <button className="tw-border-0 tw-flex tw-items-center tw-gap-x-4 tw-p-4 tw-bg-iron-950 tw-rounded-xl active:tw-bg-iron-800 tw-transition-colors tw-duration-200">
              <svg
                className="tw-flex-shrink-0 tw-w-5 tw-h-5 tw-text-iron-300"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M7.49 12 3.74 8.248m0 0 3.75-3.75m-3.75 3.75h16.5V19.5"
                />
              </svg>
              <span className="tw-text-iron-300 tw-font-semibold tw-text-base">
                Reply
              </span>
            </button>
            <button className="tw-border-0 tw-flex tw-items-center tw-gap-x-4 tw-p-4 tw-bg-iron-950 tw-rounded-xl active:tw-bg-iron-800 tw-transition-colors tw-duration-200">
              <svg
                className="tw-flex-shrink-0 tw-w-5 tw-h-5 tw-text-iron-300"
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
              <span className="tw-text-iron-300 tw-font-semibold tw-text-base">
                Quote
              </span>
            </button>
            <button className="tw-border-0 tw-flex tw-items-center tw-gap-x-4 tw-p-4 tw-bg-iron-950 tw-rounded-xl active:tw-bg-iron-800 tw-transition-colors tw-duration-200">
              <svg
                className="tw-flex-shrink-0 tw-w-5 tw-h-5 tw-text-iron-300"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244"
                />
              </svg>
              <span className="tw-text-iron-300 tw-font-semibold tw-text-base">
                Copy link
              </span>
            </button>
            <button className="tw-border-0 tw-flex tw-items-center tw-gap-x-4 tw-p-4 tw-bg-iron-950 tw-rounded-xl active:tw-bg-iron-800 tw-transition-colors tw-duration-200">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
                className="tw-size-5 tw-flex-shrink-0 tw-text-iron-300"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM3 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 9.374 21c-2.331 0-4.512-.645-6.374-1.766Z"
                />
              </svg>

              <span className="tw-text-iron-300 tw-font-semibold tw-text-base">
                Follow
              </span>
            </button>
            <div className="tw-w-full tw-border-t tw-border-x-0 tw-border-b-0 tw-border-iron-800 tw-border-solid">
              <button className="tw-mt-2 tw-border-0 tw-w-full tw-flex tw-items-center tw-gap-x-4 tw-p-4 tw-bg-iron-950 tw-rounded-xl active:tw-bg-red/10 tw-transition-colors tw-duration-200">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="1.5"
                  stroke="currentColor"
                  className="tw-flex-shrink-0 tw-size-5 tw-text-red"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
                  />
                </svg>
                <span className="tw-text-red tw-font-semibold tw-text-base">
                  Delete
                </span>
              </button>
            </div>
          </div>
        </CommonDropdownItemsMobileWrapper>,
        document.body
      )}
    </div>
  );
}

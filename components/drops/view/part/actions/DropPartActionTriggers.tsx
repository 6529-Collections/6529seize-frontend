import { DropPart } from "../../../../../generated/models/DropPart";
import DiscussOutlineIcon from "../../../../utils/icons/DiscussOutlineIcon";
import DiscussSolidIcon from "../../../../utils/icons/DiscussSolidIcon";

export default function DropPartActionTriggers({
  dropPart,
  isDiscussionOpen,
  setIsDiscussionOpen,
  onQuote,
}: {
  readonly dropPart: DropPart;
  readonly isDiscussionOpen: boolean;
  readonly setIsDiscussionOpen: (open: boolean) => void;
  readonly onQuote: (dropPartId: number) => void;
}) {
  const discussionCount = dropPart.discussion_comments_count;
  const quotesCount = dropPart.quotes_count;
  const userHaveDiscussed =
    !!dropPart.context_profile_context?.discussion_comments_count;

  const userHaveQuoted = !!dropPart.context_profile_context?.quotes_count;
  return (
    <div className="tw-pt-4 tw-gap-x-8 tw-flex tw-items-center">
      <button
        onClick={() => setIsDiscussionOpen(!isDiscussionOpen)}
        type="button"
        className="tw-text-iron-500 icon tw-px-0 tw-group tw-bg-transparent tw-border-0 tw-inline-flex tw-items-center tw-gap-x-2 
        tw-text-[0.8125rem] tw-leading-5 tw-font-medium tw-transition tw-ease-out tw-duration-300"
      >
        <>
          {userHaveDiscussed ? <DiscussSolidIcon /> : <DiscussOutlineIcon />}
          <span className="tw-text-iron-500 tw-hidden sm:tw-block tw-transition tw-ease-out tw-duration-300">
            Discuss
          </span>
          {!!discussionCount && (
            <div className="tw-flex tw-items-center tw-justify-center tw-rounded-full tw-bg-iron-900 tw-ring-1 tw-ring-inset tw-ring-iron-700 tw-h-5 tw-px-1 tw-min-w-[1.25rem] tw-text-iron-400 tw-text-xs tw-font-medium">
              {discussionCount}
            </div>
          )}
        </>
      </button>
      <button
        onClick={() => onQuote(dropPart.part_id)}
        type="button"
        className="tw-text-iron-500 icon tw-px-0 tw-group tw-bg-transparent tw-border-0 tw-inline-flex tw-items-center tw-gap-x-2 tw-text-[0.8125rem] tw-leading-5 tw-font-medium tw-transition tw-ease-out tw-duration-300"
      >
        <>
          <svg
            className={`${
              userHaveQuoted ? "tw-text-primary-400" : ""
            } tw-flex-shrink-0 tw-w-5 tw-h-5 tw-transition tw-ease-out tw-duration-300`}
            viewBox="0 0 512 512"
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fill="currentColor"
              d="m123.19 137.32 33.81 33.85c9.51 9.51 25.31 9.74 34.64.05a24 24 0 0 0 -.32-33.61l-74.68-74.78a24.67 24.67 0 0 0 -34.9 0l-74.74 74.76a24 24 0 0 0 34 33.94l34.21-34.21v230a89.16 89.16 0 0 0 89.06 89.06h127.73a24 24 0 0 0 0-48h-127.73a41.11 41.11 0 0 1 -41.06-41.06z"
            ></path>
            <path
              fill="currentColor"
              d="m388.81 374.68-33.81-33.85c-9.51-9.51-25.31-9.74-34.64-.05a24 24 0 0 0 .32 33.61l74.72 74.78a24.67 24.67 0 0 0 34.9 0l74.7-74.76a24 24 0 0 0 -34-33.94l-34.21 34.21v-230a89.16 89.16 0 0 0 -89.06-89.08h-127.73a24 24 0 0 0 0 48h127.73a41.11 41.11 0 0 1 41.06 41.06z"
            ></path>
          </svg>
          <span className="tw-text-iron-500 tw-hidden sm:tw-block tw-transition tw-ease-out tw-duration-300">
            Redrop
          </span>
          {!!quotesCount && (
            <div className="tw-flex tw-items-center tw-justify-center tw-rounded-full tw-bg-iron-900 tw-ring-1 tw-ring-inset tw-ring-iron-700 tw-h-5 tw-px-1 tw-min-w-[1.25rem] tw-text-iron-400 tw-text-xs tw-font-medium">
              {quotesCount}
            </div>
          )}
        </>
      </button>
    </div>
  );
}

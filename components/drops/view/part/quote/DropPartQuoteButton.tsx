import Tippy from "@tippyjs/react";
import { DropPart } from "../../../../../generated/models/DropPart";

export default function DropPartQuoteButton({
  dropPart,
  onQuote,
}: {
  readonly dropPart: DropPart;
  readonly onQuote: (dropPartId: number) => void;
}) {
  const quotesCount = dropPart.quotes_count;
  const userHaveQuoted = !!dropPart.context_profile_context?.quotes_count;
  return (
    <Tippy content="Quote">
      <button
        onClick={(e) => {
          e.stopPropagation();
          onQuote(dropPart.part_id);
        }}
        type="button"
        className="tw-text-iron-500 icon tw-p-0 tw-group tw-bg-transparent tw-border-0 tw-inline-flex tw-items-center tw-gap-x-2 tw-text-[0.8125rem] tw-leading-5 tw-font-normal tw-transition tw-ease-out tw-duration-300"
      >
        <svg
          className={`${
            userHaveQuoted ? "tw-text-primary-400" : ""
          } tw-flex-shrink-0 tw-w-5 tw-h-5 tw-transition tw-ease-out tw-duration-300`}
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth="1.5"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19.5 12c0-1.232-.046-2.453-.138-3.662a4.006 4.006 0 0 0-3.7-3.7 48.678 48.678 0 0 0-7.324 0 4.006 4.006 0 0 0-3.7 3.7c-.017.22-.032.441-.046.662M19.5 12l3-3m-3 3-3-3m-12 3c0 1.232.046 2.453.138 3.662a4.006 4.006 0 0 0 3.7 3.7 48.656 48.656 0 0 0 7.324 0 4.006 4.006 0 0 0 3.7-3.7c.017-.22.032-.441.046-.662M4.5 12l3 3m-3-3-3 3"
          />
        </svg>
        {!!quotesCount && (
          <div className="tw-flex tw-items-center tw-justify-center tw-rounded-full tw-text-iron-500 tw-text-xs tw-font-normal">
            {quotesCount}
          </div>
        )}
      </button>
    </Tippy>
  );
}

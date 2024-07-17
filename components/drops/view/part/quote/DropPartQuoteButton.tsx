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
    <button
      onClick={() => onQuote(dropPart.part_id)}
      type="button"
      title="Redrop"
      className="tw-text-iron-500 icon tw-p-0 tw-group tw-bg-transparent tw-border-0 tw-inline-flex tw-items-center tw-gap-x-2 tw-text-[0.8125rem] tw-leading-5 tw-font-normal tw-transition tw-ease-out tw-duration-300"
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
        {!!quotesCount && (
          <div className="tw-flex tw-items-center tw-justify-center tw-rounded-full tw-text-iron-500 tw-text-xs tw-font-normal">
            {quotesCount}
          </div>
        )}
      </>
    </button>
  );
}

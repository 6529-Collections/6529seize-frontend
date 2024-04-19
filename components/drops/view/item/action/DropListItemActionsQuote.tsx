import { DropFull } from "../../../../../entities/IDrop";
import DropListItemActionsItemWrapper from "./DropListItemActionsItemWrapper";

export default function DropListItemActionsQuote({
  drop,
  isQuoteMode,
  setIsQuoteMode,
}: {
  readonly drop: DropFull;
  readonly isQuoteMode: boolean;
  readonly setIsQuoteMode: (newState: boolean) => void;
}) {
  const userHaveQuoted = !!drop.quote_count_by_input_profile;
  return (
    <DropListItemActionsItemWrapper
      state={!isQuoteMode}
      setState={setIsQuoteMode}
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
        <span className="tw-text-iron-400 tw-hidden sm:tw-block tw-transition tw-ease-out tw-duration-300">
          Redrop
        </span>
        {!!drop.quote_count && (
          <div className="tw-flex tw-items-center tw-justify-center tw-rounded-full tw-bg-iron-800 tw-ring-1 tw-ring-inset tw-ring-white/5 tw-h-5 tw-px-1 tw-min-w-[1.25rem] tw-text-iron-300 tw-text-xs tw-font-medium">
            {drop.quote_count}
          </div>
        )}
      </>
    </DropListItemActionsItemWrapper>
  );
}
import { Drop } from "../../../../../../generated/models/Drop";
import { formatNumberWithCommas } from "../../../../../../helpers/Helpers";
import Tippy from "@tippyjs/react";

export default function DropPartActionTriggersVoteVotings({
  drop,
}: {
  readonly drop: Drop;
}) {
  return (
    <div className="tw-flex tw-items-center tw-justify-center tw-rounded-full tw-text-iron-500 tw-text-xs tw-font-normal">
      {!!drop.rating && (
        <Tippy content="Total">
          <span>{formatNumberWithCommas(drop.rating)}</span>
        </Tippy>
      )}
      {!!drop.context_profile_context?.rating && (
        <div
          className={`${
            drop.context_profile_context.rating > 0
              ? "tw-bg-green/10"
              : "tw-bg-red/10"
          } tw-ml-2 tw-rounded-full tw-w-auto tw-px-1 tw-transition tw-ease-out tw-duration-300`}
        >
          <Tippy content="Your given votes">
            <span
              className={`${
                drop.context_profile_context.rating > 0
                  ? "tw-text-green"
                  : "tw-text-error"
              }`}
            >
              {formatNumberWithCommas(drop.context_profile_context.rating)}
            </span>
          </Tippy>
        </div>
      )}
    </div>
  );
}

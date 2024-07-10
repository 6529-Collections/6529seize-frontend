import Tippy from "@tippyjs/react";
import { Drop } from "../../../../../../generated/models/Drop";
import { formatNumberWithCommas } from "../../../../../../helpers/Helpers";

export default function DropPartActionTriggersVoteVoters({
  drop,
}: {
  readonly drop: Drop;
}) {
  const label = drop.raters_count === 1 ? "rater" : "raters";

  return (
    <div className="tw-flex tw-items-center tw-gap-x-2">
      <div className="tw-flex -tw-space-x-2">
        {drop.top_raters.map((rater) => (
          <Tippy
            key={rater.profile.id}
            content={`${rater.profile.handle} - ${rater.rating}`}
          >
            <div>
              {rater.profile.pfp ? (
                <img
                  src={rater.profile.pfp}
                  alt=""
                  className="tw-inline-block tw-h-5 tw-w-5 tw-rounded-md tw-ring-2 tw-ring-black"
                />
              ) : (
                <div className="tw-inline-block tw-h-5 tw-w-5 tw-rounded-md tw-ring-2 tw-ring-black" />
              )}
            </div>
          </Tippy>
        ))}
      </div>
      <span className="tw-text-iron-500 tw-text-xs tw-font-normal">
        {formatNumberWithCommas(drop.raters_count)} {label}
      </span>
    </div>
  );
}

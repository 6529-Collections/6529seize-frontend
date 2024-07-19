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
      <div className="tw-flex tw-items-center -tw-space-x-2">
        {drop.top_raters.map((rater) => (
          <Tippy
            key={rater.profile.id}
            content={`${rater.profile.handle} - ${rater.rating}`}
          >
            {rater.profile.pfp ? (
              <img
                src={rater.profile.pfp}
                alt="Profile Picture"
                className="tw-h-5 tw-w-5 tw-rounded-md tw-ring-1 tw-ring-black tw-bg-iron-800"
              />
            ) : (
              <div className="tw-h-5 tw-w-5 tw-rounded-md tw-ring-1 tw-ring-black tw-bg-iron-800" />
            )}
          </Tippy>
        ))}
      </div>
      <span className="tw-text-iron-500 tw-text-xs tw-font-normal">
        {formatNumberWithCommas(drop.raters_count)} {label}
      </span>
    </div>
  );
}

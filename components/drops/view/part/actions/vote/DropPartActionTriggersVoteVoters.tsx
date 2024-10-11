import Tippy from "@tippyjs/react";
import { ApiDrop } from "../../../../../../generated/models/ApiDrop";
import { formatNumberWithCommas } from "../../../../../../helpers/Helpers";
import {
  getScaledImageUri,
  ImageScale,
} from "../../../../../../helpers/image.helpers";

export default function DropPartActionTriggersVoteVoters({
  drop,
}: {
  readonly drop: ApiDrop;
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
                src={getScaledImageUri(
                  rater.profile.pfp,
                  ImageScale.W_AUTO_H_50
                )}
                alt="Profile Picture"
                className="tw-h-5 tw-w-5 tw-rounded-md tw-ring-1 tw-ring-black tw-bg-iron-700"
              />
            ) : (
              <div className="tw-h-5 tw-w-5 tw-rounded-md tw-ring-1 tw-ring-black tw-bg-iron-700" />
            )}
          </Tippy>
        ))}
      </div>
      <span className="tw-text-iron-500 tw-text-xs tw-font-normal">
        {formatNumberWithCommas(drop.raters_count)} {label}
      </span>
      <div className="tw-size-[3px] tw-bg-iron-600 tw-rounded-full tw-flex-shrink-0"></div>
    </div>
  );
}

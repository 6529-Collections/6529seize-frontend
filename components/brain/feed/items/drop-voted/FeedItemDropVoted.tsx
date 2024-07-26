import Link from "next/link";
import { IFeedItemDropVoted } from "../../../../../types/feed.types";
import {
  getTimeAgoShort,
  numberWithCommas,
} from "../../../../../helpers/Helpers";
import RateClapOutlineIcon from "../../../../utils/icons/RateClapOutlineIcon";
import DropsListItem from "../../../../drops/view/item/DropsListItem";
import {
  getScaledImageUri,
  ImageScale,
} from "../../../../../helpers/image.helpers";

export default function FeedItemDropVoted({
  item,
  showWaveInfo,
  availableCredit,
}: {
  readonly item: IFeedItemDropVoted;
  readonly showWaveInfo: boolean;
  readonly availableCredit: number | null;
}) {
  const getVoteColor = (vote: number) => {
    if (vote > 0) {
      return "tw-text-green";
    }
    if (vote < 0) {
      return "tw-text-red";
    }
    return "tw-text-iron-500";
  };

  return (
    <div className="tw-flex tw-gap-x-3 tw-w-full">
      <div className="tw-space-y-2 tw-w-full">
        <div className="tw-inline-flex tw-items-center">
          <div className="md:tw-absolute md:-tw-left-12 tw-flex-shrink-0 tw-h-8 tw-w-8 tw-rounded-full tw-bg-iron-800 tw-flex tw-items-center tw-justify-center">
            <div className="tw-h-[1.15rem] tw-w-[1.15rem] -tw-mt-2.5 tw-text-iron-300">
              <RateClapOutlineIcon />
            </div>
          </div>
          <div className="tw-flex tw-gap-x-2 tw-items-center">
            <div className="tw-h-7 tw-w-7">
              {item.item.vote.voter.pfp ? (
                <img
                  src={getScaledImageUri(
                    item.item.vote.voter.pfp,
                    ImageScale.W_AUTO_H_50
                  )}
                  alt="#"
                  className="tw-flex-shrink-0 tw-object-contain tw-h-full tw-w-full tw-rounded-md tw-bg-iron-800 tw-ring-1 tw-ring-iron-700"
                />
              ) : (
                <div className="tw-flex-shrink-0 tw-object-contain tw-h-full tw-w-full tw-rounded-md tw-bg-iron-800 tw-ring-1 tw-ring-iron-700" />
              )}
            </div>
            <span className="tw-text-sm tw-font-normal tw-text-iron-50">
              <Link
                href={`/${item.item.vote.voter.handle}`}
                className="tw-no-underline tw-font-semibold"
              >
                {item.item.vote.voter.handle}
              </Link>{" "}
              rated
              <span
                className={`${getVoteColor(
                  item.item.vote.vote
                )} tw-pl-1 tw-font-medium`}
              >
                {item.item.vote.vote > 0 && "+"}
                {numberWithCommas(item.item.vote.vote)}
              </span>
            </span>
            <div className="tw-w-1 tw-h-1 tw-rounded-full tw-bg-iron-600"></div>
            <span className="tw-text-sm tw-text-iron-500 tw-font-normal">
              {getTimeAgoShort(item.item.vote.time)}
            </span>
          </div>
        </div>

        <DropsListItem
          drop={item.item.drop}
          showWaveInfo={showWaveInfo}
          availableCredit={availableCredit}
        />
      </div>
    </div>
  );
}

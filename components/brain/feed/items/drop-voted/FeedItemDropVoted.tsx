import Link from "next/link";
import { IFeedItemDropVoted } from "../../../../../types/feed.types";
import {
  numberWithCommas,
} from "../../../../../helpers/Helpers";
import RateClapOutlineIcon from "../../../../utils/icons/RateClapOutlineIcon";
import DropsListItem from "../../../../drops/view/item/DropsListItem";

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
    <div className="tw-flex tw-gap-x-3">
      <div className="tw-mt-0.5 tw-flex-1 tw-space-y-2">
        <div className="tw-inline-flex tw-items-center tw-space-x-2">
          <div className="md:tw-absolute md:-tw-left-10 tw-flex-shrink-0 tw-h-8 tw-w-8 tw-rounded-full tw-bg-iron-800 tw-flex tw-items-center tw-justify-center">
            <div className="tw-h-[1.15rem] tw-w-[1.15rem] -tw-mt-2.5 tw-text-iron-300">
              <RateClapOutlineIcon />
            </div>
          </div>
          <div className="tw-flex tw-gap-x-3 tw-items-center">
            <div className="tw-h-6 tw-w-6">
              {item.item.vote.voter.pfp ? (
                <img
                  src={item.item.vote.voter.pfp}
                  alt="#"
                  className="tw-flex-shrink-0 tw-object-contain tw-h-full tw-w-full tw-rounded-md tw-bg-iron-800 tw-ring-1 tw-ring-iron-700"
                />
              ) : (
                <div className="tw-flex-shrink-0 tw-object-contain tw-h-full tw-w-full tw-rounded-md tw-bg-iron-800 tw-ring-1 tw-ring-iron-700" />
              )}
            </div>
            <span className="tw-text-sm tw-font-medium tw-text-iron-50">
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

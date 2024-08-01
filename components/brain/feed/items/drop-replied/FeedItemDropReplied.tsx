import Link from "next/link";
import DropsListItem from "../../../../drops/view/item/DropsListItem";
import { getTimeAgoShort } from "../../../../../helpers/Helpers";
import {
  getScaledImageUri,
  ImageScale,
} from "../../../../../helpers/image.helpers";
import { IFeedItemDropReplied } from "../../../../../types/feed.types";

export default function FeedItemDropReplied({
  item,
  showWaveInfo,
  availableCredit,
}: {
  readonly item: IFeedItemDropReplied;
  readonly showWaveInfo: boolean;
  readonly availableCredit: number | null;
}) {
  return (
    <div className="tw-w-full tw-flex tw-gap-x-3">
      <div className="tw-w-full tw-flex tw-flex-col tw-space-y-3">
        <div className="tw-inline-flex tw-items-center">
          <div className="md:tw-absolute md:-tw-left-12 tw-flex-shrink-0 tw-h-8 tw-w-8 tw-rounded-full tw-bg-iron-800 tw-flex tw-items-center tw-justify-center">
            <svg
              className="tw-flex-shrink-0 tw-w-5 tw-h-5 tw-text-iron-300"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              aria-hidden="true"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 0 1-.825-.242m9.345-8.334a2.126 2.126 0 0 0-.476-.095 48.64 48.64 0 0 0-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0 0 11.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155"
              />
            </svg>
          </div>

          <div className="tw-flex tw-gap-x-2 tw-items-center">
            <div className="tw-h-7 tw-w-7">
              {item.item.reply.author.pfp ? (
                <img
                  src={getScaledImageUri(
                    item.item.reply.author.pfp,
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
                href={`/${item.item.reply.author.handle}`}
                className="tw-no-underline tw-font-semibold"
              >
                {item.item.reply.author.handle}
              </Link>{" "}
              replied
            </span>
            <div className="tw-w-1 tw-h-1 tw-rounded-full tw-bg-iron-600"></div>
            <span className="tw-text-sm tw-text-iron-500 tw-font-normal">
              {getTimeAgoShort(item.item.reply.created_at)}
            </span>
          </div>
        </div>

        <div className="tw-ml-12 tw-flex tw-items-stretch tw-gap-x-3">
          <div className="tw-bg-iron-700 tw-w-1 tw-flex-shrink-0"></div>
          <p className="tw-block tw-mb-0 tw-font-normal tw-text-iron-50 tw-text-md">
            {item.item.reply.parts[0].content}
          </p>
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

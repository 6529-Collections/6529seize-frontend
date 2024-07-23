import { IFeedItemWaveCreated } from "../../../../../types/feed.types";
import DropsListItem from "../../../../drops/view/item/DropsListItem";

export default function FeedItemWaveCreated({
  item,
  showWaveInfo,
  availableCredit,
}: {
  readonly item: IFeedItemWaveCreated;
  readonly showWaveInfo: boolean;
  readonly availableCredit: number | null;
}) {
  return (
    <div className="tw-flex tw-gap-x-3">
      <div className="tw-mt-0.5 tw-flex-1 tw-space-y-2">
        <div className="tw-inline-flex tw-items-center tw-space-x-2">
          <div className="md:tw-absolute md:-tw-left-10 tw-flex-shrink-0 tw-h-8 tw-w-8 tw-rounded-full tw-bg-iron-800 tw-flex tw-items-center tw-justify-center">
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
                d="M2 6C2.6 6.5 3.2 7 4.5 7C7 7 7 5 9.5 5C10.8 5 11.4 5.5 12 6C12.6 6.5 13.2 7 14.5 7C17 7 17 5 19.5 5C20.8 5 21.4 5.5 22 6M2 18C2.6 18.5 3.2 19 4.5 19C7 19 7 17 9.5 17C10.8 17 11.4 17.5 12 18C12.6 18.5 13.2 19 14.5 19C17 19 17 17 19.5 17C20.8 17 21.4 17.5 22 18M2 12C2.6 12.5 3.2 13 4.5 13C7 13 7 11 9.5 11C10.8 11 11.4 11.5 12 12C12.6 12.5 13.2 13 14.5 13C17 13 17 11 19.5 11C20.8 11 21.4 11.5 22 12"
              />
            </svg>
          </div>
          <span className="tw-text-sm tw-font-medium tw-text-iron-50">
            {item.item.author.handle} created a wave
          </span>
        </div>

        <DropsListItem
          drop={item.item.description_drop}
          showWaveInfo={showWaveInfo}
          availableCredit={availableCredit}
        />
      </div>
    </div>
  );
}

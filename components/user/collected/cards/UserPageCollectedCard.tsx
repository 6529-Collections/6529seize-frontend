import { CollectedCard } from "../../../../entities/IProfile";
import { formatNumberWithCommas } from "../../../../helpers/Helpers";

export default function UserPageCollectedCard({
  card,
}: {
  readonly card: CollectedCard;
}) {
  return (
    <div className="tw-cursor-pointer tw-bg-iron-900 tw-rounded-lg tw-overflow-hidden tw-px-2 tw-ring-1 tw-ring-inset tw-ring-iron-800 tw-transition tw-duration-500 tw-ease-out">
      <a className="tw-w-full tw-max-w-full">
        <div className="md:tw-h-[18.75rem] tw-text-center">
          <img
            src={card.img}
            alt={card.collection}
            className="tw-bg-transparent tw-max-w-full tw-max-h-[18.75rem] md:tw-max-h-full tw-h-auto tw-w-auto tw-mx-auto tw-object-contain"
          />
        </div>
      </a>
      <div className="tw-pt-4 tw-pb-4 tw-px-2">
        <span className="tw-text-md tw-font-medium tw-text-iron-50">
          {card.collection}
        </span>
        <div className="tw-pt-2 tw-flex tw-flex-col tw-gap-y-2 tw-divide-y tw-divide-solid tw-divide-iron-700 tw-divide-x-0">
          <div className="tw-flex tw-justify-between">
            <span className="tw-text-md tw-font-medium tw-text-iron-50">
              {card.token_name}
            </span>
            <span className="tw-text-md tw-font-medium tw-text-iron-400">
              {card.seized_count}x
            </span>
          </div>
          <div className="tw-pt-2 tw-flex tw-items-center tw-justify-between">
            <span className="tw-text-md tw-font-medium">
              <span className="tw-mr-2 tw-text-iron-50">
                {formatNumberWithCommas(+(card.tdh ?? 0).toFixed(0))}
              </span>
              <span className="tw-text-iron-400 ">TDH</span>
            </span>
            <span className="tw-text-md tw-font-medium">
              <span className="tw-mr-2  tw-text-iron-50">{card.rank}</span>
              <span className="tw-text-iron-400 ">Rank</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

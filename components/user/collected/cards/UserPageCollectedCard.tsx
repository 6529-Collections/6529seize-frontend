import Link from "next/link";
import {
  CollectedCard,
  CollectedCollectionType,
} from "../../../../entities/IProfile";
import { assertUnreachable } from "../../../../helpers/AllowlistToolHelpers";
import { formatNumberWithCommasOrDash } from "../../../../helpers/Helpers";

export default function UserPageCollectedCard({
  card,
  showDataRow,
}: {
  readonly card: CollectedCard;
  readonly showDataRow: boolean;
}) {
  const getPath = (): string => {
    const collection = Object.values(CollectedCollectionType).find(
      (c) => c === card.collection.toUpperCase()
    );
    if (!collection) return "";
    switch (collection) {
      case CollectedCollectionType.MEMES:
        return `/the-memes/${card.token_id}`;
      case CollectedCollectionType.GRADIENTS:
        return `/6529-gradient/${card.token_id}`;
      case CollectedCollectionType.MEMELAB:
        return `/meme-lab/${card.token_id}`;
      default:
        assertUnreachable(collection);
        return "";
    }
  };

  const path = getPath();

  return (
    <div className="tw-cursor-pointer tw-bg-gradient-to-br tw-from-iron-900 tw-to-white/5 tw-rounded-lg tw-overflow-hidden tw-px-2 tw-pt-2 tw-ring-1 tw-ring-inset tw-ring-iron-700 hover:tw-ring-iron-600/60 hover:tw-to-white/10 tw-transition-opacity tw-duration-500 tw-ease-out">
      <Link href={path} className="tw-w-full tw-max-w-full">
        <div className="md:tw-h-[18.75rem] tw-text-center">
          <img
            src={card.img}
            alt={card.collection}
            className="tw-bg-transparent tw-max-w-full tw-max-h-[18.75rem] md:tw-max-h-full tw-h-auto tw-w-auto tw-mx-auto tw-object-contain"
          />
        </div>
      </Link>
      <div className="tw-pt-4 tw-pb-4 tw-px-2">
        <span className="tw-text-md tw-font-medium tw-text-iron-300">
          {card.collection}
        </span>
        <div className="tw-pt-1.5 tw-flex tw-flex-col tw-gap-y-2.5 tw-divide-y tw-divide-solid tw-divide-iron-700 tw-divide-x-0">
          <div className="tw-flex tw-justify-between">
            <span className="tw-text-md tw-font-medium tw-text-iron-50">
              {card.token_name}
            </span>
            {!!card.seized_count && (
              <span className="tw-text-md tw-font-medium tw-text-iron-400">
                {card.seized_count}x
              </span>
            )}
          </div>
          {showDataRow && (
            <div className="tw-pt-2.5 tw-flex tw-items-center tw-justify-between">
              <span className="tw-text-md tw-font-medium">
                <span className="tw-mr-1 tw-text-iron-50">
                  {formatNumberWithCommasOrDash(+(card.tdh ?? 0).toFixed(0))}
                </span>
                <span className="tw-text-iron-400">TDH</span>
              </span>
              <span className="tw-text-md tw-font-medium">
                <span className="tw-mr-1 tw-text-iron-50">
                  {formatNumberWithCommasOrDash(card.rank ?? 0)}
                </span>
                <span className="tw-text-iron-400">Rank</span>
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

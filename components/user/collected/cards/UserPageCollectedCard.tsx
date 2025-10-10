import { CollectedCard, CollectedCollectionType } from "@/entities/IProfile";
import { ContractType } from "@/enums";
import { formatNumberWithCommasOrDash } from "@/helpers/Helpers";
import Link from "next/link";
import { COLLECTED_COLLECTIONS_META } from "../filters/user-page-collected-filters.helpers";

export default function UserPageCollectedCard({
  card,
  contractType,
  showDataRow,
  interactiveMode = "link",
  selected = false,
  onToggle,
  copiesMax = 1,
  qtySelected = 0,
}: {
  readonly card: CollectedCard;
  readonly contractType: ContractType;
  readonly showDataRow: boolean;
  readonly interactiveMode?: "link" | "select";
  readonly selected?: boolean;
  readonly onToggle?: () => void;
  readonly copiesMax?: number;
  readonly qtySelected?: number;
}) {
  const collectionMeta = COLLECTED_COLLECTIONS_META[card.collection];
  const path = `${collectionMeta.cardPath}/${card.token_id}`;

  const showSeizedCount =
    COLLECTED_COLLECTIONS_META[card.collection].dataRows.seizedCount &&
    !!card.seized_count;

  const getTdhDisplay = () => {
    if (card.collection === CollectedCollectionType.MEMELAB) {
      return "N/A";
    } else {
      return formatNumberWithCommasOrDash(+(card.tdh ?? 0).toFixed(0));
    }
  };

  const getRankDisplay = () => {
    if (card.collection === CollectedCollectionType.MEMELAB) {
      return "N/A";
    } else {
      return card.tdh ? formatNumberWithCommasOrDash(card.rank ?? 0) : "-";
    }
  };

  // shared card body
  const CardBody = (
    <div
      className={[
        "tw-cursor-pointer tw-flex tw-flex-col tw-bg-gradient-to-br tw-from-iron-900 tw-to-white/5 tw-rounded-lg tw-overflow-hidden tw-px-0.5 tw-pt-0.5 tw-transition tw-duration-300 tw-ease-out",
        selected
          ? "tw-ring-2 tw-ring-emerald-400/60 tw-ring-inset"
          : "tw-ring-1 tw-ring-inset tw-ring-iron-700 hover:tw-ring-iron-600/60 hover:tw-to-white/10",
      ].join(" ")}>
      <div className="tw-flex tw-flex-wrap">
        <div className="tw-w-full tw-max-w-full">
          <div className="tw-h-[200px] min-[800px]:tw-h-[250px] min-[1200px]:tw-h-[18.75rem] tw-text-center tw-flex tw-items-center tw-justify-center">
            <img
              src={card.img}
              alt={card.collection}
              className="tw-bg-transparent tw-max-w-full tw-max-h-full tw-h-auto tw-w-auto tw-mx-auto tw-object-contain"
            />
          </div>
        </div>
        <div className="tw-pt-3 tw-px-2 tw-flex tw-justify-between tw-items-center tw-w-full">
          <span className="tw-text-sm min-[1200px]:tw-text-md tw-font-medium tw-text-iron-400">
            {collectionMeta.label}
          </span>
          <span className="tw-text-sm min-[1200px]:tw-text-md tw-font-medium tw-text-iron-500">
            #{card.token_id}
          </span>
        </div>
      </div>
      <div className="tw-pt-2 tw-pb-4 tw-px-2 tw-self-end tw-w-full tw-h-full">
        <div className="tw-flex tw-flex-col tw-h-full tw-justify-between tw-gap-y-2.5 tw-divide-y tw-divide-solid tw-divide-iron-700 tw-divide-x-0">
          <div className="tw-flex tw-justify-between tw-gap-x-2">
            <span className="tw-text-sm min-[1200px]:tw-text-md tw-font-medium tw-text-iron-50">
              {card.token_name}
            </span>
            {showSeizedCount && (
              <span className="tw-text-sm min-[1200px]:tw-text-md tw-font-medium tw-text-iron-400">
                {formatNumberWithCommasOrDash(card.seized_count)}x
              </span>
            )}
          </div>
          {showDataRow && (
            <div className="tw-pt-2 tw-flex tw-items-center tw-justify-between">
              <span className="tw-text-sm min-[1200px]:tw-text-md tw-font-medium">
                <span className="tw-text-iron-400">TDH</span>
                <span className="tw-ml-1 tw-text-iron-50">
                  {getTdhDisplay()}
                </span>
              </span>
              <span className="tw-text-sm min-[1200px]:tw-text-md tw-font-medium">
                <span className="tw-text-iron-400">Rank</span>
                <span className="tw-ml-1 tw-text-iron-50">
                  {getRankDisplay()}
                </span>
              </span>
            </div>
          )}

          {interactiveMode === "select" && (
            <div className="tw-pt-2 tw-flex tw-items-center tw-justify-center tw-gap-x-2">
              <input
                checked={selected}
                id={`${card.collection}-${card.token_id}`}
                type="checkbox"
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded-sm focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                onSelect={onToggle}
                onChange={onToggle}
              />
              {contractType === ContractType.ERC1155 ? (
                <span className="tw-text-sm tw-font-medium">
                  {selected
                    ? `Selected ${qtySelected} / ${copiesMax}`
                    : copiesMax > 1
                    ? `Select (up to ${copiesMax})`
                    : "Select"}
                </span>
              ) : (
                <span className="tw-text-sm tw-font-medium">
                  {selected ? "Selected" : "Select"}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  if (interactiveMode === "select") {
    return (
      <div
        className="tw-no-underline"
        role="button"
        tabIndex={0}
        onClick={onToggle}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onToggle?.();
          }
        }}
        aria-pressed={selected}>
        {CardBody}
      </div>
    );
  }

  return (
    <Link href={path} className="tw-no-underline">
      {CardBody}
    </Link>
  );
}

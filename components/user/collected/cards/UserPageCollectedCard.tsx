import CircleLoader, {
  CircleLoaderSize,
} from "@/components/distribution-plan-tool/common/CircleLoader";
import type { CollectedCard} from "@/entities/IProfile";
import { CollectedCollectionType } from "@/entities/IProfile";
import { ContractType } from "@/enums";
import { formatNumberWithCommasOrDash } from "@/helpers/Helpers";
import {
  faCheck,
  faMinusCircle,
  faPlus,
  faPlusCircle,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";
import { useId, useState } from "react";
import { Tooltip } from "react-tooltip";
import { COLLECTED_COLLECTIONS_META } from "../filters/user-page-collected-filters.helpers";

export default function UserPageCollectedCard({
  card,
  contractType,
  showDataRow,
  interactiveMode = "link",
  selected = false,
  onToggle,
  onIncQty,
  onDecQty,
  copiesMax,
  qtySelected = 0,
  isTransferLoading = false,
}: {
  readonly card: CollectedCard;
  readonly contractType: ContractType;
  readonly showDataRow: boolean;
  readonly interactiveMode?: "link" | "select" | undefined;
  readonly selected?: boolean | undefined;
  readonly onToggle: () => void;
  readonly onIncQty: () => void;
  readonly onDecQty: () => void;
  readonly copiesMax: number;
  readonly qtySelected?: number | undefined;
  readonly isTransferLoading?: boolean | undefined;
}) {
  const collectionMeta = COLLECTED_COLLECTIONS_META[card.collection];
  const path = `${collectionMeta.cardPath}/${card.token_id}`;
  const tooltipId = useId();
  const isSelectMode = interactiveMode === "select";
  const canSelect = copiesMax > 0;
  const isSelectModeAndCanSelect = isSelectMode && canSelect;
  const isSelectable = !selected && canSelect;
  const isNotSelectable = !selected && !canSelect;
  const isSelectedAndCanSelect = canSelect && selected;
  const hasBalanceMismatch =
    isSelectMode && copiesMax !== (card.seized_count ?? 0);

  const [isImageLoaded, setIsImageLoaded] = useState(false);

  const showSeizedCount =
    COLLECTED_COLLECTIONS_META[card.collection].dataRows.seizedCount &&
    !!card.seized_count;

  const getSeizedCountDisplay = () => {
    if (isSelectMode) {
      return formatNumberWithCommasOrDash(copiesMax);
    }
    return formatNumberWithCommasOrDash(card.seized_count ?? 0);
  };

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

  const OverlayControls = isSelectMode ? (
    <div
      className={[
        "tw-absolute tw-inset-0 tw-pointer-events-none",
        "tw-flex tw-items-start tw-justify-end",
        "tw-p-2",
      ].join(" ")}>
      {isNotSelectable && (
        <div className="tw-pointer-events-auto tw-absolute tw-inset-0 tw-flex tw-items-start tw-justify-center tw-p-2">
          <div className="tw-bg-iron-900/95 tw-text-iron-300 tw-text-xs tw-font-medium tw-px-3 tw-py-1.5 tw-rounded-md tw-ring-1 tw-ring-white/20 tw-opacity-75 group-hover:tw-opacity-100 tw-transition-opacity tw-duration-200">
            {isTransferLoading ? (
              <div className="tw-flex tw-items-center tw-gap-1">
                <span>Loading</span>
                <CircleLoader size={CircleLoaderSize.SMALL} />
              </div>
            ) : (
              "Not owned by your connected wallet"
            )}
          </div>
        </div>
      )}
      {isSelectable && (
        <button
          type="button"
          aria-label="Select"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onToggle();
          }}
          className={[
            "tw-flex tw-pointer-events-auto tw-border-none",
            "tw-items-center tw-justify-center",
            "tw-h-9 tw-w-9 tw-rounded-full",
            "tw-bg-iron-900/90 hover:tw-bg-primary-500/75",
            "tw-ring-1 tw-ring-white/30",
          ].join(" ")}>
          <FontAwesomeIcon icon={faPlus} className="tw-size-5" color="#fff" />
        </button>
      )}

      {isSelectedAndCanSelect && (
        <div className="tw-pointer-events-auto tw-flex tw-items-center tw-gap-2">
          {contractType === ContractType.ERC1155 ? (
            <div
              className={[
                "tw-flex tw-items-center tw-justify-center tw-gap-1.5",
                "tw-bg-primary-500 tw-backdrop-blur tw-rounded-full tw-p-2",
                "tw-mt-[2px] tw-font-medium",
              ].join(" ")}>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (qtySelected <= 1) {
                    onDecQty();
                    onToggle();
                  } else {
                    onDecQty();
                  }
                }}
                aria-label="Decrease quantity"
                className="tw-flex tw-items-center tw-bg-transparent tw-border-none tw-p-0 focus:tw-outline-none">
                <FontAwesomeIcon
                  icon={faMinusCircle}
                  className="tw-size-5"
                  color="#fff"
                />
              </button>
              <div className="tw-min-w-[2ch] tw-text-center tw-text-sm tw-tabular-nums tw-text-white">
                {qtySelected}/{copiesMax}
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (qtySelected < copiesMax) onIncQty();
                }}
                disabled={qtySelected >= copiesMax}
                aria-label="Increase quantity"
                className="tw-flex tw-items-center tw-bg-transparent tw-border-none tw-p-0 focus:tw-outline-none disabled:tw-opacity-50">
                <FontAwesomeIcon
                  icon={faPlusCircle}
                  className="tw-size-5"
                  color="#fff"
                />
              </button>
            </div>
          ) : (
            <button
              type="button"
              aria-label="Deselect"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onToggle();
              }}
              className={[
                "tw-flex tw-items-center tw-justify-center",
                "tw-h-9 tw-w-9 tw-rounded-full tw-bg-primary-500 hover:tw-bg-primary-600",
                "tw-ring-1 tw-ring-white/30",
              ].join(" ")}>
              <FontAwesomeIcon icon={faCheck} className="tw-size-5" />
            </button>
          )}
        </div>
      )}
    </div>
  ) : null;

  const isDisabled = isSelectMode && !canSelect;

  const getRingClasses = () => {
    if (selected) {
      return "tw-ring-2 tw-ring-primary-500 tw-ring-inset";
    }
    if (isDisabled) {
      return "tw-ring-1 tw-ring-inset tw-ring-iron-700 tw-opacity-60";
    }
    return "tw-ring-1 tw-ring-inset tw-ring-iron-700 hover:tw-ring-iron-600/60 hover:tw-to-white/10";
  };

  const getCursorClasses = () => {
    if (isSelectModeAndCanSelect) {
      return "tw-cursor-pointer";
    }
    if (isDisabled) {
      return "tw-cursor-not-allowed";
    }
    return "";
  };

  const handleCardClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isSelectModeAndCanSelect && !selected) {
      e.preventDefault();
      onToggle();
    }
  };

  const handleCardKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (
      isSelectModeAndCanSelect &&
      !selected &&
      (e.key === "Enter" || e.key === " ")
    ) {
      e.preventDefault();
      onToggle();
    }
  };

  const CardBody = (
    <div
      {...(isSelectModeAndCanSelect && !selected
        ? {
          role: "button",
          tabIndex: 0,
          "aria-label": "Select NFT for transfer",
          onClick: handleCardClick,
          onKeyDown: handleCardKeyDown,
        }
        : {})}
      className={[
        "tw-group tw-relative",
        "tw-flex tw-flex-col tw-bg-gradient-to-br tw-from-iron-900 tw-to-white/5 tw-rounded-lg tw-overflow-hidden tw-px-0.5 tw-pt-0.5 tw-transition tw-duration-300 tw-ease-out",
        getRingClasses(),
        getCursorClasses(),
      ]
        .filter(Boolean)
        .join(" ")}>
      {OverlayControls}

      <div className="tw-flex tw-flex-wrap">
        <div className="tw-w-full tw-max-w-full">
          <div className="tw-h-[200px] min-[800px]:tw-h-[250px] min-[1200px]:tw-h-[18.75rem] tw-text-center tw-flex tw-items-center tw-justify-center tw-relative tw-w-full">
            {!isImageLoaded && (
              <div className="tw-absolute tw-inset-0 tw-bg-iron-800 tw-animate-pulse tw-rounded-lg" />
            )}
            <img
              src={card.img}
              alt={card.collection}
              onLoad={() => setIsImageLoaded(true)}
              className={`tw-bg-transparent tw-max-w-full tw-max-h-full tw-h-auto tw-w-auto tw-mx-auto tw-object-contain ${!isImageLoaded ? "tw-opacity-0" : "tw-opacity-100"
                } tw-transition-opacity tw-duration-300`}
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
            <span className="tw-text-sm min-[1200px]:tw-text-md tw-font-medium tw-text-iron-50 tw-truncate tw-block tw-w-full">
              {card.token_name}
            </span>
            {showSeizedCount && (
              <span className="tw-text-sm min-[1200px]:tw-text-md tw-font-medium tw-text-iron-400 tw-flex tw-items-center tw-gap-0.5 tw-whitespace-nowrap">
                {getSeizedCountDisplay()}x
                {hasBalanceMismatch && (
                  <>
                    <span
                      className="tw-text-primary-400 tw-cursor-help"
                      data-tooltip-id={tooltipId}>
                      *
                    </span>
                    <Tooltip
                      id={tooltipId}
                      variant="light"
                      className="tw-z-[9999]"
                      style={{
                        padding: "6px 10px",
                        fontSize: "12px",
                        maxWidth: "85%",
                        whiteSpace: "normal",
                        wordWrap: "break-word",
                      }}>
                      Only the balance of the connected wallet is available for
                      transfer
                    </Tooltip>
                  </>
                )}
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
        </div>
      </div>
    </div>
  );

  if (isSelectMode) {
    return CardBody;
  }

  return (
    <Link href={path} className="tw-no-underline">
      {CardBody}
    </Link>
  );
}

import CircleLoader, {
  CircleLoaderSize,
} from "@/components/distribution-plan-tool/common/CircleLoader";
import type { CollectedCard } from "@/entities/IProfile";
import { CollectedCollectionType } from "@/entities/IProfile";
import { formatNumberWithCommasOrDash } from "@/helpers/Helpers";
import { ContractType } from "@/types/enums";
import {
  faCheck,
  faMinusCircle,
  faPlus,
  faPlusCircle,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";
import Image from "next/image";
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
  showZeroSeizedCount = false,
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
  readonly showZeroSeizedCount?: boolean | undefined;
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

  const hasSeizedCountValue = card.seized_count !== null;
  const showSeizedCount =
    COLLECTED_COLLECTIONS_META[card.collection].dataRows.seizedCount &&
    (showZeroSeizedCount
      ? hasSeizedCountValue
      : typeof card.seized_count === "number" && card.seized_count > 0);

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
        "tw-pointer-events-none tw-absolute tw-inset-0 tw-z-10",
        "tw-flex tw-items-start tw-justify-end",
        "tw-p-2",
      ].join(" ")}
    >
      {isNotSelectable && (
        <div className="tw-pointer-events-auto tw-absolute tw-inset-0 tw-flex tw-items-start tw-justify-center tw-p-2">
          <div className="tw-rounded-md tw-bg-iron-900/95 tw-px-3 tw-py-1.5 tw-text-xs tw-font-medium tw-text-iron-300 tw-opacity-75 tw-ring-1 tw-ring-white/20 tw-transition-opacity tw-duration-200 group-hover:tw-opacity-100">
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
            "tw-pointer-events-auto tw-flex tw-border-none",
            "tw-items-center tw-justify-center",
            "tw-h-9 tw-w-9 tw-rounded-full",
            "tw-bg-iron-900/90 hover:tw-bg-primary-500/75",
            "tw-ring-1 tw-ring-white/30",
          ].join(" ")}
        >
          <FontAwesomeIcon icon={faPlus} className="tw-size-5" color="#fff" />
        </button>
      )}

      {isSelectedAndCanSelect && (
        <div className="tw-pointer-events-auto tw-flex tw-items-center tw-gap-2">
          {contractType === ContractType.ERC1155 ? (
            <div
              className={[
                "tw-flex tw-items-center tw-justify-center tw-gap-1.5",
                "tw-rounded-full tw-bg-primary-500 tw-p-2 tw-backdrop-blur",
                "tw-mt-[2px] tw-font-medium",
              ].join(" ")}
            >
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
                className="tw-flex tw-items-center tw-border-none tw-bg-transparent tw-p-0 focus:tw-outline-none"
              >
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
                className="tw-flex tw-items-center tw-border-none tw-bg-transparent tw-p-0 focus:tw-outline-none disabled:tw-opacity-50"
              >
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
              ].join(" ")}
            >
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
      return "tw-opacity-60";
    }
    return "";
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
        "tw-flex tw-flex-col tw-overflow-hidden tw-rounded-xl tw-border tw-border-solid tw-border-white/10 tw-bg-white/[0.02] tw-shadow-xl tw-transition-all tw-duration-300 hover:tw-border-white/30",
        getRingClasses(),
        getCursorClasses(),
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {OverlayControls}

      {/* Image container */}
      <div className="tw-relative tw-flex tw-aspect-square tw-items-center tw-justify-center tw-overflow-hidden tw-bg-white/[0.02]">
        {!isImageLoaded && (
          <div className="tw-absolute tw-inset-0 tw-animate-pulse tw-bg-iron-800" />
        )}
        <Image
          unoptimized
          src={card.img}
          alt={card.token_name || collectionMeta.label}
          width={800}
          height={800}
          sizes="(max-width: 640px) 100vw, 33vw"
          onLoad={() => setIsImageLoaded(true)}
          className={`tw-mx-auto tw-h-auto tw-max-h-full tw-w-auto tw-max-w-full tw-bg-transparent tw-object-contain ${
            !isImageLoaded ? "tw-opacity-0" : "tw-opacity-100"
          } tw-transition-opacity tw-duration-300`}
        />
      </div>

      {/* Content */}
      <div className="tw-flex tw-flex-col tw-gap-1.5 tw-p-4">
        <div className="tw-flex tw-items-center tw-justify-between">
          <span className="tw-mr-2 tw-truncate tw-text-[10px] tw-font-bold tw-uppercase tw-tracking-wider tw-text-white/40">
            {collectionMeta.label}
          </span>
          <span className="tw-font-mono tw-text-[11px] tw-font-medium tw-text-white/50">
            #{card.token_id}
          </span>
        </div>

        <div className="tw-flex tw-justify-between tw-gap-x-2">
          <h3 className="tw-m-0 tw-line-clamp-1 tw-text-[14px] tw-font-semibold tw-leading-snug tw-text-white/90 tw-transition-colors group-hover:tw-text-white">
            {card.token_name}
          </h3>
          {showSeizedCount && (
            <span className="tw-flex tw-items-center tw-gap-0.5 tw-whitespace-nowrap tw-text-[11px] tw-font-medium tw-text-white/50">
              {getSeizedCountDisplay()}x
              {hasBalanceMismatch && (
                <>
                  <span
                    className="tw-cursor-help tw-text-primary-400"
                    data-tooltip-id={tooltipId}
                  >
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
                    }}
                  >
                    Only the balance of the connected wallet is available for
                    transfer
                  </Tooltip>
                </>
              )}
            </span>
          )}
        </div>

        {showDataRow && (
          <div className="tw-mt-2 tw-flex tw-items-center tw-justify-between tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-white/[0.08] tw-pt-2.5">
            <div className="tw-flex tw-items-baseline tw-gap-1.5">
              <span className="tw-text-[13px] tw-font-semibold tw-text-white/80">
                {getTdhDisplay()}
              </span>
              <span className="tw-text-[13px] tw-font-semibold tw-text-white/30">
                TDH
              </span>
            </div>
            <span className="tw-rounded-md tw-bg-white/[0.05] tw-px-2 tw-py-0.5 tw-text-[11px] tw-font-medium tw-text-white/60">
              Rank {getRankDisplay()}
            </span>
          </div>
        )}
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

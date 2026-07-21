import { assertUnreachable } from "@/helpers/AllowlistToolHelpers";
import { formatNumberWithCommas } from "@/helpers/Helpers";
import { buildTooltipId, TOOLTIP_STYLES } from "@/helpers/tooltip.helpers";
import { useId } from "react";
import { Tooltip } from "react-tooltip";

enum RoyaltiesType {
  NONE = "NONE",
  BELOW_THRESHOLD = "BELOW_THRESHOLD",
  ABOVE_THRESHOLD = "ABOVE_THRESHOLD",
}

const ROYALTIES_THRESHOLD = 0.069;

export default function UserPageStatsActivityWalletTableRowRoyalties({
  royalties,
  transactionValue,
}: {
  readonly royalties: number;
  readonly transactionValue: number;
}) {
  const tooltipId = buildTooltipId(useId(), "royalties-information");

  const getRoyaltiesPercentage = () => {
    if (!royalties) {
      return 0;
    }

    if (!transactionValue) {
      return 0;
    }
    return Math.round((royalties / transactionValue) * 10000) / 10000;
  };

  const percentage = getRoyaltiesPercentage();

  const getRoyaltiesType = () => {
    if (!royalties) {
      return RoyaltiesType.NONE;
    }

    if (!transactionValue) {
      return RoyaltiesType.NONE;
    }

    if (percentage < ROYALTIES_THRESHOLD) {
      return RoyaltiesType.BELOW_THRESHOLD;
    }

    return RoyaltiesType.ABOVE_THRESHOLD;
  };

  const royaltiesType = getRoyaltiesType();

  const getContent = (): string =>
    `Royalties: ${formatNumberWithCommas(
      +royalties.toFixed(7)
    )}ETH (${formatNumberWithCommas(+(percentage * 100).toFixed(3))}%)`;

  switch (royaltiesType) {
    case RoyaltiesType.NONE:
      return null;
    case RoyaltiesType.BELOW_THRESHOLD:
      return (
        <>
          <button
            type="button"
            className="tw-flex tw-h-10 tw-w-10 tw-items-center tw-justify-center tw-rounded-full tw-border-none tw-bg-transparent tw-p-0 focus-visible:tw-outline-none focus-visible:tw-ring-1 focus-visible:tw-ring-inset focus-visible:tw-ring-primary-400"
            aria-label="Royalties information"
            aria-describedby={tooltipId}
            data-tooltip-id={tooltipId}
          >
            <img
              src="/pepe-smile.png"
              className="tw-h-4 tw-w-4 tw-flex-shrink-0 tw-object-contain"
              alt="pepe-smile"
            />
          </button>
          <Tooltip id={tooltipId} place="left" style={TOOLTIP_STYLES}>
            {getContent()}
          </Tooltip>
        </>
      );
    case RoyaltiesType.ABOVE_THRESHOLD:
      return (
        <>
          <button
            type="button"
            className="tw-flex tw-h-10 tw-w-10 tw-items-center tw-justify-center tw-rounded-full tw-border-none tw-bg-transparent tw-p-0 focus-visible:tw-outline-none focus-visible:tw-ring-1 focus-visible:tw-ring-inset focus-visible:tw-ring-primary-400"
            aria-label="Royalties information"
            aria-describedby={tooltipId}
            data-tooltip-id={tooltipId}
          >
            <img
              src="/pepe-xglasses.png"
              className="tw-h-4 tw-w-4 tw-flex-shrink-0 tw-object-contain"
              alt="pepe-xglasses"
            />
          </button>
          <Tooltip id={tooltipId} place="left" style={TOOLTIP_STYLES}>
            {getContent()}
          </Tooltip>
        </>
      );
    default:
      assertUnreachable(royaltiesType);
      return null;
  }
}

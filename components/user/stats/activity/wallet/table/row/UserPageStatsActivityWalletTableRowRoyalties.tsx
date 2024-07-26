import { assertUnreachable } from "../../../../../../../helpers/AllowlistToolHelpers";
import Tippy from "@tippyjs/react";
import { formatNumberWithCommas } from "../../../../../../../helpers/Helpers";

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
        <Tippy content={getContent()} theme="dark" placement="top">
          <div tabIndex={0}
            className="tw-h-10 tw-w-10 tw-flex tw-justify-center tw-items-center tw-rounded-full focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-400"
          >
            <img
              src="/pepe-smile.png"
              className="tw-w-6 tw-h-6 sm:tw-w-5 sm:tw-h-5 tw-object-contain tw-flex-shrink-0"
              alt="pepe-smile"
            />
          </div>
        </Tippy>
      );
    case RoyaltiesType.ABOVE_THRESHOLD:
      return (
        <Tippy content={getContent()} theme="dark" placement="top">
          <div tabIndex={0}
            className="tw-h-10 tw-w-10 tw-flex tw-justify-center tw-items-center tw-rounded-full focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-400"
          >
            <img
              src="/pepe-xglasses.png"
              className="tw-w-6 tw-h-6 sm:tw-w-5 sm:tw-h-5 tw-object-contain tw-flex-shrink-0"
              alt="pepe-xglasses"
            />
          </div>
        </Tippy>
      );
    default:
      assertUnreachable(royaltiesType);
      return null;
  }
}

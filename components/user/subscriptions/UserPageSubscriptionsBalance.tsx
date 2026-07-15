import DotLoader, { Spinner } from "@/components/dotLoader/DotLoader";
import { MEMES_MINT_PRICE } from "@/constants/constants";
import type { SubscriptionDetails } from "@/generated/models/SubscriptionDetails";
import { numberWithCommas } from "@/helpers/Helpers";
import { TOOLTIP_STYLES } from "@/helpers/tooltip.helpers";
import { ArrowPathIcon } from "@heroicons/react/24/outline";
import { Tooltip } from "react-tooltip";
import EthereumIcon from "../utils/icons/EthereumIcon";

export default function UserPageSubscriptionsBalance(
  props: Readonly<{
    details: SubscriptionDetails | undefined;
    show_refresh: boolean;
    fetching: boolean;
    refresh: () => void;
  }>
) {
  const balance = props.details?.balance ?? 0;

  return (
    <div className="tw-min-w-0">
      <div className="tw-flex tw-min-h-8 tw-items-center tw-justify-between tw-gap-3">
        <h3 className="tw-m-0 tw-text-[11px] tw-font-medium tw-uppercase tw-tracking-wider tw-text-iron-500">
          Current Balance
        </h3>
        {props.show_refresh &&
          (props.fetching ? (
            <span className="tw-inline-flex tw-size-8 tw-items-center tw-justify-center">
              <Spinner />
            </span>
          ) : (
            <>
              <button
                type="button"
                onClick={props.refresh}
                data-tooltip-id="subscriptions-refresh-balance"
                className="tw-inline-flex tw-size-8 tw-items-center tw-justify-center tw-rounded-lg tw-border-0 tw-bg-transparent tw-p-0 tw-text-iron-300 tw-transition-colors focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 desktop-hover:hover:tw-bg-iron-800 desktop-hover:hover:tw-text-iron-100"
                aria-label="Refresh balance"
              >
                <ArrowPathIcon className="tw-size-4" aria-hidden="true" />
              </button>
              <Tooltip
                id="subscriptions-refresh-balance"
                place="top"
                positionStrategy="fixed"
                offset={8}
                delayShow={250}
                opacity={1}
                style={TOOLTIP_STYLES}
              >
                Refresh balance
              </Tooltip>
            </>
          ))}
      </div>
      <div className="tw-mt-3 tw-min-h-9 sm:tw-mt-4">
        {props.fetching ? (
          <DotLoader />
        ) : (
          <span className="tw-flex tw-flex-wrap tw-items-baseline tw-gap-x-3 tw-gap-y-1 tw-text-iron-100">
            <span className="tw-flex tw-items-baseline tw-gap-2">
              <b className="tw-text-2xl tw-font-medium tw-leading-none tw-tracking-tight tw-text-iron-100 sm:tw-text-3xl">
                {balance > 0
                  ? numberWithCommas(Math.round(balance * 1000000) / 1000000)
                  : 0}
              </b>
              <span className="tw-inline-flex tw-h-5 tw-w-3 tw-flex-shrink-0 tw-self-center tw-text-iron-500">
                <EthereumIcon />
                <span className="tw-sr-only">ETH</span>
              </span>
            </span>
            {balance > 0 && (
              <span className="tw-text-sm tw-text-iron-400">
                (
                {(balance / MEMES_MINT_PRICE).toLocaleString(undefined, {
                  maximumFractionDigits: 0,
                })}{" "}
                cards)
              </span>
            )}
          </span>
        )}
      </div>
    </div>
  );
}

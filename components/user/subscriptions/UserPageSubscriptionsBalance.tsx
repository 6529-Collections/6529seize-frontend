import DotLoader, { Spinner } from "@/components/dotLoader/DotLoader";
import { MEMES_MINT_PRICE } from "@/constants/constants";
import type { SubscriptionDetails } from "@/generated/models/SubscriptionDetails";
import { numberWithCommas } from "@/helpers/Helpers";
import { faRefresh } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { WalletIcon } from "@heroicons/react/24/outline";

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
      <div className="tw-flex tw-min-h-8 tw-items-start tw-justify-between tw-gap-3">
        <h3 className="tw-m-0 tw-flex tw-items-center tw-gap-2 tw-text-[13px] tw-font-medium tw-leading-5 tw-text-iron-400">
          <WalletIcon className="tw-size-4" aria-hidden="true" />
          Current Balance
        </h3>
        {props.show_refresh &&
          (props.fetching ? (
            <span className="tw-inline-flex tw-size-8 tw-items-center tw-justify-center">
              <Spinner />
            </span>
          ) : (
            <button
              type="button"
              onClick={props.refresh}
              className="tw-inline-flex tw-size-8 tw-items-center tw-justify-center tw-rounded-lg tw-border-0 tw-bg-transparent tw-p-0 tw-text-iron-300 tw-transition-colors focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 desktop-hover:hover:tw-bg-iron-800 desktop-hover:hover:tw-text-iron-100"
              aria-label="Refresh balance"
            >
              <FontAwesomeIcon
                icon={faRefresh}
                className="tw-size-4"
                aria-hidden="true"
              />
            </button>
          ))}
      </div>
      <div className="tw-mt-4 tw-min-h-9">
        {props.fetching ? (
          <DotLoader />
        ) : (
          <span className="tw-flex tw-flex-wrap tw-items-baseline tw-gap-x-3 tw-gap-y-1 tw-text-iron-100">
            <span className="tw-flex tw-items-baseline tw-gap-3">
              <b className="tw-text-4xl tw-font-medium tw-leading-none tw-tracking-tight tw-text-iron-100">
                {balance > 0
                  ? numberWithCommas(Math.round(balance * 1000000) / 1000000)
                  : 0}
              </b>
              <span className="tw-text-lg tw-font-light tw-text-iron-500">
                ETH
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

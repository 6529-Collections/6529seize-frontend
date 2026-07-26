import DotLoader, { Spinner } from "@/components/dotLoader/DotLoader";
import { MEMES_MINT_PRICE } from "@/constants/constants";
import type { ApiSubscriptionCoverage } from "@/generated/models/ApiSubscriptionCoverage";
import type { SubscriptionDetails } from "@/generated/models/SubscriptionDetails";
import { TOOLTIP_STYLES } from "@/helpers/tooltip.helpers";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { formatInteger } from "@/i18n/format";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { ArrowPathIcon } from "@heroicons/react/24/outline";
import { Tooltip } from "react-tooltip";
import EthereumIcon from "../utils/icons/EthereumIcon";
import { formatSubscriptionEth } from "./coverage/subscriptionCoverage.helpers";

function getMintCapacityLabel(
  locale: SupportedLocale,
  mintCapacity: number | null
): string {
  if (mintCapacity === null) {
    return t(locale, "subscriptions.balance.mintCapacity.unknown");
  }
  const messageKey =
    mintCapacity === 1
      ? "subscriptions.balance.mintCapacity.one"
      : "subscriptions.balance.mintCapacity.many";
  return t(locale, messageKey, {
    count: formatInteger(locale, mintCapacity),
  });
}

export default function UserPageSubscriptionsBalance(
  props: Readonly<{
    coverage?: ApiSubscriptionCoverage | undefined;
    details: SubscriptionDetails | undefined;
    show_refresh: boolean;
    fetching: boolean;
    refresh: () => void;
  }>
) {
  const locale = useBrowserLocale();
  const balance =
    props.coverage?.balance_eth ?? props.details?.balance.toString() ?? "0";
  const numericBalance = Number(balance);
  const fallbackMintCapacity = Number.isFinite(numericBalance)
    ? Math.floor(numericBalance / MEMES_MINT_PRICE)
    : 0;
  const mintCapacity =
    props.coverage === undefined
      ? fallbackMintCapacity
      : props.coverage.mint_capacity;
  const mintCapacityLabel = getMintCapacityLabel(locale, mintCapacity);

  return (
    <div className="tw-min-w-0" aria-busy={props.fetching}>
      <div className="tw-flex tw-min-h-8 tw-items-center tw-justify-between tw-gap-3">
        <h3 className="tw-m-0 tw-text-[11px] tw-font-medium tw-uppercase tw-tracking-wider tw-text-iron-500">
          {t(locale, "subscriptions.balance.title")}
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
      <div className="tw-min-h-9">
        {props.fetching ? (
          <>
            <output className="tw-sr-only">Loading balance</output>
            <DotLoader />
          </>
        ) : (
          <span className="tw-flex tw-flex-wrap tw-items-baseline tw-gap-x-3 tw-gap-y-1">
            <span className="tw-flex tw-items-baseline tw-gap-2">
              <b className="tw-text-2xl tw-font-medium tw-leading-none tw-tracking-tight tw-text-iron-100 sm:tw-text-3xl">
                {formatSubscriptionEth(locale, balance)}
              </b>
              <span className="tw-inline-flex tw-h-5 tw-w-3 tw-flex-shrink-0 tw-self-center tw-text-iron-500">
                <EthereumIcon />
                <span className="tw-sr-only">ETH</span>
              </span>
            </span>
            {numericBalance > 0 && (
              <span className="tw-text-sm tw-text-iron-400">
                ({mintCapacityLabel})
              </span>
            )}
          </span>
        )}
      </div>
    </div>
  );
}

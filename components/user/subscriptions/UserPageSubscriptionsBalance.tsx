import DotLoader from "@/components/dotLoader/DotLoader";
import { MEMES_MINT_PRICE } from "@/constants/constants";
import type { ApiSubscriptionCoverage } from "@/generated/models/ApiSubscriptionCoverage";
import type { SubscriptionDetails } from "@/generated/models/SubscriptionDetails";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { formatInteger } from "@/i18n/format";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { ArrowPathIcon } from "@heroicons/react/24/outline";
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
    <div
      className="tw-flex tw-min-w-0 tw-flex-wrap tw-items-center tw-gap-x-2 tw-gap-y-1 tw-text-sm tw-text-iron-400"
      aria-busy={props.fetching}
    >
      <span>{t(locale, "subscriptions.balance.title")}</span>
      {props.fetching ? (
        <>
          <output className="tw-sr-only">
            {t(locale, "subscriptions.balance.loading")}
          </output>
          <DotLoader />
        </>
      ) : (
        <>
          <span className="tw-font-medium tw-tabular-nums tw-text-iron-100">
            {formatSubscriptionEth(locale, balance)}{" "}
            {t(locale, "subscriptions.balance.ethUnit")}
          </span>
          <span className="tw-tabular-nums">({mintCapacityLabel})</span>
        </>
      )}
      {props.show_refresh && (
        <button
          type="button"
          onClick={props.refresh}
          disabled={props.fetching}
          aria-label={t(locale, "subscriptions.balance.refresh")}
          className="tw-inline-flex tw-size-11 tw-shrink-0 tw-items-center tw-justify-center tw-rounded-lg tw-border-0 tw-bg-transparent tw-text-iron-400 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 disabled:tw-opacity-50 desktop-hover:hover:tw-text-iron-100"
        >
          <ArrowPathIcon
            className={`tw-size-4 ${props.fetching ? "tw-animate-spin motion-reduce:tw-animate-none" : ""}`}
            aria-hidden="true"
          />
        </button>
      )}
    </div>
  );
}

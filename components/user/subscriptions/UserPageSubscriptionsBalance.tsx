import { useId } from "react";
import { Tooltip } from "react-tooltip";
import { TOOLTIP_STYLES } from "@/helpers/tooltip.helpers";
import DotLoader from "@/components/dotLoader/DotLoader";
import type { ApiSubscriptionCoverage } from "@/generated/models/ApiSubscriptionCoverage";
import type { SubscriptionDetails } from "@/generated/models/SubscriptionDetails";
import { MEMES_MINT_PRICE } from "@/constants/constants";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { formatInteger } from "@/i18n/format";
import { t } from "@/i18n/messages";
import { ArrowPathIcon } from "@heroicons/react/24/outline";
import { formatSubscriptionEth } from "./coverage/subscriptionCoverage.helpers";

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
  const refreshTooltipId = useId();
  const balance =
    props.coverage?.balance_eth ?? props.details?.balance.toString() ?? "0";
  const legacyBalance = props.details?.balance;
  const mintCapacity =
    props.coverage === undefined &&
    legacyBalance !== undefined &&
    Number.isFinite(legacyBalance)
      ? Math.floor(legacyBalance / MEMES_MINT_PRICE)
      : props.coverage?.mint_capacity;
  const capacityMessageKey =
    mintCapacity === 1
      ? "subscriptions.balance.mintCapacity.one"
      : "subscriptions.balance.mintCapacity.many";
  const capacityLabel =
    mintCapacity === null || mintCapacity === undefined
      ? t(locale, "subscriptions.balance.mintCapacity.unknown")
      : t(locale, capacityMessageKey, {
          count: formatInteger(locale, mintCapacity),
        });

  return (
    <div
      className="tw-grid tw-min-w-0 tw-grid-cols-[minmax(0,1fr)_auto] tw-items-center tw-gap-x-1 tw-py-2.5 tw-text-sm tw-leading-[21px] tw-text-iron-400 sm:tw-col-start-1 sm:tw-flex sm:tw-flex-wrap sm:tw-gap-x-2 sm:tw-py-0 sm:tw-text-[15px] sm:tw-leading-[22px]"
      aria-busy={props.fetching}
    >
      <span>{t(locale, "subscriptions.balance.title")}</span>
      <div className="tw-inline-flex tw-shrink-0 tw-items-center tw-whitespace-nowrap">
        {props.fetching ? (
          <>
            <output className="tw-sr-only">
              {t(locale, "subscriptions.balance.loading")}
            </output>
            <span className="tw-inline-flex tw-min-h-11 tw-items-center md:tw-min-h-7">
              <DotLoader />
            </span>
          </>
        ) : (
          <span className="tw-inline-flex tw-min-h-11 tw-items-center tw-font-medium tw-tabular-nums tw-text-iron-100 md:tw-min-h-7">
            {formatSubscriptionEth(locale, balance)}{" "}
            {t(locale, "subscriptions.balance.ethUnit")}
          </span>
        )}
        {props.show_refresh && (
          <>
            <button
              type="button"
              onClick={props.refresh}
              disabled={props.fetching}
              aria-label={t(locale, "subscriptions.balance.refresh")}
              data-tooltip-id={refreshTooltipId}
              className="tw-inline-flex tw-size-11 tw-shrink-0 tw-items-center tw-justify-center tw-rounded-lg tw-border-0 tw-bg-transparent tw-text-iron-400 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 disabled:tw-opacity-50 desktop-hover:hover:tw-bg-iron-800 desktop-hover:hover:tw-text-iron-100 md:tw-size-7"
            >
              <ArrowPathIcon
                className={`tw-size-4 ${props.fetching ? "tw-animate-spin motion-reduce:tw-animate-none" : ""}`}
                aria-hidden="true"
              />
            </button>
            <Tooltip
              id={refreshTooltipId}
              openEvents={{ mouseover: true, focus: true }}
              place="top"
              positionStrategy="fixed"
              offset={8}
              delayShow={250}
              opacity={1}
              style={TOOLTIP_STYLES}
            >
              {t(locale, "subscriptions.balance.refresh")}
            </Tooltip>
          </>
        )}
      </div>
      {!props.fetching && (
        <span className="tw-col-span-full tw-text-right tw-text-xs tw-tabular-nums tw-text-iron-400 sm:tw-text-left sm:tw-text-[15px]">
          ({capacityLabel})
        </span>
      )}
    </div>
  );
}

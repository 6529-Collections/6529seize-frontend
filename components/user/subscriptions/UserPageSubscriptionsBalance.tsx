import { useId } from "react";
import { Tooltip } from "react-tooltip";
import { TOOLTIP_STYLES } from "@/helpers/tooltip.helpers";
import type { ApiSubscriptionCoverage } from "@/generated/models/ApiSubscriptionCoverage";
import type { SubscriptionDetails } from "@/generated/models/SubscriptionDetails";
import { MEMES_MINT_PRICE } from "@/constants/constants";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { formatInteger } from "@/i18n/format";
import { t } from "@/i18n/messages";
import { ArrowPathIcon } from "@heroicons/react/24/outline";
import EthereumIcon from "@/components/user/utils/icons/EthereumIcon";
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
  const legacyBalance = props.details?.balance;
  const balance =
    props.coverage?.balance_eth ??
    (legacyBalance !== undefined && Number.isFinite(legacyBalance)
      ? legacyBalance.toString()
      : undefined);
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
      className="tw-row-span-3 tw-grid tw-min-w-0 tw-grid-rows-subgrid tw-items-start tw-gap-y-0.5 tw-text-sm tw-font-normal tw-text-iron-500 sm:tw-row-span-1 sm:tw-flex sm:tw-flex-wrap sm:tw-items-center sm:tw-gap-x-2"
      aria-busy={props.fetching}
    >
      <div className="tw-flex tw-min-h-6 tw-min-w-0 tw-items-center tw-gap-1 sm:tw-contents">
        <span>{t(locale, "subscriptions.balance.title")}</span>
        {props.show_refresh && !props.fetching && (
          <>
            <button
              type="button"
              onClick={props.refresh}
              aria-label={t(locale, "subscriptions.balance.refresh")}
              data-tooltip-id={refreshTooltipId}
              className="-tw-mx-3 -tw-my-2.5 tw-inline-flex tw-size-11 tw-shrink-0 tw-items-center tw-justify-center tw-rounded-lg tw-border-0 tw-bg-transparent tw-text-iron-400 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 disabled:tw-opacity-50 desktop-hover:hover:tw-bg-iron-800 desktop-hover:hover:tw-text-iron-100 sm:tw-order-4 sm:tw-mx-0 sm:tw-size-7"
            >
              <ArrowPathIcon
                className="tw-size-3.5 sm:tw-size-4"
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
              <span className="tw-text-meta tw-font-normal">
                {t(locale, "subscriptions.balance.refresh")}
              </span>
            </Tooltip>
          </>
        )}
      </div>
      <div className="tw-inline-flex tw-min-h-7 tw-min-w-0 tw-items-center tw-text-base tw-font-semibold tw-tabular-nums tw-text-iron-100 sm:tw-order-2 sm:tw-min-h-6 sm:tw-text-sm sm:tw-font-medium">
        {props.fetching ? (
          <>
            <output className="tw-sr-only">
              {t(locale, "subscriptions.balance.loading")}
            </output>
            <span
              aria-hidden="true"
              className="tw-h-4 tw-w-24 tw-animate-pulse tw-rounded-md tw-bg-iron-800 motion-reduce:tw-animate-none"
            />
          </>
        ) : (
          <>
            {balance === undefined &&
              t(locale, "subscriptions.details.unavailable")}
            {balance !== undefined && (
              <span className="tw-inline-flex tw-items-center tw-gap-1.5 tw-whitespace-nowrap">
                {formatSubscriptionEth(locale, balance)}{" "}
                <span className="tw-h-4 tw-w-2.5 tw-shrink-0 tw-text-iron-400">
                  <EthereumIcon />
                </span>
                <span className="tw-sr-only">
                  {t(locale, "subscriptions.balance.ethUnit")}
                </span>
              </span>
            )}
          </>
        )}
      </div>
      {!props.fetching && balance !== undefined && (
        <span className="tw-text-left tw-text-sm tw-font-normal tw-tabular-nums tw-text-iron-500 sm:tw-order-3">
          {capacityLabel}
        </span>
      )}
    </div>
  );
}

import { useId } from "react";
import { Tooltip } from "react-tooltip";
import { TOOLTIP_STYLES } from "@/helpers/tooltip.helpers";
import DotLoader from "@/components/dotLoader/DotLoader";
import type { ApiSubscriptionCoverage } from "@/generated/models/ApiSubscriptionCoverage";
import type { SubscriptionDetails } from "@/generated/models/SubscriptionDetails";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
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

  return (
    <div
      className="tw-flex tw-min-w-0 tw-flex-wrap tw-items-center tw-gap-x-1.5 tw-gap-y-1 tw-text-[13px] tw-text-iron-500 md:tw-text-sm"
      aria-busy={props.fetching}
    >
      <span>{t(locale, "subscriptions.balance.title")}</span>
      <div className="tw-inline-flex tw-shrink-0 tw-items-center tw-gap-1.5 tw-whitespace-nowrap">
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
          </>
        )}
        {props.show_refresh && (
          <>
            <button
              type="button"
              onClick={props.refresh}
              disabled={props.fetching}
              aria-label={t(locale, "subscriptions.balance.refresh")}
              data-tooltip-id={refreshTooltipId}
              className="tw-inline-flex tw-size-11 tw-shrink-0 tw-items-center tw-justify-center tw-rounded-lg tw-border-0 tw-bg-transparent tw-text-iron-400 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 disabled:tw-opacity-50 desktop-hover:hover:tw-text-iron-100 md:tw-size-7"
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
    </div>
  );
}

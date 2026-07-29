"use client";

import { useCookieConsent } from "@/components/cookies/CookieConsentContext";
import { shouldHideSubscriptions } from "@/components/user/layout/userPageVisibility";
import EthereumIcon from "@/components/user/utils/icons/EthereumIcon";
import { getProfileSubscriptionsHref } from "@/components/user/subscriptions/subscriptionNavigation";
import {
  formatSubscriptionCoverageDate,
  getSubscriptionCoverageActionLabel,
  getSubscriptionCoverageAnchor,
  getSubscriptionCoverageCompactLine,
  getSubscriptionCoveragePresentation,
  type SubscriptionCoverageTone,
} from "@/components/user/subscriptions/coverage/subscriptionCoverage.helpers";
import { useSubscriptionCoverage } from "@/components/user/subscriptions/coverage/useSubscriptionCoverage";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import { ApiSubscriptionCoverageStatus } from "@/generated/models/ApiSubscriptionCoverageStatus";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import useCapacitor from "@/hooks/useCapacitor";
import { formatInteger } from "@/i18n/format";
import { t } from "@/i18n/messages";
import {
  ArrowRightIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";
import clsx from "clsx";
import Link from "next/link";
import type { ComponentType, SVGProps } from "react";

type StatusIcon = ComponentType<SVGProps<SVGSVGElement>>;

function SubscriptionEthIcon({
  className,
}: Readonly<SVGProps<SVGSVGElement>>) {
  return (
    <span className={clsx("tw-inline-flex tw-flex-none", className)}>
      <EthereumIcon />
    </span>
  );
}

const STATUS_ICONS: Record<SubscriptionCoverageTone, StatusIcon> = {
  positive: CheckCircleIcon,
  caution: ClockIcon,
  danger: XCircleIcon,
  neutral: SubscriptionEthIcon,
};

const STATUS_CONTAINER_RING_CLASSES: Record<SubscriptionCoverageTone, string> = {
  positive: "tw-ring-emerald-400/25",
  caution: "tw-ring-amber-300/30",
  danger: "tw-ring-red-300/35",
  neutral: "tw-ring-white/10",
};

const STATUS_ICON_CLASSES: Record<SubscriptionCoverageTone, string> = {
  positive:
    "tw-bg-emerald-400/10 tw-text-emerald-300 tw-ring-emerald-400/25",
  caution: "tw-bg-amber-300/10 tw-text-amber-200 tw-ring-amber-300/25",
  danger: "tw-bg-red-300/10 tw-text-red-200 tw-ring-red-300/30",
  neutral: "tw-bg-iron-800 tw-text-iron-300 tw-ring-iron-700",
};

export default function UserPageHeaderSubscriptionStatus({
  profile,
}: Readonly<{
  profile: ApiIdentity;
}>) {
  const locale = useBrowserLocale();
  const { country } = useCookieConsent();
  const { isIos } = useCapacitor();
  const hideSubscriptions = shouldHideSubscriptions({
    capacitorIsIos: isIos,
    country,
  });
  const profileKey = profile.consolidation_key.trim();
  const profileHref = getProfileSubscriptionsHref(profile);
  const coverageQuery = useSubscriptionCoverage({
    enabled: !hideSubscriptions,
    profileKey,
  });

  if (hideSubscriptions || !profileKey || !profileHref) {
    return null;
  }

  if (coverageQuery.isLoading) {
    return (
      <div
        aria-label={t(locale, "subscriptions.coverage.loading")}
        className="tw-min-h-16 tw-w-full tw-animate-pulse tw-rounded-xl tw-bg-white/[0.035] tw-p-3 tw-shadow-sm tw-shadow-black/20 tw-ring-1 tw-ring-white/10 tw-backdrop-blur-sm sm:tw-w-80"
      >
        <div className="tw-h-4 tw-w-44 tw-rounded tw-bg-iron-700/80" />
        <div className="tw-mt-2 tw-h-3 tw-w-56 tw-rounded tw-bg-iron-800/90" />
      </div>
    );
  }

  const coverage = coverageQuery.data;
  if (!coverage) {
    return (
      <Link
        href={profileHref}
        className="tw-flex tw-min-h-16 tw-w-full tw-items-center tw-justify-between tw-gap-3 tw-rounded-xl tw-bg-white/[0.035] tw-p-3 tw-text-left tw-no-underline tw-shadow-sm tw-shadow-black/20 tw-ring-1 tw-ring-white/10 tw-backdrop-blur-sm tw-transition-colors focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-300 desktop-hover:hover:tw-bg-white/[0.06] sm:tw-w-80"
      >
        <span className="tw-min-w-0">
          <span className="tw-block tw-text-sm tw-font-semibold tw-text-iron-100">
            {t(locale, "subscriptions.coverage.status.unknown")}
          </span>
          <span className="tw-mt-1 tw-block tw-text-xs tw-text-iron-400">
            {t(locale, "subscriptions.coverage.action.reviewSettings")}
          </span>
        </span>
        <ArrowRightIcon
          className="tw-size-4 tw-flex-none tw-text-iron-400"
          aria-hidden="true"
        />
      </Link>
    );
  }

  const presentation = getSubscriptionCoveragePresentation(
    locale,
    coverage.status
  );
  const actionLabel = getSubscriptionCoverageActionLabel(
    locale,
    presentation.action,
    true
  );
  const href = `${profileHref}${getSubscriptionCoverageAnchor(
    presentation.action
  )}`;
  const isUrgentTopUp =
    coverage.status === ApiSubscriptionCoverageStatus.RunningLow ||
    coverage.status === ApiSubscriptionCoverageStatus.ActionRequired;
  const StatusIcon = STATUS_ICONS[presentation.tone];
  const secondaryLine = coverage.funded_through
    ? t(locale, "subscriptions.coverage.header.through", {
        status: presentation.label,
        token: formatInteger(locale, coverage.funded_through.token_id),
        date: formatSubscriptionCoverageDate(
          locale,
          coverage.funded_through.mint_at
        ),
      })
    : t(locale, "subscriptions.coverage.header.noFundedThrough", {
        status: presentation.label,
      });

  return (
    <div
      className={clsx(
        "tw-flex tw-min-h-16 tw-w-full tw-items-center tw-gap-3 tw-rounded-xl tw-bg-white/[0.035] tw-p-3 tw-shadow-sm tw-shadow-black/20 tw-ring-1 tw-backdrop-blur-sm focus-within:tw-ring-2 focus-within:tw-ring-primary-300 sm:tw-w-auto sm:tw-min-w-80",
        STATUS_CONTAINER_RING_CLASSES[presentation.tone]
      )}
    >
      <span
        aria-hidden="true"
        className={clsx(
          "tw-inline-flex tw-size-7 tw-flex-none tw-items-center tw-justify-center tw-rounded-full tw-ring-1",
          STATUS_ICON_CLASSES[presentation.tone]
        )}
      >
        <StatusIcon className="tw-size-4" />
      </span>
      <span className="tw-min-w-0 tw-flex-1">
        <span className="tw-block tw-truncate tw-text-sm tw-font-semibold tw-text-iron-100">
          {getSubscriptionCoverageCompactLine(locale, coverage)}
        </span>
        <span className="tw-mt-1 tw-block tw-truncate tw-text-xs tw-text-iron-400">
          {secondaryLine}
        </span>
      </span>
      <Link
        href={href}
        className={clsx(
          "tw-inline-flex tw-min-h-10 tw-flex-none tw-items-center tw-gap-1.5 tw-rounded-lg tw-px-2.5 tw-py-2 tw-text-xs tw-font-semibold tw-no-underline tw-transition-colors focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-300",
          isUrgentTopUp
            ? "tw-bg-primary-500 tw-text-white desktop-hover:hover:tw-bg-primary-400"
            : "tw-text-iron-400 desktop-hover:hover:tw-bg-white/[0.05] desktop-hover:hover:tw-text-iron-100"
        )}
      >
        {actionLabel}
        <ArrowRightIcon className="tw-size-3.5" aria-hidden="true" />
      </Link>
    </div>
  );
}

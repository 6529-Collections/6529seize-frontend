"use client";

import { useCookieConsent } from "@/components/cookies/CookieConsentContext";
import { shouldHideSubscriptions } from "@/components/user/layout/userPageVisibility";
import EthereumIcon from "@/components/user/utils/icons/EthereumIcon";
import ButtonLink from "@/components/utils/button/ButtonLink";
import { getProfileSubscriptionsHref } from "@/components/user/subscriptions/subscriptionNavigation";
import {
  formatSubscriptionCoverageDate,
  getSubscriptionCoverageActionLabel,
  getSubscriptionCoverageAnchor,
  getSubscriptionCoveragePresentation,
  type SubscriptionCoverageTone,
} from "@/components/user/subscriptions/coverage/subscriptionCoverage.helpers";
import { useSubscriptionCoverage } from "@/components/user/subscriptions/coverage/useSubscriptionCoverage";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import { ApiSubscriptionCoverageStatus } from "@/generated/models/ApiSubscriptionCoverageStatus";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import useCapacitor from "@/hooks/useCapacitor";
import { formatInteger } from "@/i18n/format";
import type { SupportedLocale } from "@/i18n/locales";
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
import {
  USER_PAGE_HEADER_INTERACTIVE_SURFACE_CLASS,
  USER_PAGE_HEADER_SURFACE_CLASS,
} from "./user-page-header-surface";

type StatusIcon = ComponentType<SVGProps<SVGSVGElement>>;

function SubscriptionEthIcon({ className }: Readonly<SVGProps<SVGSVGElement>>) {
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

const STATUS_ICON_CLASSES: Record<SubscriptionCoverageTone, string> = {
  positive: "tw-bg-emerald-400/10 tw-text-emerald-300 tw-ring-emerald-400/25",
  caution: "tw-bg-amber-300/10 tw-text-amber-200 tw-ring-amber-300/25",
  danger: "tw-bg-red-300/10 tw-text-red-200 tw-ring-red-300/30",
  neutral: "tw-bg-iron-800 tw-text-iron-300 tw-ring-iron-700",
};

const SUBSCRIPTIONS_TITLE_KEY = "subscriptions.coverage.header.title";
const MUTED_TEXT_CLASS = "tw-text-iron-400";
type SubscriptionStatusLayout = "card" | "subtle" | "wide-row";

function getSubtleLayoutClass(layout: SubscriptionStatusLayout) {
  return layout === "wide-row"
    ? "tw-min-h-14 tw-border-0 tw-border-t tw-border-solid tw-border-white/[0.08] tw-py-2"
    : "tw-min-h-10 tw-rounded-lg";
}

function SubscriptionStatusIcon({
  tone,
}: Readonly<{ tone: SubscriptionCoverageTone }>) {
  const Icon = STATUS_ICONS[tone];

  return (
    <span
      aria-hidden="true"
      className={clsx(
        "tw-inline-flex tw-size-6 tw-flex-none tw-items-center tw-justify-center tw-rounded-full tw-ring-1",
        STATUS_ICON_CLASSES[tone]
      )}
    >
      <Icon className="tw-size-3.5" />
    </span>
  );
}

function SubscriptionLoading({
  layout,
  locale,
}: Readonly<{
  layout: SubscriptionStatusLayout;
  locale: SupportedLocale;
}>) {
  const isSubtle = layout !== "card";

  return (
    <div
      aria-label={t(locale, "subscriptions.coverage.loading")}
      className={clsx(
        "tw-w-full tw-animate-pulse",
        isSubtle
          ? getSubtleLayoutClass(layout)
          : "tw-min-h-14 tw-rounded-xl tw-p-2.5 sm:tw-w-[22rem]",
        layout === "subtle" && "tw-flex tw-flex-col tw-justify-center",
        !isSubtle && USER_PAGE_HEADER_SURFACE_CLASS
      )}
    >
      <div className="tw-h-3.5 tw-w-40 tw-rounded tw-bg-iron-700/80" />
      <div className="tw-mt-1.5 tw-h-3 tw-w-48 tw-rounded tw-bg-iron-800/90" />
    </div>
  );
}

function SubscriptionUnknown({
  href,
  layout,
  locale,
}: Readonly<{
  href: string;
  layout: SubscriptionStatusLayout;
  locale: SupportedLocale;
}>) {
  const isSubtle = layout !== "card";
  const arrowClassName = clsx(
    "tw-size-4 tw-flex-none tw-transition-colors",
    isSubtle
      ? "tw-text-iron-500 group-focus-visible:tw-text-white desktop-hover:group-hover:tw-text-white"
      : MUTED_TEXT_CLASS
  );

  return (
    <Link
      href={href}
      className={clsx(
        "tw-group tw-flex tw-gap-2 tw-text-left tw-no-underline tw-transition-colors focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400",
        layout === "subtle"
          ? "tw-w-fit tw-items-center tw-justify-end"
          : "tw-w-full tw-items-center tw-justify-between",
        isSubtle
          ? `${getSubtleLayoutClass(layout)} desktop-hover:hover:tw-bg-white/[0.025]`
          : "tw-min-h-14 tw-rounded-xl tw-p-2.5 sm:tw-w-[22rem]",
        !isSubtle && USER_PAGE_HEADER_SURFACE_CLASS,
        !isSubtle && USER_PAGE_HEADER_INTERACTIVE_SURFACE_CLASS
      )}
    >
      <span
        className={clsx(
          "tw-min-w-0",
          isSubtle && "tw-flex tw-flex-col",
          layout === "subtle" && "tw-items-start tw-whitespace-nowrap",
          layout === "wide-row" && "tw-flex-1"
        )}
      >
        <span
          className={clsx(
            "tw-font-medium",
            isSubtle
              ? "tw-text-[11px] tw-font-semibold tw-uppercase tw-tracking-[0.06em] tw-text-iron-500"
              : "tw-text-[13px] tw-text-iron-100",
            isSubtle ? "tw-inline-block" : "tw-block"
          )}
        >
          {t(locale, SUBSCRIPTIONS_TITLE_KEY)}
        </span>
        <span
          className={clsx(
            "tw-block tw-transition-colors",
            isSubtle
              ? "tw-flex tw-items-center tw-gap-1 tw-text-sm tw-font-medium tw-leading-5 tw-text-iron-200 group-focus-visible:tw-text-white desktop-hover:group-hover:tw-text-white"
              : `tw-text-[11px] ${MUTED_TEXT_CLASS}`,
            isSubtle ? "tw-mt-0" : "tw-mt-0.5"
          )}
        >
          {t(locale, "subscriptions.coverage.status.unknown")}
          {isSubtle && (
            <ArrowRightIcon className={arrowClassName} aria-hidden="true" />
          )}
        </span>
      </span>
      {!isSubtle && (
        <ArrowRightIcon className={arrowClassName} aria-hidden="true" />
      )}
    </Link>
  );
}

type SubscriptionCoveragePresentationProps = Readonly<{
  actionLabel: string;
  href: string;
  isUrgentTopUp: boolean;
  locale: SupportedLocale;
  secondaryLine: string;
  tone: SubscriptionCoverageTone;
}>;

function SubscriptionCard({
  actionLabel,
  href,
  isUrgentTopUp,
  locale,
  secondaryLine,
  tone,
}: SubscriptionCoveragePresentationProps) {
  return (
    <div
      className={clsx(
        "tw-flex tw-min-h-14 tw-w-full tw-items-center tw-gap-2 tw-rounded-xl tw-p-2.5 focus-within:tw-outline focus-within:tw-outline-2 focus-within:tw-outline-offset-2 focus-within:tw-outline-primary-400 sm:tw-w-[22rem]",
        USER_PAGE_HEADER_SURFACE_CLASS
      )}
    >
      <SubscriptionStatusIcon tone={tone} />
      <span className="tw-min-w-0 tw-flex-1">
        <span className="tw-block tw-truncate tw-text-[13px] tw-font-medium tw-text-iron-100">
          {t(locale, SUBSCRIPTIONS_TITLE_KEY)}
        </span>
        <span className="tw-mt-0.5 tw-block tw-text-[11px] tw-leading-4 tw-text-iron-400">
          {secondaryLine}
        </span>
      </span>
      <ButtonLink
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
      </ButtonLink>
    </div>
  );
}

function SubscriptionSubtle({
  actionLabel,
  href,
  isUrgentTopUp,
  layout,
  locale,
  secondaryLine,
  tone,
}: SubscriptionCoveragePresentationProps &
  Readonly<{ layout: Exclude<SubscriptionStatusLayout, "card"> }>) {
  const isCompact = layout === "subtle";

  return (
    <Link
      href={href}
      className={clsx(
        "tw-group tw-flex tw-gap-2 tw-text-left tw-no-underline tw-transition-colors focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400",
        isCompact
          ? "tw-w-max tw-items-center tw-justify-end"
          : "tw-w-full tw-items-center tw-justify-between",
        `${getSubtleLayoutClass(layout)} desktop-hover:hover:tw-bg-white/[0.025]`
      )}
    >
      <SubscriptionStatusIcon tone={tone} />
      <span
        className={clsx(
          "tw-flex tw-min-w-0 tw-flex-col",
          isCompact ? "tw-items-start tw-whitespace-nowrap" : "tw-flex-1"
        )}
      >
        <span className="tw-inline-block tw-text-[11px] tw-font-semibold tw-uppercase tw-tracking-[0.06em] tw-text-iron-500">
          {t(locale, SUBSCRIPTIONS_TITLE_KEY)}
        </span>
        <span className="tw-flex tw-min-w-0 tw-items-baseline tw-gap-2 tw-text-sm tw-font-medium tw-leading-5 tw-text-iron-200">
          <span
            className={clsx(
              "tw-min-w-0 tw-transition-colors group-focus-visible:tw-text-white desktop-hover:group-hover:tw-text-white",
              !isCompact && "tw-truncate"
            )}
          >
            {secondaryLine}
          </span>
          <span
            className={clsx(
              "tw-inline-flex tw-flex-none tw-items-center tw-gap-1 tw-text-xs tw-font-medium tw-transition-colors",
              isUrgentTopUp
                ? "group-focus-visible:tw-text-primary-200 desktop-hover:group-hover:tw-text-primary-200 tw-text-primary-300"
                : "tw-text-iron-500 group-focus-visible:tw-text-white desktop-hover:group-hover:tw-text-white"
            )}
          >
            {actionLabel}
            <ArrowRightIcon className="tw-size-3" aria-hidden="true" />
          </span>
        </span>
      </span>
    </Link>
  );
}

export default function UserPageHeaderSubscriptionStatus({
  profile,
  layout = "card",
}: Readonly<{
  profile: ApiIdentity;
  layout?: SubscriptionStatusLayout;
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
    return <SubscriptionLoading layout={layout} locale={locale} />;
  }

  const coverage = coverageQuery.data;
  if (!coverage) {
    return (
      <SubscriptionUnknown href={profileHref} layout={layout} locale={locale} />
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

  const presentationProps = {
    actionLabel,
    href,
    isUrgentTopUp,
    locale,
    secondaryLine,
    tone: presentation.tone,
  } satisfies SubscriptionCoveragePresentationProps;

  if (layout === "card") {
    return <SubscriptionCard {...presentationProps} />;
  }

  return <SubscriptionSubtle {...presentationProps} layout={layout} />;
}

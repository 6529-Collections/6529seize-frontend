import {
  faArrowRight,
  faCircleInfo,
  faClockRotateLeft,
  faTriangleExclamation,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";

import type { SupportedLocale } from "@/i18n/locales";
import { t, type MessageKey } from "@/i18n/messages";

import {
  ABOUT_COMPACT_FRAMED_ICON_WRAPPER_CLASS_NAME,
  ABOUT_FEATURE_CONTENT_GUTTER_CLASS_NAME,
  ABOUT_FRAMED_ICON_CLASS_NAME,
  ABOUT_SECTION_DIVIDER_CLASS_NAME,
} from "./AboutLayout";
import {
  SUBSCRIPTIONS_NESTED_HEADING_CLASS,
  SUBSCRIPTIONS_PANEL_CLASS,
  SUBSCRIPTIONS_SECTION_HEADING_CLASS,
} from "./aboutSubscriptionsStyles";

type MintingMessageKey = Extract<MessageKey, `about.minting.${string}`>;

const MINTING_GUIDE_LAST_REVIEWED_DATE = "2026-08-18";

const m = (
  locale: SupportedLocale,
  key: MintingMessageKey,
  params: Parameters<typeof t>[2] = {}
) => t(locale, key, params);

const formatMintingGuideLastReviewedDate = (locale: SupportedLocale) =>
  new Intl.DateTimeFormat(locale, {
    month: "long",
    timeZone: "UTC",
    year: "numeric",
  }).format(new Date(`${MINTING_GUIDE_LAST_REVIEWED_DATE}T00:00:00Z`));

export default function AboutMintingReference({
  locale,
}: {
  readonly locale: SupportedLocale;
}) {
  return (
    <section
      aria-labelledby="minting-reference-heading"
      className={`${ABOUT_FEATURE_CONTENT_GUTTER_CLASS_NAME} tw-scroll-mt-24 tw-border-0 tw-border-t tw-border-solid tw-py-8 sm:tw-py-12 ${ABOUT_SECTION_DIVIDER_CLASS_NAME}`}
      id="minting-reference"
    >
      <div className="tw-max-w-3xl">
        <h2
          className={SUBSCRIPTIONS_SECTION_HEADING_CLASS}
          id="minting-reference-heading"
        >
          {m(locale, "about.minting.reference.title")}
        </h2>
        <p className="tw-mb-0 tw-mt-2 tw-text-base tw-leading-7 tw-text-iron-300">
          {m(locale, "about.minting.reference.intro")}
        </p>
      </div>

      <div className="tw-mt-5 tw-grid tw-grid-cols-1 tw-gap-4 lg:tw-grid-cols-2">
        <MintingHelp locale={locale} />
        <MintingResources locale={locale} />
      </div>

      <MintingHistory locale={locale} />

      <p
        className="tw-mb-0 tw-mt-6 tw-text-xs tw-leading-5 tw-text-iron-500"
        data-reviewed-at={MINTING_GUIDE_LAST_REVIEWED_DATE}
      >
        {m(locale, "about.minting.reference.reviewed", {
          reviewedAt: formatMintingGuideLastReviewedDate(locale),
        })}
      </p>
    </section>
  );
}

function MintingHelp({ locale }: { readonly locale: SupportedLocale }) {
  return (
    <section
      aria-labelledby="minting-help-heading"
      className={`${SUBSCRIPTIONS_PANEL_CLASS} tw-p-4 sm:tw-p-6`}
    >
      <div className="tw-flex tw-items-center tw-gap-3">
        <span
          className={`${ABOUT_COMPACT_FRAMED_ICON_WRAPPER_CLASS_NAME} tw-border-orange-500/20 tw-bg-orange-500/10 tw-text-orange-300`}
        >
          <FontAwesomeIcon
            aria-hidden="true"
            className={ABOUT_FRAMED_ICON_CLASS_NAME}
            icon={faTriangleExclamation}
          />
        </span>
        <h3
          className={SUBSCRIPTIONS_NESTED_HEADING_CLASS}
          id="minting-help-heading"
        >
          {m(locale, "about.minting.reference.help.title")}
        </h3>
      </div>
      <ul className="tw-m-0 tw-mt-4 tw-space-y-2 tw-pl-5 tw-text-sm tw-leading-6 tw-text-iron-400 marker:tw-text-orange-300">
        <li>{m(locale, "about.minting.reference.help.phase")}</li>
        <li>{m(locale, "about.minting.reference.help.wallet")}</li>
        <li>{m(locale, "about.minting.reference.help.balance")}</li>
        <li>{m(locale, "about.minting.reference.help.refresh")}</li>
      </ul>
    </section>
  );
}

function MintingResources({ locale }: { readonly locale: SupportedLocale }) {
  return (
    <section
      aria-labelledby="minting-resources-heading"
      className={`${SUBSCRIPTIONS_PANEL_CLASS} tw-p-4 sm:tw-p-6`}
    >
      <div className="tw-flex tw-items-center tw-gap-3">
        <span
          className={`${ABOUT_COMPACT_FRAMED_ICON_WRAPPER_CLASS_NAME} tw-border-[#00f0ff]/20 tw-bg-[#00f0ff]/10 tw-text-[#00f0ff]`}
        >
          <FontAwesomeIcon
            aria-hidden="true"
            className={ABOUT_FRAMED_ICON_CLASS_NAME}
            icon={faCircleInfo}
          />
        </span>
        <h3
          className={SUBSCRIPTIONS_NESTED_HEADING_CLASS}
          id="minting-resources-heading"
        >
          {m(locale, "about.minting.reference.resources.title")}
        </h3>
      </div>
      <p className="tw-mb-0 tw-mt-4 tw-text-sm tw-leading-6 tw-text-iron-400">
        {m(locale, "about.minting.reference.resources.description")}
      </p>
      <ul className="tw-m-0 tw-mt-3 tw-list-none tw-space-y-1 tw-p-0">
        <li>
          <ResourceLink
            href="/tools/subscriptions-report"
            label={m(
              locale,
              "about.minting.reference.resources.subscriptionsReport"
            )}
          />
        </li>
        <li>
          <ResourceLink
            href="/open-data"
            label={m(locale, "about.minting.reference.resources.openData")}
          />
        </li>
        <li>
          <ResourceLink
            href="/network/definitions"
            label={m(
              locale,
              "about.minting.reference.resources.networkDefinitions"
            )}
          />
        </li>
      </ul>
    </section>
  );
}

function ResourceLink({
  href,
  label,
}: {
  readonly href: string;
  readonly label: string;
}) {
  return (
    <Link
      className="tw-inline-flex tw-min-h-10 tw-items-center tw-gap-2 tw-rounded-lg tw-px-1 tw-text-sm tw-font-medium tw-text-iron-300 tw-underline tw-decoration-iron-600 tw-underline-offset-4 hover:tw-text-iron-50 focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-[#00f0ff]/60"
      href={href}
    >
      {label}
      <FontAwesomeIcon
        aria-hidden="true"
        className="tw-text-[10px] tw-text-iron-600"
        icon={faArrowRight}
      />
    </Link>
  );
}

function MintingHistory({ locale }: { readonly locale: SupportedLocale }) {
  return (
    <section
      aria-labelledby="minting-history-heading"
      className="tw-mt-4 tw-rounded-xl tw-border tw-border-solid tw-border-white/[0.08] tw-bg-black/20 tw-p-4 sm:tw-p-6"
    >
      <div className="tw-flex tw-items-start tw-gap-3">
        <span
          className={`${ABOUT_COMPACT_FRAMED_ICON_WRAPPER_CLASS_NAME} tw-border-white/10 tw-bg-white/[0.05] tw-text-iron-300`}
        >
          <FontAwesomeIcon
            aria-hidden="true"
            className={ABOUT_FRAMED_ICON_CLASS_NAME}
            icon={faClockRotateLeft}
          />
        </span>
        <div className="tw-min-w-0">
          <h3
            className={SUBSCRIPTIONS_NESTED_HEADING_CLASS}
            id="minting-history-heading"
          >
            {m(locale, "about.minting.reference.history.title")}
          </h3>
          <p className="tw-mb-0 tw-mt-2 tw-text-sm tw-font-medium tw-leading-6 tw-text-orange-300/90">
            {m(locale, "about.minting.reference.history.notice")}
          </p>
        </div>
      </div>

      <p className="tw-mb-0 tw-mt-4 tw-max-w-4xl tw-text-sm tw-leading-6 tw-text-iron-400">
        {m(locale, "about.minting.reference.history.summary")}
      </p>

      <details className="tw-mt-4 tw-rounded-lg tw-border tw-border-solid tw-border-iron-800/60 tw-bg-iron-950/70 tw-p-4 open:tw-bg-iron-950">
        <summary className="tw-min-h-6 tw-cursor-pointer tw-rounded-sm tw-text-sm tw-font-medium tw-leading-6 tw-text-iron-200 focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-[#00f0ff]/60">
          {m(locale, "about.minting.reference.history.details")}
        </summary>
        <ul className="tw-mb-0 tw-mt-4 tw-space-y-2 tw-pl-5 tw-text-sm tw-leading-6 tw-text-iron-400 marker:tw-text-iron-600">
          <li>{m(locale, "about.minting.reference.history.access")}</li>
          <li>{m(locale, "about.minting.reference.history.distribution")}</li>
          <li>{m(locale, "about.minting.reference.history.invitation")}</li>
        </ul>
      </details>
    </section>
  );
}

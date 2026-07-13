"use client";

import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import {
  faArrowRight,
  faChartLine,
  faEarthAmericas,
  faGasPump,
  faSliders,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";
import type { ReactNode } from "react";

import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import type { SupportedLocale } from "@/i18n/locales";
import { t, type MessageKey } from "@/i18n/messages";

import { ABOUT_MOBILE_COLUMN_GUTTER_BREAKOUT_CLASS } from "./AboutLayout";
import AboutSubscriptionsProfileButton from "./AboutSubscriptionsProfileButton";
import AboutSubscriptionsReference from "./AboutSubscriptionsReference";
import {
  SUBSCRIPTIONS_PANEL_CLASS,
  SUBSCRIPTIONS_INTERACTIVE_PANEL_CLASS,
  SUBSCRIPTIONS_SECTION_HEADING_CLASS,
} from "./aboutSubscriptionsStyles";

type SubscriptionMessageKey = Extract<
  MessageKey,
  `about.subscriptions.${string}`
>;

interface OverviewBenefit {
  readonly icon: IconDefinition;
  readonly iconClassName: string;
  readonly iconWrapperClassName: string;
  readonly messageKey: SubscriptionMessageKey;
}

const OVERVIEW_BENEFITS: readonly OverviewBenefit[] = [
  {
    icon: faGasPump,
    iconClassName: "tw-text-[#00f0ff]",
    iconWrapperClassName: "tw-bg-[#00f0ff]/10",
    messageKey: "about.subscriptions.overview.gasSavings",
  },
  {
    icon: faEarthAmericas,
    iconClassName: "tw-text-[#7000ff]",
    iconWrapperClassName: "tw-bg-[#7000ff]/10",
    messageKey: "about.subscriptions.overview.awayFromComputer",
  },
  {
    icon: faSliders,
    iconClassName: "tw-text-white/70",
    iconWrapperClassName: "tw-bg-white/5",
    messageKey: "about.subscriptions.overview.setAndForget",
  },
] as const;

const m = (
  locale: SupportedLocale,
  key: SubscriptionMessageKey,
  params: Parameters<typeof t>[2] = {}
) => t(locale, key, params);

export default function AboutSubscriptions() {
  const locale = useBrowserLocale();

  return (
    <article
      className={`tw-w-full tw-pb-12 ${ABOUT_MOBILE_COLUMN_GUTTER_BREAKOUT_CLASS}`}
    >
      <SubscriptionHeader locale={locale} />
      <Overview locale={locale} />
      <AboutSubscriptionsReference locale={locale} />
    </article>
  );
}

function SubscriptionHeader({
  locale,
}: {
  readonly locale: SupportedLocale;
}) {
  return (
    <header className="tw-px-1 tw-pb-12 tw-pt-6 sm:tw-px-2 sm:tw-pt-8">
      <div className="tw-max-w-4xl">
        <h1 className="tw-m-0 tw-text-3xl tw-font-medium tw-leading-tight tw-tracking-tight tw-text-white/90 sm:tw-text-4xl">
          {m(locale, "about.subscriptions.hero.title")}
        </h1>
        <p className="tw-mb-0 tw-mt-3 tw-max-w-3xl tw-text-sm tw-font-light tw-leading-6 tw-text-white/50 sm:tw-text-base sm:tw-leading-7">
          {m(locale, "about.subscriptions.overview.intro")}
        </p>
        <div className="tw-mt-5 tw-flex tw-justify-start empty:tw-hidden">
          <AboutSubscriptionsProfileButton variant="white" />
        </div>
        <Link
          className="tw-group/report tw-mt-7 tw-inline-flex tw-w-full tw-items-center tw-gap-4 tw-rounded-lg tw-border tw-border-solid tw-border-white/5 tw-bg-white/[0.02] tw-px-5 tw-py-3 tw-text-left tw-text-sm tw-text-white/40 tw-no-underline tw-transition-all hover:tw-border-white/10 hover:tw-bg-white/[0.04] hover:tw-text-white/50 hover:tw-no-underline focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-[#00f0ff]/50 sm:tw-w-auto lg:tw-whitespace-nowrap"
          href="/tools/subscriptions-report"
        >
          <FontAwesomeIcon
            aria-hidden="true"
            className="tw-shrink-0 tw-text-white/30 tw-transition-colors group-hover/report:tw-text-[#00f0ff]"
            icon={faChartLine}
          />
          <span>
            {m(locale, "about.subscriptions.reference.reportLead")} {" "}
            <span className="tw-font-medium tw-text-white/70 tw-transition-colors group-hover/report:tw-text-white">
              {m(locale, "about.subscriptions.reference.reportLink")}
            </span>
          </span>
          <FontAwesomeIcon
            aria-hidden="true"
            className="tw-ml-auto tw-shrink-0 tw-text-[10px] tw-text-white/20 tw-transition-all group-hover/report:tw-translate-x-1 group-hover/report:tw-text-white motion-reduce:tw-transform-none"
            icon={faArrowRight}
          />
        </Link>
      </div>
      <div className="tw-mt-12 tw-h-px tw-bg-white/5" />
    </header>
  );
}

function Overview({ locale }: { readonly locale: SupportedLocale }) {
  return (
    <section
      aria-labelledby="subscription-overview-heading"
      className="tw-px-1 tw-pb-24 sm:tw-px-2 sm:tw-pb-32"
    >
      <div className="tw-max-w-3xl">
        <h2
          className={SUBSCRIPTIONS_SECTION_HEADING_CLASS}
          id="subscription-overview-heading"
        >
          {m(locale, "about.subscriptions.overview.title")}
        </h2>
      </div>

      <ul className="tw-m-0 tw-mt-8 tw-grid tw-list-none tw-grid-cols-1 tw-gap-6 tw-p-0 md:tw-grid-cols-3">
        {OVERVIEW_BENEFITS.map((benefit) => {
          return (
            <li
              className={`${SUBSCRIPTIONS_INTERACTIVE_PANEL_CLASS} tw-flex tw-min-h-[240px] tw-flex-col tw-items-start tw-p-8`}
              key={benefit.messageKey}
            >
              <span
                className={`tw-flex tw-size-12 tw-items-center tw-justify-center tw-rounded-full ${benefit.iconWrapperClassName}`}
              >
                <FontAwesomeIcon
                  aria-hidden="true"
                  className={`tw-text-xl ${benefit.iconClassName}`}
                  icon={benefit.icon}
                />
              </span>
              <p className="tw-mb-0 tw-mt-6 tw-text-sm tw-leading-6 tw-text-white/40">
                {m(locale, benefit.messageKey)}
              </p>
            </li>
          );
        })}
      </ul>

      <div className="tw-mt-6 tw-grid tw-grid-cols-1 tw-gap-6 lg:tw-grid-cols-2">
        <OverviewRule
          title={m(
            locale,
            "about.subscriptions.overview.notMintpass.title"
          )}
        >
          <ul className="tw-m-0 tw-space-y-3 tw-pl-5 tw-text-sm tw-leading-6 tw-text-iron-300 marker:tw-text-primary-300">
            <li>
              {m(locale, "about.subscriptions.overview.notMintpass.choice")}
            </li>
            <li>
              {m(
                locale,
                "about.subscriptions.overview.notMintpass.eligibility"
              )}
            </li>
            <li>
              {m(
                locale,
                "about.subscriptions.overview.notMintpass.remoteMinting"
              )}
            </li>
          </ul>
        </OverviewRule>

        <OverviewRule
          title={m(
            locale,
            "about.subscriptions.overview.regularMinting.title"
          )}
        >
          <ul className="tw-m-0 tw-space-y-3 tw-pl-5 tw-text-sm tw-leading-6 tw-text-iron-300 marker:tw-text-primary-300">
            <li>
              {m(
                locale,
                "about.subscriptions.overview.regularMinting.normal"
              )}
            </li>
            <li>
              {m(
                locale,
                "about.subscriptions.overview.regularMinting.alternative"
              )}
            </li>
          </ul>
        </OverviewRule>
      </div>

    </section>
  );
}

function OverviewRule({
  children,
  title,
}: {
  readonly children: ReactNode;
  readonly title: string;
}) {
  return (
    <div className={`${SUBSCRIPTIONS_PANEL_CLASS} tw-p-6 sm:tw-p-8`}>
      <h3 className="tw-m-0 tw-text-lg tw-font-medium tw-text-white/90">
        {title}
      </h3>
      <div className="tw-mt-5">{children}</div>
    </div>
  );
}

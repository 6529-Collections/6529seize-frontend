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
import { t, tRich, type MessageKey } from "@/i18n/messages";

import {
  ABOUT_DOCUMENTATION_PAGE_TITLE_CLASS_NAME,
  ABOUT_FEATURE_CONTENT_GUTTER_CLASS_NAME,
  ABOUT_FRAMED_ICON_CLASS_NAME,
  ABOUT_FRAMED_ICON_WRAPPER_CLASS_NAME,
  ABOUT_MOBILE_COLUMN_GUTTER_BREAKOUT_CLASS,
} from "./AboutLayout";
import AboutSubscriptionsProfileButton from "./AboutSubscriptionsProfileButton";
import AboutSubscriptionsReference from "./AboutSubscriptionsReference";
import {
  SUBSCRIPTIONS_INTERACTIVE_PANEL_CLASS,
  SUBSCRIPTIONS_NESTED_HEADING_CLASS,
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
    iconWrapperClassName: "tw-border-[#00f0ff]/20 tw-bg-[#00f0ff]/10",
    messageKey: "about.subscriptions.overview.gasSavings",
  },
  {
    icon: faEarthAmericas,
    iconClassName: "tw-text-[#8f5cff]",
    iconWrapperClassName: "tw-border-[#8f5cff]/20 tw-bg-[#8f5cff]/10",
    messageKey: "about.subscriptions.overview.awayFromComputer",
  },
  {
    icon: faSliders,
    iconClassName: "tw-text-iron-300",
    iconWrapperClassName: "tw-border-white/10 tw-bg-white/[0.05]",
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

function SubscriptionHeader({ locale }: { readonly locale: SupportedLocale }) {
  return (
    <header
      className={`${ABOUT_FEATURE_CONTENT_GUTTER_CLASS_NAME} tw-pb-10 tw-pt-4 sm:tw-pb-12 sm:tw-pt-8`}
    >
      <div className="tw-max-w-4xl">
        <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-3">
          <h1 className={ABOUT_DOCUMENTATION_PAGE_TITLE_CLASS_NAME}>
            {m(locale, "about.subscriptions.hero.title")}
          </h1>
          <div className="tw-flex tw-justify-start empty:tw-hidden">
            <AboutSubscriptionsProfileButton variant="white" />
          </div>
        </div>
        <div className="tw-mt-5">
          <Link
            className="tw-group/report -tw-ml-1 tw-inline-flex tw-max-w-full tw-items-start tw-gap-2 tw-rounded-md tw-px-1 tw-py-1 tw-text-left tw-text-sm tw-leading-6 tw-text-iron-400 tw-no-underline tw-transition-colors hover:tw-text-iron-300 hover:tw-no-underline focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-[#00f0ff]/50 sm:tw-items-center"
            href="/tools/subscriptions-report"
          >
            <FontAwesomeIcon
              aria-hidden="true"
              className="tw-mt-1 tw-shrink-0 tw-text-iron-600 tw-transition-colors group-hover/report:tw-text-[#00f0ff] sm:tw-mt-0"
              icon={faChartLine}
            />
            <span>
              {m(locale, "about.subscriptions.reference.reportLead")}{" "}
              <span className="tw-font-medium tw-text-iron-200 tw-transition-colors group-hover/report:tw-text-iron-50">
                {m(locale, "about.subscriptions.reference.reportLink")}
              </span>
            </span>
            <FontAwesomeIcon
              aria-hidden="true"
              className="tw-mt-1 tw-hidden tw-shrink-0 tw-text-[10px] tw-text-iron-600 tw-transition-all group-hover/report:tw-translate-x-1 group-hover/report:tw-text-iron-200 motion-reduce:tw-transform-none sm:tw-mt-0 sm:tw-block"
              icon={faArrowRight}
            />
          </Link>
        </div>
      </div>
    </header>
  );
}

function Overview({ locale }: { readonly locale: SupportedLocale }) {
  return (
    <section
      aria-labelledby="subscription-overview-heading"
      className={`${ABOUT_FEATURE_CONTENT_GUTTER_CLASS_NAME} tw-pb-8 sm:tw-pb-12`}
    >
      <div className="tw-max-w-3xl">
        <h2
          className={SUBSCRIPTIONS_SECTION_HEADING_CLASS}
          id="subscription-overview-heading"
        >
          {m(locale, "about.subscriptions.overview.title")}
        </h2>
        <p className="tw-mb-0 tw-mt-2 tw-text-base tw-font-normal tw-leading-7 tw-text-iron-300">
          {m(locale, "about.subscriptions.overview.intro")}
        </p>
      </div>

      <ul className="tw-m-0 tw-mt-4 tw-grid tw-list-none tw-grid-cols-1 tw-gap-3 tw-p-0 md:tw-grid-cols-3 md:tw-gap-6">
        {OVERVIEW_BENEFITS.map((benefit) => {
          return (
            <li
              className={`${SUBSCRIPTIONS_INTERACTIVE_PANEL_CLASS} tw-flex tw-flex-row tw-items-center tw-gap-4 tw-p-4 md:tw-flex-col md:tw-items-start md:tw-gap-0 md:tw-p-6`}
              key={benefit.messageKey}
            >
              <span
                className={`${ABOUT_FRAMED_ICON_WRAPPER_CLASS_NAME} ${benefit.iconWrapperClassName}`}
              >
                <FontAwesomeIcon
                  aria-hidden="true"
                  className={`${ABOUT_FRAMED_ICON_CLASS_NAME} ${benefit.iconClassName}`}
                  icon={benefit.icon}
                />
              </span>
              <p className="tw-mb-0 tw-mt-0 tw-text-sm tw-leading-6 tw-text-iron-400 md:tw-mt-5">
                {m(locale, benefit.messageKey)}
              </p>
            </li>
          );
        })}
      </ul>

      <div className="tw-mt-8 tw-flex tw-max-w-4xl tw-flex-col tw-gap-10 sm:tw-mt-10 sm:tw-gap-12">
        <OverviewRule
          title={subscriptionRuleTitle(
            locale,
            "about.subscriptions.overview.notMintpass.title"
          )}
        >
          <ul className="tw-m-0 tw-space-y-3 tw-pl-5 tw-text-base tw-leading-7 tw-text-iron-300 marker:tw-text-[#00f0ff]">
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
          title={subscriptionRuleTitle(
            locale,
            "about.subscriptions.overview.regularMinting.title"
          )}
        >
          <ul className="tw-m-0 tw-space-y-3 tw-pl-5 tw-text-base tw-leading-7 tw-text-iron-300 marker:tw-text-[#8f5cff]">
            <li>
              {m(locale, "about.subscriptions.overview.regularMinting.normal")}
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
  readonly title: ReactNode;
}) {
  return (
    <section>
      <h3 className={SUBSCRIPTIONS_NESTED_HEADING_CLASS}>{title}</h3>
      <div className="tw-mt-4">{children}</div>
    </section>
  );
}

function subscriptionRuleTitle(
  locale: SupportedLocale,
  key:
    | "about.subscriptions.overview.notMintpass.title"
    | "about.subscriptions.overview.regularMinting.title"
): ReactNode {
  return tRich<ReactNode>(locale, key, {
    not: (
      <span
        className="tw-underline tw-decoration-red tw-decoration-[3px] tw-underline-offset-[8px]"
        key="not"
      >
        {m(locale, "about.subscriptions.overview.emphasis.not")}
      </span>
    ),
  });
}

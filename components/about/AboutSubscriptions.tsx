"use client";

import {
  BoltIcon,
  CheckCircleIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import type { ComponentType, ReactNode, SVGProps } from "react";

import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import type { SupportedLocale } from "@/i18n/locales";
import { t, type MessageKey } from "@/i18n/messages";

import { ABOUT_MOBILE_COLUMN_GUTTER_BREAKOUT_CLASS } from "./AboutLayout";
import AboutSubscriptionsProfileButton from "./AboutSubscriptionsProfileButton";
import AboutSubscriptionsReference from "./AboutSubscriptionsReference";
import {
  SUBSCRIPTIONS_PANEL_CLASS,
  SUBSCRIPTIONS_SECTION_HEADING_CLASS,
} from "./aboutSubscriptionsStyles";

type SubscriptionMessageKey = Extract<
  MessageKey,
  `about.subscriptions.${string}`
>;
type OutlineIcon = ComponentType<SVGProps<SVGSVGElement>>;

interface OverviewBenefit {
  readonly icon: OutlineIcon;
  readonly messageKey: SubscriptionMessageKey;
}

const OVERVIEW_BENEFITS: readonly OverviewBenefit[] = [
  {
    icon: BoltIcon,
    messageKey: "about.subscriptions.overview.gasSavings",
  },
  {
    icon: ClockIcon,
    messageKey: "about.subscriptions.overview.awayFromComputer",
  },
  {
    icon: CheckCircleIcon,
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
      className={`tw-mx-auto tw-w-full tw-max-w-5xl tw-pb-12 ${ABOUT_MOBILE_COLUMN_GUTTER_BREAKOUT_CLASS}`}
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
    <header className="tw-px-1 tw-pb-14 tw-pt-5 sm:tw-px-2 sm:tw-pb-16 sm:tw-pt-9">
      <div className="tw-max-w-3xl">
        <h1 className="tw-m-0 tw-text-4xl tw-font-medium tw-leading-tight tw-tracking-[-0.035em] tw-text-iron-50 sm:tw-text-5xl lg:tw-text-[58px]">
          {m(locale, "about.subscriptions.hero.title")}
        </h1>
        <div className="tw-mt-7 tw-flex tw-justify-start empty:tw-hidden">
          <AboutSubscriptionsProfileButton variant="white" />
        </div>
      </div>
    </header>
  );
}

function Overview({ locale }: { readonly locale: SupportedLocale }) {
  return (
    <section
      aria-labelledby="subscription-overview-heading"
      className="tw-border-0 tw-border-t tw-border-solid tw-border-white/[0.07] tw-px-1 tw-py-16 sm:tw-px-2 sm:tw-py-20"
    >
      <div className="tw-max-w-3xl">
        <h2
          className={SUBSCRIPTIONS_SECTION_HEADING_CLASS}
          id="subscription-overview-heading"
        >
          {m(locale, "about.subscriptions.overview.title")}
        </h2>
        <p className="tw-mb-0 tw-mt-4 tw-text-lg tw-font-medium tw-leading-8 tw-text-iron-200">
          {m(locale, "about.subscriptions.overview.intro")}
        </p>
      </div>

      <ul className="tw-m-0 tw-mt-8 tw-grid tw-list-none tw-grid-cols-1 tw-gap-4 tw-p-0 sm:tw-grid-cols-3 sm:tw-gap-5">
        {OVERVIEW_BENEFITS.map((benefit) => {
          const Icon = benefit.icon;
          return (
            <li
              className={`${SUBSCRIPTIONS_PANEL_CLASS} tw-flex tw-min-h-[165px] tw-flex-col tw-p-6`}
              key={benefit.messageKey}
            >
              <span className="tw-flex tw-size-10 tw-items-center tw-justify-center tw-rounded-full tw-border tw-border-solid tw-border-white/[0.08] tw-bg-white/[0.035]">
                <Icon
                  aria-hidden="true"
                  className="tw-size-5 tw-text-primary-300"
                />
              </span>
              <p className="tw-mb-0 tw-mt-6 tw-text-sm tw-leading-6 tw-text-iron-300">
                {m(locale, benefit.messageKey)}
              </p>
            </li>
          );
        })}
      </ul>

      <div className="tw-mt-5 tw-grid tw-grid-cols-1 tw-gap-5 lg:tw-grid-cols-2">
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

      <p className="tw-mb-0 tw-mt-7 tw-text-sm tw-leading-6 tw-text-iron-400">
        {m(locale, "about.subscriptions.reference.reportLead")} {" "}
        <Link
          className="tw-font-medium tw-text-primary-300 tw-no-underline tw-transition-colors hover:tw-text-primary-200 hover:tw-no-underline focus:tw-rounded-sm focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-300"
          href="/tools/subscriptions-report"
        >
          {m(locale, "about.subscriptions.reference.reportLink")}
        </Link>
      </p>
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
    <div className={`${SUBSCRIPTIONS_PANEL_CLASS} tw-p-6 sm:tw-p-7`}>
      <h3 className="tw-m-0 tw-text-base tw-font-medium tw-text-iron-50">
        {title}
      </h3>
      <div className="tw-mt-5">{children}</div>
    </div>
  );
}

"use client";

import {
  BoltIcon,
  CheckCircleIcon,
  ClockIcon,
  Cog6ToothIcon,
} from "@heroicons/react/24/outline";
import type { ComponentType, SVGProps } from "react";

import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import type { SupportedLocale } from "@/i18n/locales";
import { t, type MessageKey } from "@/i18n/messages";

import AboutSubscriptionsProfileButton from "./AboutSubscriptionsProfileButton";
import AboutSubscriptionsReference from "./AboutSubscriptionsReference";

type SubscriptionMessageKey = Extract<
  MessageKey,
  `about.subscriptions.${string}`
>;
type OutlineIcon = ComponentType<SVGProps<SVGSVGElement>>;

interface Highlight {
  readonly bodyKey: SubscriptionMessageKey;
  readonly icon: OutlineIcon;
  readonly titleKey: SubscriptionMessageKey;
}

interface Step {
  readonly bodyKey: SubscriptionMessageKey;
  readonly titleKey: SubscriptionMessageKey;
}

const HIGHLIGHTS: readonly Highlight[] = [
  {
    icon: CheckCircleIcon,
    titleKey: "about.subscriptions.benefits.choice.title",
    bodyKey: "about.subscriptions.benefits.choice.body",
  },
  {
    icon: ClockIcon,
    titleKey: "about.subscriptions.benefits.remote.title",
    bodyKey: "about.subscriptions.benefits.remote.body",
  },
  {
    icon: BoltIcon,
    titleKey: "about.subscriptions.benefits.gas.title",
    bodyKey: "about.subscriptions.benefits.gas.body",
  },
] as const;

const STEPS: readonly Step[] = [
  {
    titleKey: "about.subscriptions.steps.open.title",
    bodyKey: "about.subscriptions.steps.open.body",
  },
  {
    titleKey: "about.subscriptions.steps.fund.title",
    bodyKey: "about.subscriptions.steps.fund.body",
  },
  {
    titleKey: "about.subscriptions.steps.choose.title",
    bodyKey: "about.subscriptions.steps.choose.body",
  },
  {
    titleKey: "about.subscriptions.steps.receive.title",
    bodyKey: "about.subscriptions.steps.receive.body",
  },
] as const;

const m = (locale: SupportedLocale, key: SubscriptionMessageKey) =>
  t(locale, key);

export default function AboutSubscriptions() {
  const locale = useBrowserLocale();

  return (
    <article className="tw-mx-auto tw-w-full tw-max-w-6xl tw-pb-12 max-sm:-tw-mx-3 max-sm:tw-w-[calc(100%+1.5rem)]">
      <SubscriptionHero locale={locale} />
      <HowItWorks locale={locale} />
      <WhatHappensNext locale={locale} />
      <AboutSubscriptionsReference locale={locale} />
      <FinalAction locale={locale} />
    </article>
  );
}

function SubscriptionHero({ locale }: { readonly locale: SupportedLocale }) {
  return (
    <header className="tw-relative tw-overflow-hidden tw-rounded-xl tw-border tw-border-solid tw-border-white/10 tw-bg-iron-950 tw-px-4 tw-py-8 sm:tw-px-8 sm:tw-py-10 lg:tw-px-10 lg:tw-py-12">
      <div
        aria-hidden="true"
        className="tw-pointer-events-none tw-absolute tw-inset-x-0 tw-top-0 tw-h-px tw-bg-primary-400/60"
      />
      <div className="tw-max-w-3xl">
        <p className="tw-mb-3 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.16em] tw-text-primary-300">
          {m(locale, "about.subscriptions.hero.eyebrow")}
        </p>
        <h1 className="tw-m-0 tw-max-w-3xl tw-text-3xl tw-font-semibold tw-leading-tight tw-tracking-tight tw-text-iron-50 sm:tw-text-4xl lg:tw-text-5xl">
          {m(locale, "about.subscriptions.hero.title")}
        </h1>
        <p className="tw-mb-0 tw-mt-5 tw-max-w-2xl tw-text-base tw-leading-7 tw-text-iron-300 sm:tw-text-lg">
          {m(locale, "about.subscriptions.hero.body")}
        </p>
        <div className="tw-mt-7 tw-flex tw-flex-col tw-items-stretch tw-gap-3 min-[480px]:tw-flex-row min-[480px]:tw-items-center">
          <AboutSubscriptionsProfileButton descriptiveLabels />
          <a
            className="tw-inline-flex tw-min-h-11 tw-items-center tw-justify-center tw-rounded-lg tw-border tw-border-solid tw-border-white/10 tw-px-4 tw-py-2 tw-text-sm tw-font-semibold tw-text-iron-200 tw-no-underline tw-transition-colors hover:tw-bg-white/5 hover:tw-text-iron-50 focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-300"
            href="#how-subscription-minting-works"
          >
            {m(locale, "about.subscriptions.action.learnHow")}
          </a>
        </div>
      </div>

      <div className="tw-mt-9 tw-grid tw-grid-cols-1 tw-gap-3 sm:tw-grid-cols-3">
        {HIGHLIGHTS.map((highlight) => {
          const Icon = highlight.icon;
          return (
            <div
              className="tw-rounded-xl tw-border tw-border-solid tw-border-white/[0.08] tw-bg-white/[0.025] tw-p-5"
              key={highlight.titleKey}
            >
              <Icon
                aria-hidden="true"
                className="tw-mb-4 tw-size-6 tw-text-primary-300"
              />
              <h2 className="tw-m-0 tw-text-base tw-font-semibold tw-text-iron-50">
                {m(locale, highlight.titleKey)}
              </h2>
              <p className="tw-mb-0 tw-mt-2 tw-text-sm tw-leading-6 tw-text-iron-400">
                {m(locale, highlight.bodyKey)}
              </p>
            </div>
          );
        })}
      </div>

      <div className="tw-mt-4 tw-flex tw-gap-3 tw-rounded-lg tw-border tw-border-solid tw-border-primary-400/20 tw-bg-primary-400/[0.06] tw-p-4">
        <Cog6ToothIcon
          aria-hidden="true"
          className="tw-mt-0.5 tw-size-5 tw-shrink-0 tw-text-primary-300"
        />
        <p className="tw-m-0 tw-text-sm tw-leading-6 tw-text-iron-300">
          <strong className="tw-font-semibold tw-text-iron-100">
            {m(locale, "about.subscriptions.notMintpass.title")}
          </strong>{" "}
          {m(locale, "about.subscriptions.notMintpass.body")}
        </p>
      </div>
    </header>
  );
}

function HowItWorks({ locale }: { readonly locale: SupportedLocale }) {
  return (
    <section
      aria-labelledby="how-subscription-minting-heading"
      className="tw-scroll-mt-24 tw-px-1 tw-py-14 sm:tw-px-2 sm:tw-py-16"
      id="how-subscription-minting-works"
    >
      <SectionHeading
        eyebrow={m(locale, "about.subscriptions.how.eyebrow")}
        heading={m(locale, "about.subscriptions.how.title")}
        id="how-subscription-minting-heading"
        intro={m(locale, "about.subscriptions.how.body")}
      />
      <ol className="tw-m-0 tw-mt-9 tw-grid tw-list-none tw-grid-cols-1 tw-gap-4 tw-p-0 md:tw-grid-cols-2">
        {STEPS.map((step, index) => (
          <li
            className="tw-flex tw-gap-4 tw-rounded-xl tw-border tw-border-solid tw-border-white/[0.08] tw-bg-white/[0.025] tw-p-5 sm:tw-p-6"
            key={step.titleKey}
          >
            <span className="tw-flex tw-size-9 tw-shrink-0 tw-items-center tw-justify-center tw-rounded-full tw-border tw-border-solid tw-border-primary-400/40 tw-bg-primary-400/10 tw-text-sm tw-font-semibold tw-text-primary-300">
              {index + 1}
            </span>
            <div>
              <h3 className="tw-m-0 tw-text-base tw-font-semibold tw-text-iron-50">
                {m(locale, step.titleKey)}
              </h3>
              <p className="tw-mb-0 tw-mt-2 tw-text-sm tw-leading-6 tw-text-iron-400">
                {m(locale, step.bodyKey)}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

function WhatHappensNext({ locale }: { readonly locale: SupportedLocale }) {
  const outcomes = [
    {
      title: m(locale, "about.subscriptions.after.balance.title"),
      body: m(locale, "about.subscriptions.after.balance.body"),
    },
    {
      title: m(locale, "about.subscriptions.after.eligibility.title"),
      body: m(locale, "about.subscriptions.after.eligibility.body"),
    },
    {
      title: m(locale, "about.subscriptions.after.delivery.title"),
      body: m(locale, "about.subscriptions.after.delivery.body"),
    },
  ];

  return (
    <section
      aria-labelledby="what-happens-after-subscribing"
      className="tw-rounded-xl tw-border tw-border-solid tw-border-white/10 tw-bg-iron-950 tw-p-5 sm:tw-p-8"
    >
      <SectionHeading
        eyebrow={m(locale, "about.subscriptions.after.eyebrow")}
        heading={m(locale, "about.subscriptions.after.title")}
        id="what-happens-after-subscribing"
      />
      <div className="tw-mt-7 tw-grid tw-grid-cols-1 tw-gap-6 md:tw-grid-cols-3 md:tw-gap-8">
        {outcomes.map((outcome) => (
          <div key={outcome.title}>
            <h3 className="tw-m-0 tw-text-sm tw-font-semibold tw-text-iron-100">
              {outcome.title}
            </h3>
            <p className="tw-mb-0 tw-mt-2 tw-text-sm tw-leading-6 tw-text-iron-400">
              {outcome.body}
            </p>
          </div>
        ))}
      </div>
      <div className="tw-mt-8 tw-border-0 tw-border-t tw-border-solid tw-border-white/10 tw-pt-6">
        <p className="tw-mb-3 tw-text-sm tw-font-semibold tw-text-iron-100">
          {m(locale, "about.subscriptions.important.title")}
        </p>
        <ul className="tw-m-0 tw-space-y-2 tw-pl-5 tw-text-sm tw-leading-6 tw-text-iron-400 marker:tw-text-primary-300">
          <li>{m(locale, "about.subscriptions.important.nonRefundable")}</li>
          <li>{m(locale, "about.subscriptions.important.deadline")}</li>
          <li>{m(locale, "about.subscriptions.important.optional")}</li>
        </ul>
      </div>
    </section>
  );
}

function FinalAction({ locale }: { readonly locale: SupportedLocale }) {
  return (
    <section
      aria-labelledby="subscription-minting-final-action"
      className="tw-mt-14 tw-flex tw-flex-col tw-items-start tw-justify-between tw-gap-6 tw-rounded-xl tw-border tw-border-solid tw-border-primary-400/25 tw-bg-primary-400/[0.07] tw-p-6 sm:tw-p-8 md:tw-flex-row md:tw-items-center"
    >
      <div className="tw-max-w-2xl">
        <p className="tw-mb-2 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.16em] tw-text-primary-300">
          {m(locale, "about.subscriptions.final.eyebrow")}
        </p>
        <h2
          className="tw-m-0 tw-text-2xl tw-font-semibold tw-tracking-tight tw-text-iron-50"
          id="subscription-minting-final-action"
        >
          {m(locale, "about.subscriptions.final.title")}
        </h2>
        <p className="tw-mb-0 tw-mt-2 tw-text-sm tw-leading-6 tw-text-iron-300">
          {m(locale, "about.subscriptions.final.body")}
        </p>
      </div>
      <div className="tw-w-full tw-shrink-0 sm:tw-w-auto">
        <AboutSubscriptionsProfileButton descriptiveLabels />
      </div>
    </section>
  );
}

function SectionHeading({
  eyebrow,
  heading,
  id,
  intro,
}: {
  readonly eyebrow: string;
  readonly heading: string;
  readonly id: string;
  readonly intro?: string;
}) {
  return (
    <div className="tw-max-w-2xl">
      <p className="tw-mb-2 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.16em] tw-text-primary-300">
        {eyebrow}
      </p>
      <h2
        className="tw-m-0 tw-text-2xl tw-font-semibold tw-tracking-tight tw-text-iron-50 sm:tw-text-3xl"
        id={id}
      >
        {heading}
      </h2>
      {intro !== undefined && (
        <p className="tw-mb-0 tw-mt-3 tw-text-base tw-leading-7 tw-text-iron-400">
          {intro}
        </p>
      )}
    </div>
  );
}

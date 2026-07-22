"use client";

import Link from "next/link";
import { useEffect, type ReactNode } from "react";

import { AboutContentsDropdown } from "@/components/about/AboutContentsDropdown";
import { NETWORK_REFERENCE_PAGE_CLASSES } from "@/components/network/networkPageLayoutClasses";
import { useSetTitle } from "@/contexts/TitleContext";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import {
  formatDate,
  formatInteger,
  formatNumber,
  formatTime,
} from "@/i18n/format";
import type { SupportedLocale } from "@/i18n/locales";
import { t, type MessageKey } from "@/i18n/messages";

import TDHCurrentRules from "./TDHCurrentRules";

type TdhMessageKey = Extract<MessageKey, `network.tdh.${string}`>;

interface EditionExample {
  readonly editionSize: number;
  readonly nameKey: TdhMessageKey;
  readonly weight: number;
}

interface RelatedDestination {
  readonly descriptionKey: TdhMessageKey;
  readonly eyebrowKey: TdhMessageKey;
  readonly href: string;
  readonly titleKey: TdhMessageKey;
}

const EFFECTIVE_DATE = Date.UTC(2025, 9, 10);
const DAILY_SNAPSHOT_TIME = Date.UTC(2025, 0, 1, 0, 0);

const PANEL_CLASS =
  "tw-rounded-xl tw-border tw-border-solid tw-border-white/[0.07] tw-bg-iron-950/60";

const EDITION_EXAMPLES: readonly EditionExample[] = [
  {
    editionSize: 1_000,
    nameKey: "network.tdh.how.edition.seizingJpg",
    weight: 3.941,
  },
  {
    editionSize: 300,
    nameKey: "network.tdh.how.edition.nakamotoFreedom",
    weight: 13.136,
  },
  {
    editionSize: 101,
    nameKey: "network.tdh.how.edition.gradients",
    weight: 39.02,
  },
] as const;

const RELATED_DESTINATIONS: readonly RelatedDestination[] = [
  {
    descriptionKey: "network.tdh.related.historic.description",
    eyebrowKey: "network.tdh.related.historic.eyebrow",
    href: "/network/tdh/historic-boosts",
    titleKey: "network.tdh.related.historic.title",
  },
  {
    descriptionKey: "network.tdh.related.definitions.description",
    eyebrowKey: "network.tdh.related.definitions.eyebrow",
    href: "/network/definitions",
    titleKey: "network.tdh.related.definitions.title",
  },
  {
    descriptionKey: "network.tdh.related.stats.description",
    eyebrowKey: "network.tdh.related.stats.eyebrow",
    href: "/network/health/network-tdh",
    titleKey: "network.tdh.related.stats.title",
  },
  {
    descriptionKey: "network.tdh.related.levels.description",
    eyebrowKey: "network.tdh.related.levels.eyebrow",
    href: "/network/levels",
    titleKey: "network.tdh.related.levels.title",
  },
] as const;

const m = (
  locale: SupportedLocale,
  key: TdhMessageKey,
  params: Parameters<typeof t>[2] = {}
) => t(locale, key, params);

const formatSnapshotTime = (locale: SupportedLocale) =>
  m(locale, "network.tdh.value.utcTime", {
    time: formatTime(locale, DAILY_SNAPSHOT_TIME, {
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
      timeZone: "UTC",
    }),
  });

export default function TDHMainPage() {
  const locale = useBrowserLocale();
  const effectiveDate = formatDate(locale, EFFECTIVE_DATE, {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
  const snapshotTime = formatSnapshotTime(locale);

  useSetTitle("TDH | Network");

  useEffect(() => {
    const scrollToCurrentRule = () => {
      if (globalThis.location.hash !== "#tdh-1-4") {
        return;
      }

      globalThis.requestAnimationFrame(() => {
        globalThis.document
          .getElementById("tdh-1-4")
          ?.scrollIntoView({ block: "start" });
      });
    };

    scrollToCurrentRule();
    globalThis.addEventListener("hashchange", scrollToCurrentRule);

    return () => {
      globalThis.removeEventListener("hashchange", scrollToCurrentRule);
    };
  }, []);

  return (
    <main className={`${NETWORK_REFERENCE_PAGE_CLASSES} tw-text-iron-100`}>
      <div className="tw-mx-auto tw-w-full tw-max-w-6xl">
        <AboutContentsDropdown currentHref="/network/tdh" />

        <article className="tw-pb-8 tw-pt-8 sm:tw-pt-12">
          <TDHHeader
            effectiveDate={effectiveDate}
            locale={locale}
            snapshotTime={snapshotTime}
          />
          <HowTDHWorks locale={locale} snapshotTime={snapshotTime} />
          <TDHCurrentRules effectiveDate={effectiveDate} locale={locale} />
          <RelatedDestinations locale={locale} />
        </article>
      </div>
    </main>
  );
}

function TDHHeader({
  effectiveDate,
  locale,
  snapshotTime,
}: {
  readonly effectiveDate: string;
  readonly locale: SupportedLocale;
  readonly snapshotTime: string;
}) {
  const facts = [
    {
      label: m(locale, "network.tdh.hero.measureLabel"),
      value: m(locale, "network.tdh.hero.measureValue"),
    },
    {
      label: m(locale, "network.tdh.hero.updateLabel"),
      value: m(locale, "network.tdh.hero.updateValue", {
        time: snapshotTime,
      }),
    },
    {
      label: m(locale, "network.tdh.hero.modelLabel"),
      value: m(locale, "network.tdh.hero.modelValue", {
        date: effectiveDate,
      }),
    },
  ] as const;

  return (
    <header className="tw-pb-10 sm:tw-pb-14">
      <p className="tw-m-0 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.16em] tw-text-iron-500">
        {m(locale, "network.tdh.hero.eyebrow")}
      </p>
      <div className="tw-mt-3 tw-max-w-3xl">
        <h1 className="tw-m-0 tw-text-3xl tw-font-semibold tw-leading-tight tw-tracking-tight tw-text-iron-50 sm:tw-text-4xl">
          {m(locale, "network.tdh.hero.title")}
        </h1>
        <p className="tw-mb-0 tw-mt-4 tw-text-base tw-font-light tw-leading-7 tw-text-iron-300 sm:tw-text-lg sm:tw-leading-8">
          {m(locale, "network.tdh.hero.intro")}
        </p>
      </div>

      <dl className="tw-m-0 tw-mt-6 tw-grid tw-grid-cols-1 tw-gap-px tw-overflow-hidden tw-rounded-xl tw-border tw-border-solid tw-border-white/[0.07] tw-bg-white/[0.07] sm:tw-grid-cols-3">
        {facts.map((fact) => (
          <div className="tw-bg-iron-950 tw-p-4 sm:tw-p-5" key={fact.label}>
            <dt className="tw-text-xs tw-font-medium tw-uppercase tw-tracking-wide tw-text-iron-500">
              {fact.label}
            </dt>
            <dd className="tw-m-0 tw-mt-2 tw-text-sm tw-font-medium tw-leading-6 tw-text-iron-100">
              {fact.value}
            </dd>
          </div>
        ))}
      </dl>
    </header>
  );
}

function HowTDHWorks({
  locale,
  snapshotTime,
}: {
  readonly locale: SupportedLocale;
  readonly snapshotTime: string;
}) {
  return (
    <section
      aria-labelledby="tdh-how-heading"
      className="tw-border-0 tw-border-t tw-border-solid tw-border-white/[0.07] tw-py-10 sm:tw-py-14"
    >
      <div className="tw-max-w-3xl">
        <h2
          className="tw-m-0 tw-text-xl tw-font-medium tw-tracking-tight tw-text-iron-100 sm:tw-text-2xl"
          id="tdh-how-heading"
        >
          {m(locale, "network.tdh.how.title")}
        </h2>
        <p className="tw-mb-0 tw-mt-3 tw-text-base tw-leading-7 tw-text-iron-400">
          {m(locale, "network.tdh.how.intro")}
        </p>
      </div>

      <ol className="tw-m-0 tw-mt-6 tw-grid tw-list-none tw-grid-cols-1 tw-gap-4 tw-p-0 lg:tw-grid-cols-3 lg:tw-gap-5">
        <CalculationStep
          locale={locale}
          number={1}
          title={m(locale, "network.tdh.how.unweighted.title")}
        >
          <p className="tw-m-0 tw-text-sm tw-leading-6 tw-text-iron-400">
            {m(locale, "network.tdh.how.unweighted.body")}
          </p>
          <p className="tw-mb-0 tw-mt-5 tw-font-mono tw-text-lg tw-font-medium tw-text-iron-100">
            {m(locale, "network.tdh.how.unweighted.formula")}
          </p>
        </CalculationStep>

        <CalculationStep
          locale={locale}
          number={2}
          title={m(locale, "network.tdh.how.edition.title")}
        >
          <p className="tw-m-0 tw-text-sm tw-leading-6 tw-text-iron-400">
            {m(locale, "network.tdh.how.edition.body", {
              editionSize: formatInteger(locale, 3_941),
            })}
          </p>
          <EditionExamples locale={locale} />
        </CalculationStep>

        <CalculationStep
          locale={locale}
          number={3}
          title={m(locale, "network.tdh.how.boosters.title")}
        >
          <p className="tw-m-0 tw-text-sm tw-leading-6 tw-text-iron-400">
            {m(locale, "network.tdh.how.boosters.body")}
          </p>
          <p className="tw-mb-0 tw-mt-5 tw-rounded-lg tw-border tw-border-solid tw-border-primary-400/25 tw-bg-primary-500/10 tw-px-3 tw-py-2 tw-text-sm tw-font-medium tw-leading-6 tw-text-primary-300">
            {m(locale, "network.tdh.how.boosters.rule")}
          </p>
        </CalculationStep>
      </ol>

      <p className="tw-mb-0 tw-mt-5 tw-text-sm tw-leading-6 tw-text-iron-500">
        {m(locale, "network.tdh.how.snapshot", { time: snapshotTime })}
      </p>
    </section>
  );
}

function CalculationStep({
  children,
  locale,
  number,
  title,
}: {
  readonly children: ReactNode;
  readonly locale: SupportedLocale;
  readonly number: number;
  readonly title: string;
}) {
  return (
    <li className={`${PANEL_CLASS} tw-p-5 sm:tw-p-6`}>
      <p className="tw-m-0 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.14em] tw-text-iron-500">
        {m(locale, "network.tdh.how.stepLabel", {
          number: formatInteger(locale, number),
        })}
      </p>
      <h3 className="tw-mb-0 tw-mt-2 tw-text-lg tw-font-medium tw-leading-7 tw-text-iron-100">
        {title}
      </h3>
      <div className="tw-mt-3">{children}</div>
    </li>
  );
}

function EditionExamples({ locale }: { readonly locale: SupportedLocale }) {
  return (
    <div className="tw-mt-5 tw-overflow-hidden tw-rounded-lg tw-border tw-border-solid tw-border-white/[0.07]">
      <table className="tw-w-full tw-border-collapse tw-text-left tw-text-xs">
        <caption className="tw-sr-only">
          {m(locale, "network.tdh.how.edition.caption")}
        </caption>
        <thead className="tw-bg-iron-900/80 tw-text-iron-500">
          <tr>
            <th className="tw-px-3 tw-py-2 tw-font-medium" scope="col">
              {m(locale, "network.tdh.how.edition.cardColumn")}
            </th>
            <th
              className="tw-px-3 tw-py-2 tw-text-right tw-font-medium"
              scope="col"
            >
              {m(locale, "network.tdh.how.edition.weightColumn")}
            </th>
          </tr>
        </thead>
        <tbody className="tw-divide-y tw-divide-white/[0.07] tw-bg-black/20">
          {EDITION_EXAMPLES.map((example) => (
            <tr key={example.nameKey}>
              <th
                className="tw-px-3 tw-py-2 tw-font-normal tw-leading-5 tw-text-iron-300"
                scope="row"
              >
                <span className="tw-block tw-font-medium tw-text-iron-200">
                  {m(locale, example.nameKey)}
                </span>
                <span className="tw-block tw-text-iron-500">
                  {m(locale, "network.tdh.how.edition.editionSize", {
                    editionSize: formatInteger(locale, example.editionSize),
                  })}
                </span>
              </th>
              <td className="tw-px-3 tw-py-2 tw-text-right tw-font-mono tw-font-medium tw-text-iron-100">
                {formatNumber(locale, example.weight, {
                  minimumFractionDigits: 3,
                  maximumFractionDigits: 3,
                })}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function RelatedDestinations({ locale }: { readonly locale: SupportedLocale }) {
  return (
    <section
      aria-labelledby="tdh-related-heading"
      className="tw-border-0 tw-border-t tw-border-solid tw-border-white/[0.07] tw-pt-10 sm:tw-pt-14"
    >
      <div className="tw-max-w-3xl">
        <h2
          className="tw-m-0 tw-text-xl tw-font-medium tw-tracking-tight tw-text-iron-100 sm:tw-text-2xl"
          id="tdh-related-heading"
        >
          {m(locale, "network.tdh.related.title")}
        </h2>
        <p className="tw-mb-0 tw-mt-3 tw-text-base tw-leading-7 tw-text-iron-400">
          {m(locale, "network.tdh.related.intro")}
        </p>
      </div>

      <ul className="tw-m-0 tw-mt-6 tw-grid tw-list-none tw-grid-cols-1 tw-gap-3 tw-p-0 sm:tw-grid-cols-2 lg:tw-grid-cols-4">
        {RELATED_DESTINATIONS.map((destination) => (
          <li key={destination.href}>
            <Link
              className={`${PANEL_CLASS} tw-group tw-flex tw-h-full tw-min-h-40 tw-flex-col tw-p-5 tw-no-underline tw-transition-colors hover:tw-border-white/[0.12] hover:tw-bg-iron-900/60 hover:tw-no-underline focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400/70 motion-reduce:tw-transition-none`}
              href={destination.href}
            >
              <span className="tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.14em] tw-text-iron-500">
                {m(locale, destination.eyebrowKey)}
              </span>
              <span className="tw-mt-2 tw-text-base tw-font-medium tw-leading-6 tw-text-iron-100">
                {m(locale, destination.titleKey)}
              </span>
              <span className="tw-mt-2 tw-text-sm tw-leading-6 tw-text-iron-400">
                {m(locale, destination.descriptionKey)}
              </span>
              <span
                aria-hidden="true"
                className="tw-mt-auto tw-pt-5 tw-text-lg tw-text-iron-500 tw-transition-all group-hover:tw-translate-x-1 group-hover:tw-text-iron-200 motion-reduce:tw-transition-none"
              >
                &rarr;
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

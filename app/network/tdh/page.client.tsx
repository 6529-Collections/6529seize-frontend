"use client";

import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { faArrowTrendUp, faChartLine } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";
import { useEffect, type ReactNode } from "react";

import { AboutContentsDropdown } from "@/components/about/AboutContentsDropdown";
import {
  NETWORK_REFERENCE_DROPDOWN_ROW_CLASSES,
  NETWORK_REFERENCE_PAGE_CLASSES,
} from "@/components/network/networkPageLayoutClasses";
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
  readonly actionKey: TdhMessageKey;
  readonly descriptionKey: TdhMessageKey;
  readonly href: string;
  readonly icon: IconDefinition;
  readonly iconClassName: string;
  readonly iconWrapperClassName: string;
  readonly titleKey: TdhMessageKey;
}

const EFFECTIVE_DATE = Date.UTC(2025, 9, 10);
const DAILY_SNAPSHOT_TIME = Date.UTC(2025, 0, 1, 0, 0);

const EDITORIAL_GRID_CLASS =
  "tw-grid tw-grid-cols-1 tw-items-start tw-gap-4 lg:tw-grid-cols-[minmax(0,1fr)_minmax(0,2.5fr)] lg:tw-gap-12";
const SECTION_HEADING_CLASS =
  "tw-m-0 tw-text-lg tw-font-medium tw-leading-tight tw-tracking-[-0.04em] tw-text-iron-100 sm:tw-text-xl";
const PANEL_CLASS =
  "tw-rounded-xl tw-border tw-border-solid tw-border-iron-800/50 tw-bg-iron-900/55";
const INTERACTIVE_PANEL_CLASS = `${PANEL_CLASS} tw-transform tw-transition-all tw-duration-300 tw-ease-out desktop-hover:hover:-tw-translate-y-0.5 desktop-hover:hover:tw-border-iron-700/60 desktop-hover:hover:tw-bg-iron-900/75 motion-reduce:tw-transition-none`;

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
    actionKey: "network.tdh.related.stats.action",
    descriptionKey: "network.tdh.related.stats.description",
    href: "/network/health/network-tdh",
    icon: faChartLine,
    iconClassName: "tw-text-[#00f0ff]",
    iconWrapperClassName: "tw-bg-[#00f0ff]/10",
    titleKey: "network.tdh.related.stats.title",
  },
  {
    actionKey: "network.tdh.related.levels.action",
    descriptionKey: "network.tdh.related.levels.description",
    href: "/network/levels",
    icon: faArrowTrendUp,
    iconClassName: "tw-text-[#8f5cff]",
    iconWrapperClassName: "tw-bg-[#7000ff]/20",
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
        const currentRule = globalThis.document.getElementById("tdh-1-4");
        currentRule?.scrollIntoView({ block: "start" });
        globalThis.document
          .getElementById("tdh-current-heading")
          ?.focus({ preventScroll: true });
      });
    };

    scrollToCurrentRule();
    globalThis.addEventListener("hashchange", scrollToCurrentRule);

    return () => {
      globalThis.removeEventListener("hashchange", scrollToCurrentRule);
    };
  }, []);

  return (
    <main
      className={`${NETWORK_REFERENCE_PAGE_CLASSES} tw-border-y-0 tw-border-l-0 tw-border-r tw-border-solid tw-border-iron-900 tw-bg-[#0D0D0F] tw-text-iron-100`}
    >
      <div className="tw-w-full">
        <AboutContentsDropdown
          className={NETWORK_REFERENCE_DROPDOWN_ROW_CLASSES}
          currentHref="/network/tdh"
          withDivider
        />

        <article className="tw-pb-12 tw-pt-4 max-sm:tw-px-1 sm:tw-pt-8">
          <TDHHeader locale={locale} />
          <HowTDHWorks locale={locale} snapshotTime={snapshotTime} />
          <TDHCurrentRules effectiveDate={effectiveDate} locale={locale} />
          <RelatedDestinations locale={locale} />
        </article>
      </div>
    </main>
  );
}

function TDHHeader({ locale }: { readonly locale: SupportedLocale }) {
  return (
    <section
      aria-labelledby="tdh-page-heading"
      className={`${EDITORIAL_GRID_CLASS} tw-pb-8 sm:tw-pb-12`}
    >
      <div className="lg:tw-sticky lg:tw-top-28">
        <h1
          className={SECTION_HEADING_CLASS}
          id="tdh-page-heading"
        >
          {m(locale, "network.tdh.hero.title")}
        </h1>
      </div>
      <p className="tw-m-0 tw-max-w-3xl tw-text-base tw-font-light tw-leading-7 tw-text-iron-400">
        {m(locale, "network.tdh.hero.intro")}
      </p>
    </section>
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
      className={`${EDITORIAL_GRID_CLASS} tw-border-0 tw-border-t tw-border-solid tw-border-white/[0.06] tw-py-8 sm:tw-py-12`}
    >
      <div className="lg:tw-sticky lg:tw-top-28">
        <h2 className={SECTION_HEADING_CLASS} id="tdh-how-heading">
          {m(locale, "network.tdh.how.title")}
        </h2>
      </div>

      <div>
        <ol className="tw-m-0 tw-list-none tw-space-y-6 tw-p-0">
          <CalculationStep locale={locale} number={1}>
            <p className="tw-m-0 tw-text-base tw-leading-7 tw-text-iron-300">
              <span className="tw-font-medium tw-text-iron-100">
                {m(locale, "network.tdh.how.unweighted.title")}
              </span>{" "}
              {m(locale, "network.tdh.how.unweighted.body")}
            </p>
          </CalculationStep>

          <CalculationStep locale={locale} number={2}>
            <p className="tw-m-0 tw-text-base tw-leading-7 tw-text-iron-300">
              <span className="tw-font-medium tw-text-iron-100">
                {m(locale, "network.tdh.how.edition.title")}
              </span>{" "}
              {m(locale, "network.tdh.how.edition.body", {
                editionSize: formatInteger(locale, 3_941),
              })}
            </p>
            <EditionExamples locale={locale} />
          </CalculationStep>

          <CalculationStep locale={locale} number={3}>
            <p className="tw-m-0 tw-text-base tw-leading-7 tw-text-iron-300">
              <span className="tw-font-medium tw-text-iron-100">
                {m(locale, "network.tdh.how.boosters.title")}
              </span>{" "}
              {m(locale, "network.tdh.how.boosters.body")}
            </p>
          </CalculationStep>
        </ol>

        <p className="tw-mb-0 tw-mt-6 tw-font-mono tw-text-xs tw-leading-5 tw-text-iron-600">
          {m(locale, "network.tdh.how.snapshot", { time: snapshotTime })}
        </p>
      </div>
    </section>
  );
}

function CalculationStep({
  children,
  locale,
  number,
}: {
  readonly children: ReactNode;
  readonly locale: SupportedLocale;
  readonly number: number;
}) {
  return (
    <li className="tw-grid tw-grid-cols-[2rem_minmax(0,1fr)] tw-gap-3 sm:tw-gap-4">
      <span className="tw-pt-0.5 tw-text-sm tw-font-medium tw-text-iron-600">
        {formatInteger(locale, number)}.
      </span>
      <div className="tw-min-w-0">{children}</div>
    </li>
  );
}

function EditionExamples({ locale }: { readonly locale: SupportedLocale }) {
  return (
    <div className={`${PANEL_CLASS} tw-mt-4 tw-p-4`}>
      <p className="tw-m-0 tw-text-xs tw-font-medium tw-uppercase tw-tracking-wider tw-text-iron-500">
        {m(locale, "network.tdh.how.edition.examples")}
      </p>
      <ul className="tw-m-0 tw-mt-3 tw-space-y-2 tw-pl-5 tw-text-sm tw-leading-6 tw-text-iron-400 marker:tw-text-iron-600">
        {EDITION_EXAMPLES.map((example) => (
          <li key={example.nameKey}>
            {m(locale, "network.tdh.how.edition.example", {
              editionSize: formatInteger(locale, example.editionSize),
              name: m(locale, example.nameKey),
              weight: formatNumber(locale, example.weight, {
                minimumFractionDigits: 3,
                maximumFractionDigits: 3,
              }),
            })}
          </li>
        ))}
      </ul>
    </div>
  );
}

function RelatedDestinations({ locale }: { readonly locale: SupportedLocale }) {
  return (
    <nav
      aria-label={m(locale, "network.tdh.related.destinationsAria")}
      className="tw-border-0 tw-border-t tw-border-solid tw-border-white/[0.06] tw-py-8 sm:tw-py-12"
    >
      <ul className="tw-m-0 tw-grid tw-list-none tw-grid-cols-1 tw-gap-4 tw-p-0 md:tw-grid-cols-2 md:tw-gap-6">
        {RELATED_DESTINATIONS.map((destination) => (
          <li key={destination.href}>
            <Link
              className={`${INTERACTIVE_PANEL_CLASS} tw-group tw-flex tw-h-full tw-flex-col tw-p-4 tw-no-underline hover:tw-no-underline focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-[#00f0ff]/50 sm:tw-p-6`}
              href={destination.href}
            >
              <span
                className={`tw-flex tw-size-10 tw-items-center tw-justify-center tw-rounded-full ${destination.iconWrapperClassName}`}
              >
                <FontAwesomeIcon
                  aria-hidden="true"
                  className={`tw-text-lg ${destination.iconClassName}`}
                  icon={destination.icon}
                />
              </span>
              <span className="tw-mt-5 tw-text-base tw-font-medium tw-leading-6 tw-text-iron-100 sm:tw-text-lg">
                {m(locale, destination.titleKey)}
              </span>
              <span className="tw-mt-2 tw-text-sm tw-leading-6 tw-text-iron-400">
                {m(locale, destination.descriptionKey)}
              </span>
              <span className="tw-mt-6 tw-w-fit tw-rounded-md tw-border tw-border-solid tw-border-white/[0.08] tw-bg-iron-900/60 tw-px-4 tw-py-2 tw-text-sm tw-font-medium tw-text-iron-200 tw-transition-colors group-hover:tw-border-white/[0.12] group-hover:tw-bg-iron-800 group-hover:tw-text-iron-50">
                {m(locale, destination.actionKey)}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

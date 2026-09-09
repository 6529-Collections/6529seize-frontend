"use client";

import { AboutContentsDropdown } from "@/components/about/AboutContentsDropdown";
import NetworkReferenceNavigation from "@/components/network/NetworkReferenceNavigation";
import {
  NETWORK_PAGE_TITLE_CLASSES,
  NETWORK_REFERENCE_DROPDOWN_ROW_CLASSES,
  NETWORK_REFERENCE_PAGE_CLASSES,
  NETWORK_REFERENCE_SECTION_HEADING_CLASSES,
} from "@/components/network/networkPageLayoutClasses";
import { useSetTitle } from "@/contexts/TitleContext";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import type { SupportedLocale } from "@/i18n/locales";
import { t, tRich, type MessageKey } from "@/i18n/messages";
import Link from "next/link";
import type { ReactNode } from "react";

type DefinitionsMessageKey = Extract<
  MessageKey,
  `network.definitions.${string}`
>;

interface GlossaryEntry {
  readonly id: string;
  readonly term: string;
  readonly description: ReactNode;
}

interface GlossarySection {
  readonly id: string;
  readonly title: string;
  readonly entries: readonly GlossaryEntry[];
}

const m = (
  locale: SupportedLocale,
  key: DefinitionsMessageKey,
  params: Parameters<typeof t>[2] = {}
) => t(locale, key, params);

export default function DefinitionsClient() {
  const locale = useBrowserLocale();
  const sections = getGlossarySections(locale);

  useSetTitle(m(locale, "network.definitions.metadata.title"));

  return (
    <main className={NETWORK_REFERENCE_PAGE_CLASSES}>
      <div className="tw-w-full">
        <AboutContentsDropdown
          className={NETWORK_REFERENCE_DROPDOWN_ROW_CLASSES}
          currentHref="/network/definitions"
          desktopFlush
          locale={locale}
          withDivider
        />

        <article className="tw-pb-12 tw-pt-4 max-sm:tw-px-1 sm:tw-pt-8">
          <header className="tw-pb-8 sm:tw-pb-10">
            <h1 className={NETWORK_PAGE_TITLE_CLASSES}>
              {m(locale, "network.definitions.hero.title")}
            </h1>
          </header>

          {sections.map((section) => (
            <GlossarySectionBlock key={section.id} section={section} />
          ))}

          <NetworkReferenceNavigation
            currentHref="/network/definitions"
            locale={locale}
          />
        </article>
      </div>
    </main>
  );
}

function getGlossarySections(
  locale: SupportedLocale
): readonly GlossarySection[] {
  const currentRulesLink = (
    <Link
      className="tw-rounded-sm tw-font-medium tw-text-primary-300 tw-underline tw-decoration-primary-400/40 tw-underline-offset-4 hover:tw-text-primary-300 hover:tw-decoration-primary-300 focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
      href="/network/tdh"
      key="current-tdh-rules"
    >
      {m(locale, "network.definitions.terms.tdh.currentRulesLink")}
    </Link>
  );

  return [
    {
      id: "holdings",
      title: m(locale, "network.definitions.sections.holdings"),
      entries: [
        createEntry(locale, "cards-collected", "cardsCollected"),
        createEntry(locale, "unique-memes", "uniqueMemes"),
        createEntry(locale, "meme-sets", "memeSets"),
        createEntry(locale, "meme-sets-minus", "memeSetsMinus"),
        createEntry(locale, "genesis-sets", "genesisSets"),
      ],
    },
    {
      id: "activity",
      title: m(locale, "network.definitions.sections.activity"),
      entries: [
        createEntry(locale, "purchases-sales", "purchasesSales"),
        createEntry(locale, "purchases-sales-eth", "purchasesSalesEth"),
        createEntry(locale, "transfers", "transfers"),
      ],
    },
    {
      id: "tdh",
      title: m(locale, "network.definitions.sections.tdh"),
      entries: [
        createEntry(locale, "tdh-unweighted", "tdhUnweighted"),
        createEntry(locale, "tdh-unboosted", "tdhUnboosted"),
        {
          id: "tdh",
          term: m(locale, "network.definitions.terms.tdh.term"),
          description: tRich(
            locale,
            "network.definitions.terms.tdh.description",
            { currentRulesLink }
          ),
        },
      ],
    },
  ];
}

function createEntry(
  locale: SupportedLocale,
  id: string,
  key:
    | "cardsCollected"
    | "uniqueMemes"
    | "memeSets"
    | "memeSetsMinus"
    | "genesisSets"
    | "purchasesSales"
    | "purchasesSalesEth"
    | "transfers"
    | "tdhUnweighted"
    | "tdhUnboosted"
): GlossaryEntry {
  return {
    id,
    term: m(locale, `network.definitions.terms.${key}.term`),
    description: m(locale, `network.definitions.terms.${key}.description`),
  };
}

function GlossarySectionBlock({
  section,
}: {
  readonly section: GlossarySection;
}) {
  const headingId = `definitions-${section.id}-heading`;

  return (
    <section
      aria-labelledby={headingId}
      className="tw-grid tw-grid-cols-1 tw-items-start tw-gap-6 tw-border-0 tw-border-t tw-border-solid tw-border-white/[0.06] tw-py-8 sm:tw-py-12 lg:tw-grid-cols-[minmax(0,1fr)_minmax(0,2.5fr)] lg:tw-gap-12"
    >
      <div className="lg:tw-sticky lg:tw-top-28">
        <h2
          className={NETWORK_REFERENCE_SECTION_HEADING_CLASSES}
          id={headingId}
        >
          {section.title}
        </h2>
      </div>

      <dl className="tw-m-0 tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-white/10">
        {section.entries.map((entry) => (
          <div
            className="tw-grid tw-grid-cols-1 tw-gap-2 tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-white/10 tw-py-5 sm:tw-grid-cols-[minmax(10rem,0.7fr)_minmax(0,1.3fr)] sm:tw-gap-6"
            key={entry.id}
          >
            <dt className="tw-text-sm tw-font-medium tw-leading-6 tw-text-iron-100">
              {entry.term}
            </dt>
            <dd className="tw-m-0 tw-text-sm tw-leading-6 tw-text-iron-400">
              {entry.description}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

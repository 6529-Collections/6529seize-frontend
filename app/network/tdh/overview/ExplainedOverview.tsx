import type { SupportedLocale } from "@/i18n/locales";
import type { FactBook } from "@/lib/explained/facts";
import { ot } from "./copy";
import HowWeKnowLadder from "./HowWeKnowLadder";
import InThisChapter from "./InThisChapter";
import LegacyAnchors from "./LegacyAnchors";
import type { MachineCard } from "./Machine";
import OverviewHero from "./OverviewHero";
import OverviewSources from "./OverviewSources";
import ThePicture from "./ThePicture";
import WhatItIsFor from "./WhatItIsFor";
import YourNumber from "./YourNumber";

/**
 * The overview's sections in reading order (TDH-DESIGN.md §4.1): the hero
 * with the machine, 01 the picture, 02 what it is for, 03 your number,
 * 04 how we know, 05 in this chapter, then the sources.
 */
export default function ExplainedOverview({
  book,
  locale,
  cards,
  network,
}: {
  readonly book: FactBook;
  readonly locale: SupportedLocale;
  readonly cards: readonly MachineCard[];
  /** Show the network's TDH by rank (the owner's flag). */
  readonly network: boolean;
}) {
  return (
    <article data-ex-article="" lang={locale}>
      <LegacyAnchors />
      <OverviewHero book={book} locale={locale} cards={cards} />
      <ThePicture book={book} locale={locale} network={network} />
      <WhatItIsFor book={book} locale={locale} />
      <YourNumber locale={locale} />
      <HowWeKnowLadder book={book} locale={locale} />
      <InThisChapter locale={locale} />
      <OverviewSources
        book={book}
        locale={locale}
        title={ot(locale, "title")}
        withNetwork={network}
      />
    </article>
  );
}

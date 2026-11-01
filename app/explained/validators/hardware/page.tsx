import type { Metadata } from "next";
import { kt } from "@/components/explained/i18n";
import { Contents } from "@/components/explained/reference/parts";
import ExplainedShell from "@/components/explained/shell/ExplainedShell";
import PrevNext from "@/components/explained/shell/PrevNext";
import { chapterById, HUB_HREF } from "@/components/explained/shell/chapters";
import { EX_LAYOUT, EX_TEXT } from "@/components/explained/tokens";
import { getAppMetadata } from "@/components/providers/metadata";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { loadFactBook } from "@/lib/explained/feed.server";
import {
  resolveExplainedLocale,
  type ExplainedParams,
} from "@/lib/explained/locale.server";
import {
  HARDWARE_PAGE_ID,
  HARDWARE_ROUTE,
  VALIDATORS_CHAPTER_ID,
  hw,
} from "./_lib/copy";
import { withPageFacts } from "./_lib/facts";
import {
  Datacenter,
  EveryValidator,
  HomeOffice,
  JumpRow,
  LargeHolders,
} from "./CardSections";
import Detail, { DETAIL_SECTIONS } from "./Detail";
import Hero from "./Hero";
import OpenOnHash from "./OpenOnHash";
import PartGuide from "./PartGuide";
import Sources from "./Sources";

/**
 * Validators · Hardware (`/explained/validators/hardware`): the first live
 * page of the Validators chapter, which is itself still coming. First the
 * owner's approved card, in its order and its words, with a chooser that
 * points each reader to one machine; home and office come first. Then each
 * part of the machine, from CPU and GPU to power, with what the validator
 * uses and what to get at each tier. Then the numbers behind it: each tier
 * in full, how each mode connects, instance types and prices at nine cloud
 * providers, your own Ethereum node, several machines under one account,
 * what one validator uses, and questions. Every number prints with its
 * source and the day it was read.
 */
export default async function ValidatorHardwarePage({
  searchParams,
}: {
  readonly searchParams: Promise<ExplainedParams>;
}) {
  const locale = await resolveExplainedLocale(await searchParams);
  const book = await loadFactBook();
  const chapter = chapterById(VALIDATORS_CHAPTER_ID);
  const title = kt(locale, "explained.kit.map.validators.hardware");
  const tdh = chapterById("tdh");
  return (
    <ExplainedShell
      chapter={VALIDATORS_CHAPTER_ID}
      page={HARDWARE_PAGE_ID}
      crumbs={[
        { label: kt(locale, "explained.kit.map.hub"), href: HUB_HREF },
        { label: kt(locale, chapter.title) },
        { label: title },
      ]}
      facts={withPageFacts(book.snapshot(), locale)}
      locale={locale}
    >
      <article data-ex-article="" lang={locale}>
        <Hero locale={locale} version={book.maybe("site.validator.version")} />
        <JumpRow locale={locale} />
        <OpenOnHash />
        <HomeOffice locale={locale} />
        <Datacenter locale={locale} />
        <LargeHolders locale={locale} />
        <EveryValidator locale={locale} />
        <PartGuide locale={locale} />

        <section
          aria-labelledby="detail-title"
          className={`${EX_LAYOUT.section} tw-scroll-mt-24`}
          id="detail"
        >
          <div className={EX_LAYOUT.stmt}>
            <div>
              <span className={`${EX_TEXT.label} tw-mb-3.5 tw-block`}>
                {hw(locale, "detail.label")}
              </span>
              <h2 id="detail-title" className={EX_TEXT.stmt}>
                {hw(locale, "detail.title")}
              </h2>
            </div>
            <div className="lg:tw-pt-[30px]">
              <Contents
                label={hw(locale, "detail.contents")}
                items={DETAIL_SECTIONS.map((section, index) => ({
                  href: `#${section.id}`,
                  no: String(index + 1).padStart(2, "0"),
                  title: hw(locale, section.label),
                }))}
              />
            </div>
          </div>
        </section>
        <Detail locale={locale} />

        <PrevNext
          locale={locale}
          prev={{ href: HUB_HREF, title: hw(locale, "pn.hub") }}
          next={{
            href: tdh.href ?? "/network/tdh",
            title: kt(locale, "explained.kit.map.chapterTitle", {
              number: tdh.number ?? "",
              title: kt(locale, tdh.title),
            }),
          }}
        />
        <Sources locale={locale} title={title} />
      </article>
    </ExplainedShell>
  );
}

export function generateMetadata(): Metadata {
  return getAppMetadata(
    {
      title: hw(DEFAULT_LOCALE, "meta.title"),
      description: hw(DEFAULT_LOCALE, "meta.description"),
    },
    { canonicalPath: HARDWARE_ROUTE }
  );
}

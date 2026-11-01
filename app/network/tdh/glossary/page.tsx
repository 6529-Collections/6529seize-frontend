import type { Metadata } from "next";
import type { ReactNode } from "react";
import { getAppMetadata } from "@/components/providers/metadata";
import { kt } from "@/components/explained/i18n";
import Mark from "@/components/explained/marks/Mark";
import Track from "@/components/explained/marks/Track";
import ExplainedShell from "@/components/explained/shell/ExplainedShell";
import HowWeKnow from "@/components/explained/shell/HowWeKnow";
import { EX_LAYOUT, EX_TEXT } from "@/components/explained/tokens";
import { DEFAULT_LOCALE, type SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { loadFactBook } from "@/lib/explained/feed.server";
import { PlaceLinks, pagePlace } from "@/components/explained/shell/place";
import GlossaryAnchors from "./GlossaryAnchors";
import { TERMS, type GlossaryKey, type Status } from "./terms";
import { PageHead, StackTable } from "@/components/explained/reference/parts";
import { plain, rich, type RichValues } from "@/components/explained/rich";
import { printers } from "@/components/explained/facts/printers";

/**
 * Shelf S5, the Glossary (TDH-DESIGN.md §4.7): every term the TDH chapter
 * uses, with one meaning, its status mark and its source. Each row's id is
 * the term of the overview's old `#glossary-<term>` anchor, and a term that
 * merged into another keeps its anchor inside that row.
 */
export const revalidate = 600;

/** The decision record changes with a decision, not on a schedule. */
const RECORD_CADENCE_MINUTES = 60 * 24 * 30;

function key(id: string, part: "term" | "def" | "src"): GlossaryKey {
  return `explained.tdh.glossary.${id}.${part}` as GlossaryKey;
}

function StatusCell({
  status,
  locale,
  comparisonRef,
}: {
  readonly status: Status;
  readonly locale: SupportedLocale;
  readonly comparisonRef?: string;
}): ReactNode {
  if ("word" in status) {
    return (
      <span className="tw-text-[13px] tw-font-semibold tw-text-iron-50">
        {t(locale, status.word)}
      </span>
    );
  }
  if ("track" in status) {
    return (
      <Track
        maturity="live"
        locale={locale}
        size="sm"
        {...(status.label ? { label: t(locale, status.label) } : {})}
      />
    );
  }
  const ref = status.ref ?? comparisonRef;
  const mark = (
    <Mark
      kind={status.mark}
      locale={locale}
      size="sm"
      {...(ref ? { refText: ref } : {})}
    />
  );
  // "since Oct 14": the date in the mark's reference is a fact.
  return comparisonRef ? <span data-fact="tdh.days.first">{mark}</span> : mark;
}

export default async function GlossaryPage() {
  const locale = DEFAULT_LOCALE;
  const book = await loadFactBook();
  const place = pagePlace("tdh", "glossary", locale);
  const p = printers(book, locale);
  const m = (k: GlossaryKey, values?: RichValues) => rich(locale, k, values);
  const s = (k: GlossaryKey) => plain(locale, k);
  const rows = TERMS.map((term) => ({
    key: term.id,
    id: term.id,
    cells: {
      term: (
        <>
          {term.also?.map((anchor) => (
            <span key={anchor} id={anchor} className="tw-scroll-mt-24" />
          ))}
          {m(key(term.id, "term"))}
        </>
      ),
      meaning: (
        <p className={`tw-m-0 tw-max-w-[640px] ${EX_TEXT.body}`}>
          {m(term.def?.(p) ?? key(term.id, "def"), term.values?.(p) ?? {})}
        </p>
      ),
      status: (
        <StatusCell
          status={term.status}
          locale={locale}
          {...(term.id === "comparison"
            ? {
                comparisonRef: plain(
                  locale,
                  "explained.tdh.glossary.comparison.ref",
                  { first: p.f("tdh.days.first") }
                ),
              }
            : {})}
        />
      ),
      source: (
        <span className="tw-text-[15px] tw-leading-[23px] tw-text-iron-400">
          {m(key(term.id, "src"))}
        </span>
      ),
    },
  }));
  return (
    <ExplainedShell
      chapter="tdh"
      page="glossary"
      crumbs={[
        { label: kt(locale, "explained.kit.map.hub"), href: "/explained" },
        {
          label: kt(locale, "explained.kit.map.chapterTitle", {
            number: place.chapterNumber,
            title: kt(locale, "explained.kit.map.tdh"),
          }),
          href: "/network/tdh",
        },
        { label: t(locale, "explained.tdh.glossary.crumb") },
      ]}
      live={{
        fact: book.maybe("rules.chainHeadDate"),
        kind: "file",
        cadenceMinutes: RECORD_CADENCE_MINUTES,
      }}
      facts={book.snapshot()}
      locale={locale}
    >
      <GlossaryAnchors />
      <article data-ex-article="" lang={locale}>
        <PageHead
          eyebrow={m("explained.tdh.glossary.eyebrow", {
            n: <span>{place.n}</span>,
          })}
          title={m("explained.tdh.glossary.title")}
          lede={m("explained.tdh.glossary.lede")}
        />
        <section className={EX_LAYOUT.sectionTight}>
          <StackTable
            from="lg"
            caption={s("explained.tdh.glossary.table")}
            columns={[
              {
                key: "term",
                label: s("explained.tdh.glossary.col.term"),
                phoneLabel: false,
              },
              {
                key: "meaning",
                label: s("explained.tdh.glossary.col.meaning"),
                phoneLabel: false,
              },
              { key: "status", label: s("explained.tdh.glossary.col.status") },
              { key: "source", label: s("explained.tdh.glossary.col.source") },
            ]}
            rows={rows}
          />
        </section>
        <PlaceLinks place={place} locale={locale} />
        <HowWeKnow
          locale={locale}
          title={t(locale, "explained.tdh.glossary.title")}
          slug="tdh-glossary"
          rows={[
            {
              title: s("explained.tdh.glossary.hwk.definitions"),
              body: m("explained.tdh.glossary.hwk.definitionsBody"),
            },
            {
              title: s("explained.tdh.glossary.hwk.decisions"),
              body: m("explained.tdh.glossary.hwk.decisionsBody", {
                newest: p.v("rules.newestDecision"),
                date: p.v("rules.chainHeadDate", "long"),
              }),
            },
            {
              title: s("explained.tdh.glossary.hwk.words"),
              body: m("explained.tdh.glossary.hwk.wordsBody"),
            },
          ]}
        />
      </article>
    </ExplainedShell>
  );
}

export function generateMetadata(): Metadata {
  return getAppMetadata(
    {
      title: t(DEFAULT_LOCALE, "explained.tdh.glossary.meta.title"),
      description: t(DEFAULT_LOCALE, "explained.tdh.glossary.meta.description"),
    },
    { canonicalPath: "/network/tdh/glossary" }
  );
}

import Link from "next/link";
import EnglishOnlyNote from "@/components/explained/shell/EnglishOnlyNote";
import {
  resolveExplainedLocale,
  type ExplainedParams,
} from "@/lib/explained/locale.server";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { getAppMetadata } from "@/components/providers/metadata";
import { kt } from "@/components/explained/i18n";
import Mark from "@/components/explained/marks/Mark";
import Track from "@/components/explained/marks/Track";
import ExplainedShell from "@/components/explained/shell/ExplainedShell";
import HowWeKnow from "@/components/explained/shell/HowWeKnow";
import { EX_LAYOUT, EX_LINK, EX_TEXT } from "@/components/explained/tokens";
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
    // A status in words, not a claim ("Convention"): a neutral dash in the
    // glyph's slot, since every glyph is a claim mark and the open ring
    // means Not yet. The same box as a mark's, so its word lines up.
    return (
      <span className="tw-inline-flex tw-items-center tw-gap-x-1.5 tw-whitespace-nowrap tw-text-[13px] tw-font-semibold tw-leading-5 tw-text-iron-300">
        <i
          className="tw-inline-block tw-h-0.5 tw-w-3 tw-rounded-sm tw-bg-iron-500"
          aria-hidden="true"
        />
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

/** The jump index: each group of terms by its first term, in table order. */
const JUMPS: readonly { readonly id: string; readonly label: GlossaryKey }[] = [
  { id: "tdh", label: "explained.tdh.glossary.group.what" },
  { id: "card", label: "explained.tdh.glossary.group.cards" },
  { id: "raw", label: "explained.tdh.glossary.group.days" },
  { id: "identity", label: "explained.tdh.glossary.group.wallets" },
  { id: "canonical", label: "explained.tdh.glossary.group.rules" },
  { id: "zk", label: "explained.tdh.glossary.group.proofs" },
  { id: "root", label: "explained.tdh.glossary.group.check" },
];

export default async function GlossaryPage({
  searchParams,
}: {
  readonly searchParams?: Promise<ExplainedParams>;
} = {}) {
  // The language the reader asked for: this page is English only for now.
  const requested = searchParams
    ? await resolveExplainedLocale(await searchParams)
    : DEFAULT_LOCALE;
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
          {/* A door into the model that shows the term moving. */}
          {term.model !== undefined && (
            <>
              {" "}
              <Link
                className={`${EX_LINK} tw-whitespace-nowrap`}
                href={term.model}
              >
                {s("explained.tdh.glossary.seeIt")}
              </Link>
            </>
          )}
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
        <span className="tw-text-sm tw-leading-[21px] tw-text-iron-400">
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
        kind: "record",
        lead: t(locale, "explained.tdh.glossary.liveLead"),
        cadenceMinutes: RECORD_CADENCE_MINUTES,
      }}
      facts={book.snapshot()}
      locale={locale}
    >
      <GlossaryAnchors />
      <article data-ex-article="" lang={locale}>
        <EnglishOnlyNote requested={requested} />
        <PageHead
          eyebrow={m("explained.tdh.glossary.eyebrow", {
            n: <span>{place.n}</span>,
          })}
          title={m("explained.tdh.glossary.title")}
          lede={m("explained.tdh.glossary.lede")}
        />
        {/* A jump index: the terms run in reading order, in these groups. */}
        <nav
          aria-label={s("explained.tdh.glossary.jump")}
          className="tw-mt-8 tw-flex tw-flex-wrap tw-items-baseline tw-gap-x-5 tw-gap-y-2 tw-text-[15px] tw-leading-6"
          data-glossary-jump=""
        >
          <span className={EX_TEXT.label}>
            {s("explained.tdh.glossary.jump")}
          </span>
          {JUMPS.map((jump) => (
            <a key={jump.id} className={EX_LINK} href={`#${jump.id}`}>
              {s(jump.label)}
            </a>
          ))}
        </nav>
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
              // On a phone, the status and the source read as one line
              // under the meaning, without their column names each time.
              {
                key: "status",
                label: s("explained.tdh.glossary.col.status"),
                phoneLabel: false,
              },
              {
                key: "source",
                label: s("explained.tdh.glossary.col.source"),
                phoneLabel: false,
              },
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

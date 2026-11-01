import EnglishOnlyNote from "@/components/explained/shell/EnglishOnlyNote";
import {
  resolveExplainedLocale,
  type ExplainedParams,
} from "@/lib/explained/locale.server";
import type { Metadata } from "next";
import { getAppMetadata } from "@/components/providers/metadata";
import ExplainedShell from "@/components/explained/shell/ExplainedShell";
import HowWeKnow from "@/components/explained/shell/HowWeKnow";
import { kt } from "@/components/explained/i18n";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { loadFactBook } from "@/lib/explained/feed.server";
import { PlaceLinks, pagePlace } from "@/components/explained/shell/place";
import LegacyAnchors from "@/components/explained/shell/LegacyAnchors";
import { FactText } from "@/components/explained/facts/FactText";
import BuildSection from "./BuildSection";
import ClaimsSection from "./ClaimsSection";
import EveryStatement from "./EveryStatement";
import OneClaim from "./OneClaim";
import SureHead from "./SureHead";
import { sureContext } from "./sureShared";
import TheoremsSection from "./TheoremsSection";
import TrustSection from "./TrustSection";
import TwoQuestions from "./TwoQuestions";
import YourselfSection from "./YourselfSection";

/**
 * 4 How sure (TDH-DESIGN.md §4.6): what is proved about the TDH rules, how
 * Lean checks it, what is tested every day and what is not, driven by the
 * Lean manifest the feed serves: the scoreboard, two questions, one claim
 * told to the end, the claims with their limits, each claim's main theorem
 * in words and in Lean, the build, what is still trusted, what a reader can
 * check today, and every statement. A manifest about older rules, or older
 * than the model the record names, is said to be so on the page.
 */
export const revalidate = 600;

/** The manifest is rewritten with a new build of the model, not daily. */
const MANIFEST_CADENCE_MINUTES = 60 * 24 * 30;

/** Anchors of the formal page before this one, and where they land. */
const MOVED: Readonly<Record<string, string>> = {
  "tdh-builds-heading": "check",
  netting: "featured",
  conservation: "claims",
  totals: "claims",
  order: "claims",
  cap: "claims",
  exclusions: "claims",
  rawLogs: "claims",
  identitySums: "claims",
  walletSum: "claims",
  firstRule: "claims",
  beyondStacks: "featured",
  balanceRaw: "limits",
};

export default async function HowSurePage({
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
  const ctx = sureContext(book, locale);
  const place = pagePlace("tdh", "sure", locale);
  const { m, p } = ctx;
  const sha = book.maybe<string>("manifest.sha256");
  const proofA = book.maybe("site.proofA.cycle");
  return (
    <ExplainedShell
      chapter="tdh"
      page="sure"
      crumbs={[
        { label: kt(locale, "explained.kit.map.hub"), href: "/explained" },
        {
          label: kt(locale, "explained.kit.map.chapterTitle", {
            number: place.chapterNumber,
            title: kt(locale, "explained.kit.map.tdh"),
          }),
          href: "/network/tdh",
        },
        { label: t(locale, "explained.tdh.sure.crumb") },
      ]}
      live={{
        fact: book.maybe("manifest.writtenAt"),
        kind: "record",
        cadenceMinutes: MANIFEST_CADENCE_MINUTES,
      }}
      facts={book.snapshot()}
      locale={locale}
    >
      <LegacyAnchors moved={MOVED} />
      <article data-ex-article="" lang={locale}>
        <EnglishOnlyNote requested={requested} />
        <SureHead ctx={ctx} chapter={place.chapterNumber} n={place.n} />
        <TwoQuestions ctx={ctx} />
        <OneClaim ctx={ctx} />
        <ClaimsSection ctx={ctx} />
        <TheoremsSection ctx={ctx} />
        <BuildSection ctx={ctx} />
        <TrustSection ctx={ctx} />
        <YourselfSection ctx={ctx} />
        <EveryStatement ctx={ctx} />
        <PlaceLinks place={place} locale={locale} />
        <HowWeKnow
          locale={locale}
          title={t(locale, "explained.tdh.sure.title")}
          slug="tdh-how-sure"
          rows={[
            {
              title: t(locale, "explained.tdh.sure.hwk.manifest"),
              body: m(
                sha
                  ? "explained.tdh.sure.hwk.manifestBody"
                  : "explained.tdh.sure.hwk.manifestBundled",
                {
                  written: p.v("manifest.writtenAt", "long"),
                  commit: p.v("manifest.commit"),
                  ...(sha ? { sha: p.v("manifest.sha256") } : {}),
                }
              ),
            },
            {
              title: t(locale, "explained.tdh.sure.hwk.netting"),
              body: m("explained.tdh.sure.hwk.nettingBody", {
                first: p.v("netting.first.commit"),
                narrowed: p.v("netting.narrowed.commit"),
                proved: p.v("netting.proved.commit"),
                day: p.v("netting.day", "long"),
              }),
            },
            {
              title: t(locale, "explained.tdh.sure.hwk.proofA"),
              body: m("explained.tdh.sure.hwk.proofABody", {
                record: (
                  <FactText fact={proofA} locale={locale}>
                    {proofA?.source.ref}
                  </FactText>
                ),
                hours: p.v("site.proofA.provedHours"),
                minutes: p.v("site.proofA.provedMinutes"),
                block: p.v("site.proofA.ethCallBlock"),
              }),
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
      title: t(DEFAULT_LOCALE, "explained.tdh.sure.meta.title"),
      description: t(DEFAULT_LOCALE, "explained.tdh.sure.meta.description"),
    },
    { canonicalPath: "/network/tdh/formal" }
  );
}

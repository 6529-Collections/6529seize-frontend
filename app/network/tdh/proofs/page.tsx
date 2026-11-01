import type { Metadata } from "next";
import ExplainedShell from "@/components/explained/shell/ExplainedShell";
import PrevNext from "@/components/explained/shell/PrevNext";
import { chapterById } from "@/components/explained/shell/chapters";
import { fill, kt } from "@/components/explained/i18n";
import { getAppMetadata } from "@/components/providers/metadata";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { loadFactBook } from "@/lib/explained/feed.server";
import {
  resolveExplainedLocale,
  type ExplainedParams,
} from "@/lib/explained/locale.server";
import { k, PROOFS_PAGE_ID, PROOFS_ROUTE } from "./_lib/copy";
import { pageFacts } from "./_lib/facts";
import { rich } from "@/components/explained/rich";
import ContractSection from "./ContractSection";
import Guarantees from "./Guarantees";
import HowMade from "./HowMade";
import ProofsHero from "./ProofsHero";
import ProofsSources from "./ProofsSources";
import RawBytes from "./RawBytes";
import Section, { Para } from "./Section";
import StatementWords from "./StatementWords";
import StillTrust from "./StillTrust";
import TwoPrograms from "./TwoPrograms";
import WhereItStands from "./WhereItStands";

/**
 * 5 Zero-knowledge proofs (`/network/tdh/proofs`): the zero-knowledge proofs
 * of a TDH day. What a T proof is and the words it binds; how one is made;
 * why two programs in two proof systems; the D128 contract that needs both;
 * what a proof guarantees and what it does not; where it stands; and what
 * is still trusted. Genre V (evidence), built on the 6529 Explained kit;
 * every number is a fact (`lib/explained/registry/proofFacts.ts`).
 */
export default async function ProofsPage({
  searchParams,
}: {
  readonly searchParams: Promise<ExplainedParams>;
}) {
  const locale = await resolveExplainedLocale(await searchParams);
  const book = await loadFactBook();
  const snapshot = book.snapshot();
  const facts = pageFacts(snapshot, locale);
  const chapter = chapterById("tdh");
  const here = chapter.check.find((page) => page.id === PROOFS_PAGE_ID);
  const sure = chapter.check.find((page) => page.id === "sure");
  const spec = chapter.shelf.find((page) => page.id === "spec");
  const title = kt(locale, "explained.kit.map.tdh.proofs");
  return (
    <ExplainedShell
      chapter="tdh"
      page={PROOFS_PAGE_ID}
      crumbs={[
        {
          label: kt(locale, "explained.kit.shell.explained"),
          href: "/explained",
        },
        {
          label: kt(locale, "explained.kit.map.chapterTitle", {
            number: chapter.number ?? "",
            title: kt(locale, chapter.title),
          }),
          href: chapter.href ?? "/network/tdh",
        },
        { label: title },
      ]}
      facts={snapshot}
      locale={locale}
    >
      <article data-ex-article="" lang={locale}>
        <ProofsHero
          locale={locale}
          facts={facts}
          chapterNumber={chapter.number ?? ""}
          pageNumber={here?.n ?? ""}
          pageTitle={title}
        />
        <Section
          id="statement"
          number="01"
          label={fill(locale, k("s1.label"))}
          heading={rich(locale, k("s1.heading"))}
          figure={
            <>
              <StatementWords locale={locale} />
              <RawBytes locale={locale} />
            </>
          }
        >
          <Para>
            {rich(locale, k("s1.p1"), {
              bytes: facts.print("proofs.day.inputBytes"),
              words: facts.print("proofs.statement.words"),
              total: facts.print("proofs.statement.bytes"),
            })}
          </Para>
          <Para>
            {rich(locale, k("s1.p2"), {
              proofBytes: facts.print("proofs.pair.proofBytesA"),
              gas: facts.print("proofs.gas.verifyA"),
            })}
          </Para>
        </Section>
        <HowMade locale={locale} facts={facts} />
        <TwoPrograms locale={locale} facts={facts} />
        <ContractSection locale={locale} facts={facts} />
        <Section
          id="guarantees"
          number="05"
          label={fill(locale, k("s6.label"))}
          heading={rich(locale, k("s6.heading"))}
          figure={<Guarantees locale={locale} />}
        >
          <Para>{rich(locale, k("s6.p1"))}</Para>
        </Section>
        <WhereItStands locale={locale} facts={facts} />
        <StillTrust locale={locale} facts={facts} />
        <PrevNext
          locale={locale}
          {...(sure
            ? {
                prev: {
                  href: sure.href,
                  title: kt(locale, sure.title),
                  ...(sure.n ? { n: sure.n } : {}),
                },
              }
            : {})}
          {...(spec
            ? {
                next: {
                  href: spec.href,
                  title: kt(locale, spec.title),
                  n: "S1",
                },
              }
            : {})}
        />
        <ProofsSources locale={locale} facts={facts} title={title} />
      </article>
    </ExplainedShell>
  );
}

export function generateMetadata(): Metadata {
  return getAppMetadata(
    {
      title: fill(DEFAULT_LOCALE, k("meta.title")),
      description: fill(DEFAULT_LOCALE, k("meta.description")),
    },
    { canonicalPath: PROOFS_ROUTE }
  );
}

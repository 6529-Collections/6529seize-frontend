import { AssumptionLedger } from "@/components/explained/evidence/claims";
import ProvenanceTrail from "@/components/explained/evidence/ProvenanceTrail";
import { fill } from "@/components/explained/i18n";
import { EX_TEXT } from "@/components/explained/tokens";
import type { SupportedLocale } from "@/i18n/locales";
import { fmt, isFact, type FactId } from "@/lib/explained/facts";
import { k } from "./_lib/copy";
import type { PageFacts } from "./_lib/facts";
import { rich } from "@/components/explained/rich";
import Section from "./Section";

/**
 * 07 · What you still trust (EXPLAINED.md §9, the assumption ledger): each
 * thing a proven day still rests on, its mark and what covers it; then who
 * can check a proof today, step by step.
 */
export default function StillTrust({
  locale,
  facts,
}: {
  readonly locale: SupportedLocale;
  readonly facts: PageFacts;
}) {
  const text = (id: FactId): string => {
    const entry = facts.entry(id);
    return entry && isFact(entry) ? fmt(entry, locale) : "";
  };
  return (
    <Section
      id="trust"
      number="07"
      label={fill(locale, k("s7.label"))}
      heading={rich(locale, k("s7.heading"))}
      figure={
        <div className="tw-grid tw-gap-14 md:tw-gap-20">
          <AssumptionLedger
            locale={locale}
            rows={[
              {
                assumption: fill(locale, k("trust.systems")),
                mark: "assumed",
                covers: rich(locale, k("trust.systemsCovers"), {
                  id: facts.print("proofs.sp1Advisory.id"),
                }),
              },
              {
                assumption: fill(locale, k("trust.curve")),
                mark: "assumed",
                covers: rich(locale, k("trust.curveCovers"), {
                  wrapper: facts.print("proofs.a.wrapper"),
                }),
              },
              {
                assumption: fill(locale, k("trust.setup")),
                mark: "assumed",
                covers: rich(locale, k("trust.setupCovers")),
              },
              {
                assumption: fill(locale, k("trust.programs")),
                mark: "notProved",
                covers: rich(locale, k("trust.programsCovers")),
              },
              {
                assumption: fill(locale, k("trust.identity")),
                mark: "tested",
                covers: rich(locale, k("trust.identityCovers")),
              },
              {
                assumption: fill(locale, k("trust.start")),
                mark: "assumed",
                covers: rich(locale, k("trust.startCovers"), {
                  block: facts.print("proofs.catchup.chainStart"),
                }),
              },
              {
                assumption: fill(locale, k("trust.hashes")),
                mark: "assumed",
                covers: rich(locale, k("trust.hashesCovers")),
              },
              {
                assumption: fill(locale, k("trust.routes")),
                mark: "assumed",
                covers: rich(locale, k("trust.routesCovers")),
              },
              {
                assumption: fill(locale, k("trust.contract")),
                mark: "tested",
                covers: rich(locale, k("trust.contractCovers"), {
                  unit: facts.print("proofs.contract.unitTests"),
                  fork: facts.print("proofs.contract.forkTests"),
                }),
              },
              {
                assumption: fill(locale, k("trust.rerun")),
                mark: "notYet",
                covers: rich(locale, k("trust.rerunCovers"), {
                  decision: "D116",
                }),
              },
            ]}
          />
          <div>
            <h3 className={`${EX_TEXT.h3} tw-mb-6`}>
              {rich(locale, k("trail.heading"))}
            </h3>
            <ProvenanceTrail
              locale={locale}
              steps={[
                {
                  title: fill(locale, k("trail.blocks")),
                  sub: fill(locale, k("trail.blocksSub")),
                  who: "node",
                },
                {
                  title: fill(locale, k("trail.runs")),
                  sub: fill(locale, k("trail.runsSub")),
                  who: "source",
                },
                {
                  title: fill(locale, k("trail.files")),
                  sub: fill(locale, k("trail.filesSub")),
                  who: "sixFive",
                },
                {
                  title: fill(locale, k("trail.verifier")),
                  sub: fill(locale, k("trail.verifierSub")),
                  who: "files",
                },
                {
                  title: fill(locale, k("trail.words")),
                  sub: fill(locale, k("trail.wordsSub"), {
                    words: text("proofs.statement.words"),
                  }),
                  who: "read",
                },
              ]}
            />
            <p className={`${EX_TEXT.cap} tw-m-0 tw-mt-6 tw-max-w-[760px]`}>
              {rich(locale, k("trail.cap"))}
            </p>
          </div>
        </div>
      }
    />
  );
}

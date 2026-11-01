import { IsIsNot } from "@/components/explained/evidence/notes";
import { fill } from "@/components/explained/i18n";
import type { SupportedLocale } from "@/i18n/locales";
import { k } from "./_lib/copy";
import type { PageFacts } from "./_lib/facts";
import { rich } from "@/components/explained/rich";
import RecordStrip from "./RecordStrip";
import Section from "./Section";

/**
 * 06 · Where it stands: what has happened and what has not, each item with
 * its own mark (EXPLAINED.md §3): Proved for the proofs that exist, Tested
 * for runs and tests, Not yet for what has not happened, Not guaranteed for
 * the history every proven day rests on.
 */
export default function WhereItStands({
  locale,
  facts,
}: {
  readonly locale: SupportedLocale;
  readonly facts: PageFacts;
}) {
  return (
    <Section
      id="status"
      number="06"
      label={fill(locale, k("s5.label"))}
      heading={rich(locale, k("s5.heading"))}
      figure={
        <div className="tw-grid tw-gap-10 md:tw-gap-12">
          <RecordStrip locale={locale} facts={facts} />
          <IsIsNot
            locale={locale}
            label={fill(locale, k("s5.label"))}
            is={[
              {
                mark: "proved",
                text: rich(locale, k("is.day"), {
                  date: facts.print("proofs.day.date"),
                  cycle: facts.print("site.proofA.cycle"),
                  hours: facts.print("site.proofA.provedHours"),
                  minutes: facts.print("site.proofA.provedMinutes"),
                  block: facts.print("site.proofA.ethCallBlock"),
                }),
              },
              {
                mark: "proved",
                text: rich(locale, k("is.pair"), {
                  cycle: facts.print("proofs.pairV14.cycle"),
                  real: facts.cycleDate("proofs.pairV14.cycle"),
                  words: facts.print("proofs.statement.words"),
                  date: facts.print("proofs.pairV14.provedOn"),
                  block: facts.print("proofs.pairV14.ethCallBlock"),
                  gas: facts.print("proofs.pairV14.submitGas"),
                }),
              },
              {
                mark: "tested",
                text: rich(locale, k("is.b"), {
                  date: facts.print("proofs.day.date"),
                }),
              },
              {
                mark: "tested",
                text: rich(locale, k("is.tests"), {
                  unit: facts.print("proofs.contract.unitTests"),
                  fork: facts.print("proofs.contract.forkTests"),
                  date: facts.print("proofs.contract.testedOn"),
                }),
              },
            ]}
            isNot={[
              {
                mark: "notYet",
                text: rich(locale, k("isNot.deploy"), { decision: "D128" }),
              },
              {
                mark: "notYet",
                text: rich(locale, k("isNot.b"), {
                  date: facts.print("proofs.day.date"),
                  low: facts.print("proofs.dayB.gpuHoursLow"),
                  high: facts.print("proofs.dayB.gpuHoursHigh"),
                  cost: facts.print("proofs.dayB.costUsd"),
                  hours: facts.print("site.proofA.provedHours"),
                  minutes: facts.print("site.proofA.provedMinutes"),
                  costA: facts.print("proofs.day.costUsd"),
                }),
              },
              {
                mark: "notGuaranteed",
                text: rich(locale, k("isNot.history"), {
                  million: facts.print("proofs.catchup.millionBlocks"),
                }),
              },
              {
                mark: "notYet",
                text: rich(locale, k("isNot.certificate"), {
                  version: facts.print("site.validator.version"),
                }),
              },
            ]}
          />
        </div>
      }
    />
  );
}

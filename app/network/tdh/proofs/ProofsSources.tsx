import HowWeKnow from "@/components/explained/shell/HowWeKnow";
import { fill } from "@/components/explained/i18n";
import type { SupportedLocale } from "@/i18n/locales";
import proofs from "@/lib/explained/data/proofs.json";
import { k, PROOFS_ROUTE } from "./_lib/copy";
import type { PageFacts } from "./_lib/facts";
import { rich } from "@/components/explained/rich";

/**
 * How we know (EXPLAINED.md §6.2): the records this page restates, each
 * with its commit and date. The validator's records are private until the
 * owner publishes its code (D116), so they are named, never linked.
 */
function commitOf(ref: string): string {
  return /commit ([0-9a-f]{7})/.exec(ref)?.[1] ?? "";
}

export default function ProofsSources({
  locale,
  facts,
  title,
}: {
  readonly locale: SupportedLocale;
  readonly facts: PageFacts;
  readonly title: string;
}) {
  const code = (value: string) => (
    <code className="tw-font-mono tw-text-[13px] tw-text-iron-300">
      {value}
    </code>
  );
  return (
    <>
      <HowWeKnow
        locale={locale}
        title={title}
        slug={PROOFS_ROUTE}
        rows={[
          {
            title: fill(locale, k("hwk.contract.title")),
            body: rich(locale, k("hwk.contract.body"), {
              commit: code(commitOf(proofs.sources.contracts.ref)),
              date: facts.print("proofs.contract.testedOn"),
            }),
          },
          {
            title: fill(locale, k("hwk.programA.title")),
            body: rich(locale, k("hwk.programA.body"), {
              commit: code(commitOf(proofs.sources.programA.ref)),
              commitV14: code(commitOf(proofs.sources.programAV14.ref)),
              date: facts.print("proofs.day.date"),
            }),
          },
          {
            title: fill(locale, k("hwk.programB.title")),
            body: rich(locale, k("hwk.programB.body"), {
              commit: code(commitOf(proofs.sources.programB.ref)),
              commitV14: code(commitOf(proofs.sources.programBV14.ref)),
            }),
          },
          {
            title: fill(locale, k("hwk.design.title")),
            body: rich(locale, k("hwk.design.body")),
          },
          {
            title: fill(locale, k("hwk.runs.title")),
            body: rich(locale, k("hwk.runs.body"), {
              date: facts.print("proofs.day.provedOn"),
            }),
          },
          {
            title: fill(locale, k("hwk.privateTitle")),
            body: rich(locale, k("hwk.private")),
          },
        ]}
      />
    </>
  );
}

import HowWeKnow from "@/components/explained/shell/HowWeKnow";
import { EX_LINK } from "@/components/explained/tokens";
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
  // SP1's advisories are public: each links to where it was published.
  const advisory = (
    id: "proofs.sp1Advisory.earlier" | "proofs.sp1Advisory.id",
    name: string
  ) => {
    const url = facts.entry(id)?.source.url;
    return url ? (
      <a
        className={EX_LINK}
        href={url}
        target="_blank"
        rel="noopener noreferrer"
      >
        <code className="tw-font-mono tw-text-[13px]">{name}</code>
      </a>
    ) : (
      code(name)
    );
  };
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
            title: fill(locale, k("hwk.sp1.title")),
            body: rich(locale, k("hwk.sp1.body"), {
              earlier: facts.print("proofs.sp1Advisory.earlier", "long"),
              earlierLink: advisory(
                "proofs.sp1Advisory.earlier",
                "GHSA-c873-wfhp-wx5m"
              ),
              id: facts.print("proofs.sp1Advisory.id"),
              idLink: advisory("proofs.sp1Advisory.id", "GHSA-63x8-x938-vx33"),
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

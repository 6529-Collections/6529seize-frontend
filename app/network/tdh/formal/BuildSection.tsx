import type { ReactNode } from "react";
import Mark, { type MarkKind } from "@/components/explained/marks/Mark";
import { formatList } from "@/i18n/format";
import {
  CodeName,
  EdSection,
  Prose,
} from "@/components/explained/reference/parts";
import { FactScope } from "@/components/explained/facts/FactText";
import type { SureContext } from "./sureShared";

/**
 * §05 How Lean checks it: what one build of the model establishes, read
 * from the manifest's own record of that build. The kernel checks every
 * proof, the audit allows only Lean's standard axioms, counterexamples are
 * checked in the kernel or by evaluation, and the model runs P26's vectors.
 * Each row says which of these trusts Lean's compiler.
 */
interface Row {
  readonly id: string;
  readonly what: string;
  readonly body: ReactNode;
  readonly mark: MarkKind;
  readonly refText: string;
}

export default function BuildSection({ ctx }: { readonly ctx: SureContext }) {
  const { m, s, p, book, locale } = ctx;
  const axioms = book.maybe<string[]>("manifest.audit.axioms")?.value ?? [];
  const code = (text: string) => <CodeName>{text}</CodeName>;
  const rows: Row[] = [
    {
      id: "kernel",
      what: s("explained.tdh.sure.build.kernel"),
      body: m("explained.tdh.sure.build.kernelBody", {
        command: code("lake build"),
        version: p.v("manifest.lean"),
        jobs: p.v("manifest.build.jobs"),
      }),
      mark: "proved",
      refText: s("explained.tdh.sure.build.kernelRef"),
    },
    {
      id: "audit",
      what: s("explained.tdh.sure.build.audit"),
      body: m(
        book.maybe("manifest.audit.wholeTheorems") &&
          book.maybe("manifest.audit.wholeDefinitions")
          ? "explained.tdh.sure.build.auditWholeBody"
          : "explained.tdh.sure.build.auditBody",
        {
          theorems: p.v("manifest.audit.wholeTheorems"),
          definitions: p.v("manifest.audit.wholeDefinitions"),
          count: p.v("manifest.audit.theorems"),
          axioms: (
            <span data-fact="manifest.audit.axioms">
              {formatList(locale, axioms)}
            </span>
          ),
          sorry: code("sorry"),
          native: code("native_decide"),
        }
      ),
      mark: "tested",
      refText: s("explained.tdh.sure.build.auditRef"),
    },
    {
      id: "false",
      what: s("explained.tdh.sure.build.false"),
      body: m("explained.tdh.sure.build.falseBody", {
        kernel: p.v("manifest.shownFalse.kernel"),
        decide: code("decide"),
        evaluation: p.v("manifest.shownFalse.evaluation"),
        guard: code("#guard"),
        facts: p.v("manifest.facts.checks"),
      }),
      mark: "shownFalse",
      refText: s("explained.tdh.sure.build.falseRef"),
    },
    {
      id: "vectors",
      what: s("explained.tdh.sure.build.vectors"),
      body: m("explained.tdh.sure.build.vectorsBody", {
        passed: p.v("manifest.vectors.passed"),
        total: p.v("manifest.vectors.total"),
        checks: p.v("manifest.vectors.checks"),
        reasons: p.v("manifest.vectors.reasons.passed"),
        nettingPassed: p.v("manifest.vectors.netting.passed"),
        nettingTotal: p.v("manifest.vectors.netting.total"),
      }),
      mark: "tested",
      refText: s("explained.tdh.sure.build.vectorsRef"),
    },
    {
      id: "ci",
      what: s("explained.tdh.sure.build.ci"),
      body: m("explained.tdh.sure.build.ciBody"),
      mark: "tested",
      refText: s("explained.tdh.sure.build.ciRef"),
    },
  ];
  return (
    <EdSection
      id="how"
      tight={false}
      no="05"
      label={m("explained.tdh.sure.build.label")}
      title={m("explained.tdh.sure.build.title")}
    >
      <Prose>
        {m("explained.tdh.sure.build.body", {
          written: p.v("manifest.writtenAt"),
        })}
      </Prose>
      <FactScope
        className="tw-mt-6"
        ids={[
          "manifest.lean",
          "manifest.build.jobs",
          "manifest.audit.theorems",
          "manifest.audit.wholeTheorems",
          "manifest.audit.wholeDefinitions",
          "manifest.facts.checks",
        ]}
      >
        <ol
          className="tw-m-0 tw-list-none tw-border-0 tw-border-t tw-border-solid tw-border-iron-700 tw-p-0"
          aria-label={s("explained.tdh.sure.build.list")}
        >
          {rows.map((row) => (
            <li
              key={row.id}
              className="tw-grid tw-grid-cols-1 tw-gap-x-6 tw-gap-y-2 tw-border-0 tw-border-b tw-border-solid tw-border-iron-900 tw-py-4 md:tw-grid-cols-[minmax(0,1fr)_200px]"
            >
              <div className="tw-min-w-0">
                <span className="tw-block tw-text-[17px] tw-font-semibold tw-leading-[25px] tw-text-iron-50">
                  {row.what}
                </span>
                <p className="tw-m-0 tw-mt-1.5 tw-max-w-[620px] tw-text-base tw-leading-[25px] tw-text-iron-300">
                  {row.body}
                </p>
              </div>
              <span className="md:tw-pt-0.5">
                <Mark
                  kind={row.mark}
                  locale={locale}
                  size="sm"
                  refText={row.refText}
                />
              </span>
            </li>
          ))}
        </ol>
      </FactScope>
    </EdSection>
  );
}

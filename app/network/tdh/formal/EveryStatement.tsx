import Mark, { type MarkKind } from "@/components/explained/marks/Mark";
import { EX_FOCUS } from "@/components/explained/tokens";
import type { StatementRow } from "@/lib/explained/registry/formalFacts";
import { CodeName, EdSection, Prose, StackTable } from "../_reference/parts";
import type { SureContext, SureSection } from "./sureShared";

/**
 * §05 Every statement (TDH-DESIGN.md §4.6): every manifest entry, in eight
 * or nine closed groups (one per section), each row with its Lean name, its
 * result, what checked it and where it is. Generated from the manifest.
 */
const RESULT: Record<string, MarkKind> = {
  proved: "proved",
  counterexample: "shownFalse",
  deferred: "notGuaranteed",
};

/** The name a reader looks up: the Lean name without its library prefix. */
function shortName(entry: StatementRow): string {
  return entry.name
    ? entry.name.replace(/^Tdh\.Proofs\.|^P53\.Proofs\./, "")
    : entry.id.split(".").slice(1).join(".");
}

function checkedBy(ctx: SureContext, entry: StatementRow): string {
  if (entry.status === "proved") {
    return entry.axioms && entry.axioms.length > 0
      ? entry.axioms
      : ctx.s("explained.tdh.sure.check.noAxioms");
  }
  if (entry.status === "counterexample") {
    return entry.checkedBy === "kernel"
      ? ctx.s("explained.tdh.sure.check.kernel")
      : ctx.s("explained.tdh.sure.check.evaluation");
  }
  return ctx.s("explained.tdh.sure.check.limit");
}

function Group({
  ctx,
  section,
}: {
  readonly ctx: SureContext;
  readonly section: SureSection;
}) {
  const { m, s, locale } = ctx;
  const title =
    section.title ?? s("explained.tdh.sure.check.untitled", { id: section.id });
  const count = (status: string) =>
    section.entries.filter((entry) => entry.status === status).length;
  return (
    <details
      className="tw-group tw-border-0 tw-border-t tw-border-solid tw-border-iron-900"
      data-fact={section.fact.id}
    >
      <summary
        className={`tw-flex tw-min-h-11 tw-cursor-pointer tw-list-none tw-flex-wrap tw-items-center tw-justify-between tw-gap-x-4 tw-gap-y-1 tw-py-3.5 tw-text-base tw-font-semibold tw-leading-6 tw-text-iron-50 marker:tw-hidden [&::-webkit-details-marker]:tw-hidden ${EX_FOCUS}`}
      >
        <span>{title}</span>
        <span className="tw-ml-auto tw-flex tw-items-center tw-gap-4 tw-text-sm tw-font-medium tw-text-iron-400">
          <span>
            {m("explained.tdh.sure.check.counts", {
              proved: count("proved"),
              false: count("counterexample"),
              limits: count("deferred"),
            })}
          </span>
          <span
            aria-hidden="true"
            className="tw-w-3 tw-text-center tw-text-iron-400 group-open:tw-hidden"
          >
            +
          </span>
          <span
            aria-hidden="true"
            className="tw-hidden tw-w-3 tw-text-center tw-text-iron-400 group-open:tw-inline"
          >
            –
          </span>
        </span>
      </summary>
      {/* Closed, the entries take no space: nothing to read or to measure. */}
      <div className="tw-hidden tw-pb-4 group-open:tw-block">
        <StackTable
          size="small"
          from="lg"
          caption={s("explained.tdh.sure.check.caption", { title })}
          columns={[
            { key: "name", label: s("explained.tdh.sure.check.col.name") },
            { key: "result", label: s("explained.tdh.sure.check.col.result") },
            { key: "by", label: s("explained.tdh.sure.check.col.by") },
            { key: "where", label: s("explained.tdh.sure.check.col.where") },
          ]}
          rows={section.entries.map((entry) => ({
            key: entry.id,
            cells: {
              name: <CodeName wrap>{shortName(entry)}</CodeName>,
              result: (
                <Mark
                  kind={RESULT[entry.status] ?? "notGuaranteed"}
                  locale={locale}
                  size="sm"
                  {...(entry.status === "deferred"
                    ? { label: s("explained.tdh.sure.check.notCovered") }
                    : {})}
                />
              ),
              by: (
                <span className="tw-text-iron-400">
                  {checkedBy(ctx, entry)}
                </span>
              ),
              where: (
                <span className="tw-text-iron-400">
                  {entry.file
                    ? `${entry.file.split("/").pop() ?? entry.file}:${entry.line ?? ""}`
                    : "–"}
                </span>
              ),
            },
          }))}
        />
      </div>
    </details>
  );
}

export default function EveryStatement({ ctx }: { readonly ctx: SureContext }) {
  const { m, p } = ctx;
  return (
    <EdSection
      id="check"
      tight={false}
      no="05"
      label={m("explained.tdh.sure.check.label")}
      title={m("explained.tdh.sure.check.title", {
        count: p.v("manifest.entries"),
      })}
    >
      <Prose className="tw-text-[15px] tw-leading-6">
        {m("explained.tdh.sure.check.body")}
      </Prose>
      <div
        id="contains"
        className="tw-mt-6 tw-scroll-mt-24 tw-border-0 tw-border-b tw-border-solid tw-border-iron-900"
      >
        {ctx.sections.map((section) => (
          <Group key={section.id} ctx={ctx} section={section} />
        ))}
      </div>
    </EdSection>
  );
}

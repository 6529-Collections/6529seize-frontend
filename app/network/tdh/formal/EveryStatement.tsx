import { kt } from "@/components/explained/i18n";
import Mark, { type MarkKind } from "@/components/explained/marks/Mark";
import { EX_FOCUS } from "@/components/explained/tokens";
import type { StatementRow } from "@/lib/explained/registry/formalFacts";
import {
  CodeBlock,
  CodeName,
  EdSection,
  Prose,
} from "@/components/explained/reference/parts";
import type { SureContext, SureSection } from "./sureShared";

/**
 * §08 Every statement (TDH-DESIGN.md §4.6): every manifest entry, in closed
 * groups (one per section), each with its result, its Lean name, where it
 * is and what checked it, the manifest's sentence for it in plain words,
 * and, for a theorem, its statement in Lean behind one more disclosure.
 * Generated from the manifest.
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

/**
 * The first netting rule's five counterexamples: the kernel checks their
 * pairs; the TDH totals in their words come from running the model at
 * `9cd101a` (PROOFS.md, "The first rule").
 */
const FIRST_RULE = /^1\.firstRule_/;
const FIRST_RULE_TOTALS_AT = "9cd101a";

function checkedBy(ctx: SureContext, entry: StatementRow): string {
  if (entry.status === "counterexample" && FIRST_RULE.test(entry.id)) {
    return ctx.s("explained.tdh.sure.check.kernelPairs", {
      commit: FIRST_RULE_TOTALS_AT,
    });
  }
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

/** One entry: its result, its name, where it is, its words, and its Lean. */
function Entry({
  ctx,
  entry,
  factId,
}: {
  readonly ctx: SureContext;
  readonly entry: StatementRow;
  readonly factId: string;
}) {
  const { s, locale } = ctx;
  const file = entry.file ? (entry.file.split("/").pop() ?? entry.file) : null;
  let where = "–";
  if (file !== null) {
    where =
      entry.line === null || entry.line === undefined
        ? file
        : `${file}:${entry.line}`;
  }
  return (
    <li
      className="tw-border-0 tw-border-t tw-border-solid tw-border-iron-900 tw-py-3.5 first:tw-border-t-0"
      data-entry={entry.id}
    >
      <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-x-3 tw-gap-y-1.5">
        <Mark
          kind={RESULT[entry.status] ?? "notGuaranteed"}
          locale={locale}
          size="sm"
          {...(entry.status === "deferred"
            ? { label: s("explained.tdh.sure.check.notCovered") }
            : {})}
        />
        <CodeName wrap>{shortName(entry)}</CodeName>
      </div>
      {/* Where it is, then what checked it: one line from sm, two below. */}
      <span
        className="tw-mt-1 tw-block tw-text-sm tw-leading-5 tw-text-iron-400"
        data-fact={factId}
      >
        <span className="tw-block sm:tw-inline">{where}</span>
        <span className="tw-hidden sm:tw-inline" aria-hidden="true">
          {" · "}
        </span>
        <span className="tw-block sm:tw-inline">{checkedBy(ctx, entry)}</span>
      </span>
      {entry.statement && (
        <p
          className="tw-m-0 tw-mt-2 tw-max-w-[560px] tw-text-[15px] tw-leading-6 tw-text-iron-300 [overflow-wrap:anywhere]"
          data-fact={factId}
        >
          {entry.statement}
        </p>
      )}
      {entry.lean && (
        <details className="tw-group/lean tw-mt-2">
          <summary
            className={`tw-inline-flex tw-min-h-8 tw-cursor-pointer tw-list-none tw-items-center tw-gap-2 tw-text-sm tw-font-semibold tw-text-primary-300 marker:tw-hidden [&::-webkit-details-marker]:tw-hidden ${EX_FOCUS}`}
          >
            <span aria-hidden="true" className="group-open/lean:tw-hidden">
              +
            </span>
            <span
              aria-hidden="true"
              className="tw-hidden group-open/lean:tw-inline"
            >
              –
            </span>
            {s("explained.tdh.sure.check.inLean")}
          </summary>
          <CodeBlock
            className="tw-mt-2"
            code={entry.lean}
            comment="--"
            label={s("explained.tdh.sure.theorems.codeLabel", {
              name: entry.name ?? entry.id,
            })}
          />
        </details>
      )}
    </li>
  );
}

/** "16 proved · 7 shown false · 2 limits", with a count of none left out. */
function counts(ctx: SureContext, count: (status: string) => number): string {
  const parts: string[] = [];
  const add = (n: number, key: Parameters<typeof kt>[1]) => {
    if (n > 0) parts.push(kt(ctx.locale, key, { count: String(n) }));
  };
  add(count("proved"), "explained.kit.claimTable.proved");
  add(count("counterexample"), "explained.kit.claimTable.shownFalse");
  const limits = count("deferred");
  add(
    limits,
    limits === 1
      ? "explained.kit.claimTable.oneLimit"
      : "explained.kit.claimTable.limits"
  );
  return parts.join(" · ");
}

function Group({
  ctx,
  section,
}: {
  readonly ctx: SureContext;
  readonly section: SureSection;
}) {
  const { s } = ctx;
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
          <span>{counts(ctx, count)}</span>
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
      <ol
        className="tw-m-0 tw-hidden tw-list-none tw-p-0 tw-pb-4 group-open:tw-block"
        aria-label={s("explained.tdh.sure.check.caption", { title })}
      >
        {section.entries.map((entry) => (
          <Entry
            key={entry.id}
            ctx={ctx}
            entry={entry}
            factId={section.fact.id}
          />
        ))}
      </ol>
    </details>
  );
}

export default function EveryStatement({ ctx }: { readonly ctx: SureContext }) {
  const { m, p } = ctx;
  return (
    <EdSection
      id="check"
      tight={false}
      no="08"
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

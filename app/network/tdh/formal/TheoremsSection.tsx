import { Fragment, type ReactNode } from "react";
import Mark from "@/components/explained/marks/Mark";
import { EX_TEXT } from "@/components/explained/tokens";
import { formatList } from "@/i18n/format";
import type { StatementRow } from "@/lib/explained/registry/formalFacts";
import {
  CodeBlock,
  CodeName,
  EdSection,
  Prose,
} from "@/components/explained/reference/parts";
import { FactScope } from "@/components/explained/facts/FactText";
import { isMessageKey } from "@/components/explained/rich";
import TheoremPicker, { type TheoremPanel } from "./TheoremPicker";
import type { SureContext, SureKey, SureSection } from "./sureShared";

/**
 * §04 In words and in Lean: each claim's main theorem, one at a time, its
 * meaning in plain words beside the statement Lean's kernel checked (copied
 * from the model at the manifest's commit, the proof left out), with a key
 * to reading it, its file and line, its axioms and what it does not cover.
 */

/**
 * The theorem that carries each claim, chosen by reading PROOFS.md: the
 * strongest statement about a whole cycle where there is one. A claim not
 * listed, or whose theorem the manifest no longer names, shows its first
 * proved entry instead.
 */
const MAIN_THEOREM: Readonly<Record<string, string>> = {
  "1": "1.replayHoldings_invariance",
  "2": "2.replay_ok",
  "3": "3.computeCycle_identity_sums",
  "4": "4.computeCycle_perm",
  "5a": "5a.cap_bound",
  "5b": "5b.steps_keep_exclusions",
  "6": "6.computeCycleFromSource_decoded",
  "7": "7.computeCycle_clusters",
  stack: "stack.takeLast_some",
};

/** A label in the theorem's facts list. */
const TERM = "tw-font-semibold tw-text-iron-400";
/** A note under the Lean, at most about 75 characters a line. */
const NOTE =
  "tw-m-0 tw-mt-3 tw-max-w-[560px] tw-text-[15px] tw-leading-6 tw-text-iron-300";
/** The validator cap a claim's words print (P53 §6.3). */
const CAP = "validators.cap";

function key(id: string, part: string): SureKey | null {
  const name = `explained.tdh.sure.${part.replace("{id}", id)}`;
  return isMessageKey(name) ? (name as SureKey) : null;
}

/** A long name or path, with a line break allowed after each separator. */
function breakAfter(text: string, separator: string): ReactNode {
  const parts = text.split(separator);
  return parts.map((part, index) => (
    // The parts of one name are fixed in order.
    <Fragment key={index}>
      {part}
      {index < parts.length - 1 && (
        <>
          {separator}
          <wbr />
        </>
      )}
    </Fragment>
  ));
}

function mainTheorem(section: SureSection): StatementRow | null {
  const proved = section.entries.filter((entry) => entry.status === "proved");
  const chosen = MAIN_THEOREM[section.id];
  return (
    proved.find((entry) => entry.id === chosen) ??
    proved.find((entry) => entry.lean !== null) ??
    proved[0] ??
    null
  );
}

function Panel({
  ctx,
  section,
  entry,
}: {
  readonly ctx: SureContext;
  readonly section: SureSection;
  readonly entry: StatementRow;
}) {
  const { m, s, p, locale } = ctx;
  const words = key(entry.id, "theorem.{id}.words");
  const read = key(entry.id, "theorem.{id}.read");
  const what = key(section.id, "claim.{id}.what");
  const limit = key(section.id, "claim.{id}.limit");
  const values = {
    six: <CodeName>h6</CodeName>,
    cap: p.v(CAP),
    ungated: p.v("rules.ungatedMaxWallets"),
    wallet: p.v("cases.F.wallet"),
    identity: p.v("cases.F.identity"),
  };
  const where = entry.file
    ? breakAfter(`${entry.file}:${entry.line ?? ""}`, "/")
    : "–";
  return (
    <div className="tw-grid tw-grid-cols-1 tw-gap-6 lg:tw-grid-cols-[minmax(0,4fr)_minmax(0,8fr)] lg:tw-gap-10">
      <div className="tw-min-w-0">
        <span className={`${EX_TEXT.label} tw-block`}>
          {m("explained.tdh.sure.theorems.claim", {
            what: what
              ? s(what, { cap: p.f(CAP) })
              : (section.title ?? section.id),
          })}
        </span>
        <p
          className="tw-m-0 tw-mt-3 tw-text-[17px] tw-leading-[28px] tw-text-iron-50"
          data-fact={section.fact.id}
        >
          {words ? m(words, values) : entry.statement}
        </p>
        <dl className="tw-m-0 tw-mt-5 tw-grid tw-grid-cols-1 tw-gap-x-3 tw-text-sm tw-leading-[21px] sm:tw-grid-cols-[96px_minmax(0,1fr)] sm:tw-gap-y-2 [&>dd]:tw-mb-2 sm:[&>dd]:tw-mb-0">
          <dt className={TERM}>{s("explained.tdh.sure.theorems.rules")}</dt>
          <dd className="tw-m-0 tw-text-iron-300" data-fact={section.fact.id}>
            {section.refs.length > 0 ? formatList(locale, section.refs) : "–"}
          </dd>
          <dt className={TERM}>{s("explained.tdh.sure.theorems.name")}</dt>
          <dd className="tw-m-0 tw-min-w-0">
            <CodeName wrap>{breakAfter(entry.name ?? entry.id, ".")}</CodeName>
          </dd>
          <dt className={TERM}>{s("explained.tdh.sure.theorems.where")}</dt>
          <dd
            className="tw-m-0 tw-min-w-0 tw-text-iron-300 [overflow-wrap:anywhere]"
            data-fact={section.fact.id}
          >
            {m("explained.tdh.sure.theorems.whereValue", {
              where,
              commit: <CodeName>{p.v("manifest.commit")}</CodeName>,
            })}
          </dd>
          <dt className={TERM}>{s("explained.tdh.sure.theorems.axioms")}</dt>
          <dd className="tw-m-0 tw-text-iron-300">
            {entry.axioms && entry.axioms.length > 0
              ? entry.axioms
              : s("explained.tdh.sure.check.noAxioms")}
          </dd>
        </dl>
        <div className="tw-mt-4">
          <Mark
            kind="proved"
            locale={locale}
            size="sm"
            refText={s("explained.tdh.sure.part.proved.ref")}
          />
        </div>
      </div>
      <div className="tw-min-w-0">
        <span className={`${EX_TEXT.label} tw-block`}>
          {s("explained.tdh.sure.theorems.inLean")}
        </span>
        {entry.lean ? (
          <>
            <CodeBlock
              className="tw-mt-3"
              code={entry.lean}
              comment="--"
              label={s("explained.tdh.sure.theorems.codeLabel", {
                name: entry.name ?? entry.id,
              })}
            />
            {read && (
              <p className={NOTE} data-fact={section.fact.id}>
                {m(read, values)}
              </p>
            )}
          </>
        ) : (
          <p className={NOTE}>{m("explained.tdh.sure.theorems.noLean")}</p>
        )}
        {limit && (
          <p className={NOTE} data-fact={section.fact.id}>
            <b className="tw-font-semibold tw-text-iron-50">
              {s("explained.tdh.sure.theorems.notCovered")}
            </b>{" "}
            {m(limit, values)}
          </p>
        )}
      </div>
    </div>
  );
}

export default function TheoremsSection({
  ctx,
}: {
  readonly ctx: SureContext;
}) {
  const { m, s, p } = ctx;
  const panels: TheoremPanel[] = ctx.sections.flatMap((section) => {
    const entry = mainTheorem(section);
    if (!entry) {
      return [];
    }
    const short = key(section.id, "claim.{id}.short");
    return [
      {
        value: section.id,
        label: short
          ? s(short, { cap: p.f(CAP) })
          : (section.title ?? section.id),
        panel: <Panel ctx={ctx} section={section} entry={entry} />,
      },
    ];
  });
  if (panels.length === 0) {
    return null;
  }
  return (
    <EdSection
      id="theorems"
      tight={false}
      no="04"
      label={m("explained.tdh.sure.theorems.label")}
      title={m("explained.tdh.sure.theorems.title")}
      full={
        <FactScope className="tw-mt-8" ids={[CAP]}>
          <TheoremPicker
            label={s("explained.tdh.sure.theorems.pick")}
            panels={panels}
          />
        </FactScope>
      }
    >
      <Prose>
        {m("explained.tdh.sure.theorems.body", {
          commit: <CodeName>{p.v("manifest.commit")}</CodeName>,
        })}
      </Prose>
    </EdSection>
  );
}

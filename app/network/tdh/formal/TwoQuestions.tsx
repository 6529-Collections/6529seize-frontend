import { CodeName, EdSection } from "@/components/explained/reference/parts";
import AssuranceLadder, {
  type Rung,
} from "@/components/explained/evidence/AssuranceLadder";
import { EX_LAYOUT, EX_LINK } from "@/components/explained/tokens";
import { FactScope } from "@/components/explained/facts/FactText";
import ProvedWhere from "./ProvedWhere";
import type { SureContext } from "./sureShared";

/** Zero-knowledge proofs: the chapter's page on the zero-knowledge proofs. */
const PROOFS_HREF = "/network/tdh/proofs";

/**
 * §01 Two questions (TDH-DESIGN.md §4.6): is the rule what it claims, and
 * did the day follow it. Two ladders, each with the line where today's
 * evidence stops.
 */
export default function TwoQuestions({ ctx }: { readonly ctx: SureContext }) {
  const { m, s, p, book } = ctx;
  const passed = book.maybe<number>("manifest.vectors.total")?.value;
  const p26 = book.maybe<number>("rules.vectors")?.value;
  // "89 here; P26 now has 104" only while the manifest runs fewer vectors
  // than P26 has: a manifest built from a newer P26 than the record's is
  // not behind it.
  const behind = passed !== undefined && p26 !== undefined && passed < p26;
  const rule: Rung[] = [
    {
      what: s("explained.tdh.sure.rule.written"),
      detail: m("explained.tdh.sure.rule.writtenDetail"),
      marks: [
        { kind: "proposed", refText: s("explained.tdh.sure.rule.proposedRef") },
        { maturity: "live", refText: s("explained.tdh.sure.rule.liveRef") },
      ],
    },
    {
      what: s("explained.tdh.sure.rule.vectors"),
      detail: m("explained.tdh.sure.rule.vectorsDetail"),
      marks: [
        {
          kind: "tested",
          label: s("explained.tdh.sure.rule.vectorsMark", {
            passed: p.f("manifest.vectors.passed"),
            total: p.f("manifest.vectors.total"),
          }),
          refText: behind
            ? s("explained.tdh.sure.rule.vectorsBehind", {
                p26: p.f("rules.vectors"),
              })
            : s("explained.tdh.sure.rule.vectorsHere"),
        },
      ],
    },
    {
      what: s("explained.tdh.sure.rule.proved"),
      detail: m("explained.tdh.sure.rule.provedDetail", {
        tdh: p.v("manifest.sections.tdh"),
        p53: p.v("manifest.sections.p53"),
      }),
      marks: [
        { kind: "proved", refText: s("explained.tdh.sure.rule.provedRef") },
      ],
    },
    {
      what: s("explained.tdh.sure.rule.programs"),
      detail: m("explained.tdh.sure.rule.programsDetail"),
      marks: [
        {
          kind: "notProved",
          refText: s("explained.tdh.sure.rule.programsRef"),
        },
      ],
    },
  ];
  const proofA = book.maybe("site.proofA.cycle") !== null;
  const day: Rung[] = [
    {
      what: s("explained.tdh.sure.day.recomputed"),
      detail: m("explained.tdh.sure.day.recomputedDetail"),
      marks: [
        {
          kind: "tested",
          refText: s("explained.tdh.sure.day.recomputedRef", {
            equal: p.f("tdh.days.equal"),
            compared: p.f("tdh.days.compared"),
          }),
        },
      ],
    },
    {
      what: s("explained.tdh.sure.day.inputs"),
      detail: m("explained.tdh.sure.day.inputsDetail", {
        date: p.v("proofs.day.date"),
      }),
      marks: [{ kind: "notYet" }],
    },
    {
      what: s("explained.tdh.sure.day.zk"),
      detail: m("explained.tdh.sure.day.zkDetail", {
        cycle: p.v("site.proofA.cycle"),
        total: p.v("site.proofA.totalWithoutBurn"),
        block: p.v("site.proofA.ethCallBlock"),
        version: <CodeName>{p.v("proofs.day.ruleVersion")}</CodeName>,
        link: (
          <a className={EX_LINK} href={PROOFS_HREF}>
            {s("explained.tdh.sure.day.zkLink")}
          </a>
        ),
      }),
      // Proof B has no recorded day: the pair is half done.
      marks: [{ halfPair: { a: proofA, b: false } }],
    },
    {
      what: s("explained.tdh.sure.day.recorded"),
      detail: m("explained.tdh.sure.day.recordedDetail"),
      marks: [
        { kind: "decided", refText: s("explained.tdh.sure.day.recordedRef") },
      ],
    },
  ];
  return (
    // One section grammar for the whole page: the number and label in the
    // gutter, the heading and its words beside them (EdSection), as every
    // later section has it.
    <EdSection
      id="layers"
      tight={false}
      no="01"
      label={m("explained.tdh.sure.layers.label")}
      title={m("explained.tdh.sure.layers.title")}
      full={<TwoQuestionsFigures ctx={ctx} rule={rule} day={day} />}
    >
      <p className={EX_LAYOUT.paragraph}>
        {m("explained.tdh.sure.layers.body")}
      </p>
    </EdSection>
  );
}

function TwoQuestionsFigures({
  ctx,
  rule,
  day,
}: {
  readonly ctx: SureContext;
  readonly rule: readonly Rung[];
  readonly day: readonly Rung[];
}) {
  const { s, locale } = ctx;
  return (
    <>
      <FactScope
        className="tw-mt-10 md:tw-mt-12"
        ids={[
          "manifest.vectors.passed",
          "manifest.vectors.total",
          "rules.vectors",
          "tdh.days.equal",
          "tdh.days.compared",
        ]}
      >
        <AssuranceLadder
          locale={locale}
          tracks={[
            {
              title: s("explained.tdh.sure.layers.rule"),
              rungs: rule,
              todayAfter: 3,
            },
            {
              title: s("explained.tdh.sure.layers.day"),
              rungs: day,
              todayAfter: 1,
            },
          ]}
        />
      </FactScope>
      <FactScope
        ids={[
          "manifest.vectors.total",
          "manifest.proved",
          "manifest.shownFalse",
        ]}
      >
        <ProvedWhere ctx={ctx} />
      </FactScope>
    </>
  );
}

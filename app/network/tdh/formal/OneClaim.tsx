import { ageText } from "@/components/explained/age";
import {
  ClaimInParts,
  type ClaimPart,
  type ClaimSpan,
} from "@/components/explained/evidence/claims";
import { EX_FOCUS, EX_LAYOUT, EX_TEXT } from "@/components/explained/tokens";
import { CodeName } from "@/components/explained/reference/parts";
import { FactScope } from "@/components/explained/facts/FactText";
import type { SureContext, SureKey } from "./sureShared";

/**
 * §02 One claim, to the end (TDH-DESIGN.md §4.6): the netting sentence as
 * first written, as narrowed, and as it stands, each quoted with its commit
 * and time, the two refutations with their numbers, and how long each
 * sentence stood.
 */
/**
 * How the netting proof goes (the owner's brief: what is proved, how, and
 * what not): the four theorems it rests on, in the manifest's own words,
 * read in order. A disclosure, so the page reads first as the story.
 */
const SKETCH: readonly { readonly name: string; readonly key: SureKey }[] = [
  { name: "netPairs_eq_of_net", key: "explained.tdh.sure.sketch.pairs" },
  { name: "net_invariance", key: "explained.tdh.sure.sketch.one" },
  { name: "replay_invariance", key: "explained.tdh.sure.sketch.all" },
  { name: "replayHoldings_invariance", key: "explained.tdh.sure.sketch.cycle" },
];

function ProofSketch({ m }: { readonly m: SureContext["m"] }) {
  return (
    <details className="tw-group tw-mt-8 tw-max-w-[860px] tw-rounded-xl tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-950 tw-px-5 tw-py-4 md:tw-px-6">
      <summary
        className={`tw-cursor-pointer tw-list-none tw-text-[17px] tw-font-semibold tw-leading-6 tw-text-iron-50 marker:tw-hidden [&::-webkit-details-marker]:tw-hidden ${EX_FOCUS}`}
      >
        <span aria-hidden="true" className="tw-mr-2 tw-inline-block tw-text-iron-400 group-open:tw-rotate-90">
          ›
        </span>
        {m("explained.tdh.sure.sketch.summary")}
      </summary>
      <p className="tw-m-0 tw-mt-3 tw-text-[15px] tw-leading-6 tw-text-iron-300">
        {m("explained.tdh.sure.sketch.intro")}
      </p>
      <ol className="tw-m-0 tw-mt-3 tw-list-none tw-p-0">
        {SKETCH.map((step, index) => (
          <li
            key={step.name}
            className="tw-grid tw-grid-cols-[28px_minmax(0,1fr)] tw-gap-x-2 tw-border-0 tw-border-t tw-border-solid tw-border-iron-900 tw-py-3"
          >
            <span className="tw-text-sm tw-font-semibold tw-tabular-nums tw-text-primary-300">
              {index + 1}
            </span>
            <span className="tw-text-[15px] tw-leading-6 tw-text-iron-300">
              <code className="tw-font-mono tw-text-[13.5px] tw-text-iron-50">
                {step.name}
              </code>
              {": "}
              {m(step.key)}
            </span>
          </li>
        ))}
      </ol>
      <p className="tw-m-0 tw-mt-1 tw-text-[15px] tw-leading-6 tw-text-iron-400">
        {m("explained.tdh.sure.sketch.close")}
      </p>
    </details>
  );
}

export default function OneClaim({ ctx }: { readonly ctx: SureContext }) {
  const { m, s, p, book, locale } = ctx;
  const minutes = (
    id: "netting.first.minutes" | "netting.narrowed.minutes"
  ) => {
    const value = book.maybe<number>(id)?.value;
    return value === undefined ? p.f(id) : ageText(locale, value);
  };
  const parts: ClaimPart[] = [
    {
      when: s("explained.tdh.sure.part.first.when", {
        time: p.f("netting.first.at"),
      }),
      where: s("explained.tdh.sure.part.where", {
        commit: p.f("netting.first.commit"),
      }),
      quote: m("explained.tdh.sure.part.first.quote", {
        net: <CodeName>net(w)</CodeName>,
      }),
      mark: {
        kind: "shownFalse",
        refText: s("explained.tdh.sure.part.first.case"),
      },
      body: m("explained.tdh.sure.part.first.body", {
        copies: p.v("cases.H.copies"),
        mintedBefore: p.v("cases.H.minted.before"),
        mintedAfter: p.v("cases.H.minted.after"),
        rateBefore: p.v("cases.H.rate.before"),
        rateAfter: p.v("cases.H.rate.after"),
        finalBefore: p.v("cases.H.final.before"),
        finalAfter: p.v("cases.H.final.after"),
      }),
      cap: m("explained.tdh.sure.part.first.cap"),
    },
    {
      when: s("explained.tdh.sure.part.narrowed.when", {
        time: p.f("netting.narrowed.at"),
      }),
      where: s("explained.tdh.sure.part.where", {
        commit: p.f("netting.narrowed.commit"),
      }),
      quote: m("explained.tdh.sure.part.narrowed.quote"),
      mark: {
        kind: "shownFalse",
        refText: s("explained.tdh.sure.part.narrowed.case"),
      },
      body: m("explained.tdh.sure.part.narrowed.body", {
        hBefore: p.v("cases.I.h.before"),
        hAfter: p.v("cases.I.h.after"),
        finalBefore: p.v("cases.I.final.before"),
        finalAfter: p.v("cases.I.final.after"),
      }),
      cap: m("explained.tdh.sure.part.narrowed.cap"),
    },
    {
      when: s("explained.tdh.sure.part.proved.when", {
        time: p.f("netting.proved.at"),
      }),
      where: s("explained.tdh.sure.part.where", {
        commit: p.f("netting.proved.commit"),
      }),
      quote: m("explained.tdh.sure.part.proved.quote"),
      mark: {
        kind: "proved",
        refText: s("explained.tdh.sure.part.proved.ref"),
      },
      lean: {
        name: book.maybe("manifest.headline.name"),
        file: book.maybe("manifest.headline.file"),
        line: book.maybe("manifest.headline.line"),
        axioms: book.maybe("manifest.headline.axioms"),
      },
      body: null,
      doesNotCover: m("explained.tdh.sure.part.proved.notCovered"),
    },
  ];
  const spans: ClaimSpan[] = [
    {
      duration: minutes("netting.first.minutes"),
      what: s("explained.tdh.sure.span.first"),
      outcome: "refuted",
    },
    {
      duration: minutes("netting.narrowed.minutes"),
      what: s("explained.tdh.sure.span.narrowed"),
      outcome: "refuted",
    },
    {
      duration: s("explained.tdh.sure.span.since", {
        time: p.f("netting.proved.at"),
      }),
      what: s("explained.tdh.sure.span.holds"),
      outcome: "holds",
    },
  ];
  return (
    <section id="featured" className={`tw-scroll-mt-24 ${EX_LAYOUT.section}`}>
      <div className={EX_LAYOUT.stmt}>
        <div>
          <span className={`${EX_TEXT.label} tw-mb-3.5 tw-block`}>
            <span className="tw-text-primary-300">02</span>
            {" · "}
            {m("explained.tdh.sure.featured.label")}
          </span>
          <h2 className={EX_TEXT.stmt}>
            {m("explained.tdh.sure.featured.title")}
          </h2>
        </div>
        <div className="lg:tw-pt-1.5">
          <p className={EX_LAYOUT.paragraph}>
            {m("explained.tdh.sure.featured.body", {
              day: p.v("netting.day"),
            })}
          </p>
        </div>
      </div>
      <FactScope
        className="tw-mt-10 md:tw-mt-12"
        ids={[
          "netting.first.at",
          "netting.first.commit",
          "netting.narrowed.at",
          "netting.narrowed.commit",
          "netting.proved.at",
          "netting.proved.commit",
          "netting.first.minutes",
          "netting.narrowed.minutes",
          "manifest.headline.name",
        ]}
      >
        <ClaimInParts parts={parts} spans={spans} locale={locale} />
      </FactScope>
      <ProofSketch m={m} />
    </section>
  );
}

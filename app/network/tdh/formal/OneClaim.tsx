import { ageText } from "@/components/explained/age";
import {
  ClaimInParts,
  type ClaimPart,
  type ClaimSpan,
} from "@/components/explained/evidence/claims";
import { EX_LAYOUT, EX_TEXT } from "@/components/explained/tokens";
import { Glyph } from "@/components/explained/marks/glyphs";
import { CodeName, EdSection } from "@/components/explained/reference/parts";
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
const SKETCH: readonly {
  readonly name: string;
  readonly key: SureKey;
  readonly short: SureKey;
  /** The group it falls in, its eyebrow on a phone. */
  readonly group: SureKey;
}[] = [
  {
    name: "netPairs_eq_of_net",
    key: "explained.tdh.sure.sketch.pairs",
    short: "explained.tdh.sure.sketch.pairsShort",
    group: "explained.tdh.sure.sketch.groupOne",
  },
  {
    name: "net_invariance",
    key: "explained.tdh.sure.sketch.one",
    short: "explained.tdh.sure.sketch.oneShort",
    group: "explained.tdh.sure.sketch.groupOne",
  },
  {
    name: "replay_invariance",
    key: "explained.tdh.sure.sketch.all",
    short: "explained.tdh.sure.sketch.allShort",
    group: "explained.tdh.sure.sketch.groupInduction",
  },
  {
    name: "replayHoldings_invariance",
    key: "explained.tdh.sure.sketch.cycle",
    short: "explained.tdh.sure.sketch.cycleShort",
    group: "explained.tdh.sure.sketch.groupCycle",
  },
];

/**
 * The argument drawn as a dependency chain: four theorems, each the next
 * one's step (pairs, one transaction, the replay, whole sequences), the
 * groups they fall in above them, the frame lemmas under every step, and
 * where the chain stops at both ends. Its heading sits on the page's
 * label and text grid; the chain runs the section's full width.
 */
const GROUPS: readonly {
  readonly key: SureKey;
  readonly span: string;
}[] = [
  { key: "explained.tdh.sure.sketch.groupOne", span: "lg:tw-col-span-2" },
  { key: "explained.tdh.sure.sketch.groupInduction", span: "" },
  { key: "explained.tdh.sure.sketch.groupCycle", span: "" },
];

function ProofSketch({ m }: { readonly m: SureContext["m"] }) {
  const last = SKETCH.length - 1;
  return (
    <figure className="tw-m-0 tw-mt-12 md:tw-mt-14" data-fig="proof-chain">
      <figcaption className={EX_LAYOUT.ed}>
        <span aria-hidden="true" className="max-lg:tw-hidden" />
        <div className={`${EX_LAYOUT.edWide} tw-min-w-0`}>
          <h3 className={`${EX_TEXT.h3} tw-mb-2.5`}>
            {m("explained.tdh.sure.sketch.summary")}
          </h3>
          <p className={`${EX_LAYOUT.paragraph} tw-text-iron-300`}>
            {m("explained.tdh.sure.sketch.intro")}
          </p>
        </div>
      </figcaption>
      <div className="tw-mt-7" data-proof-chain="">
        {/* The groups, as brackets over the steps they hold. */}
        <ol
          className="tw-m-0 tw-hidden tw-list-none tw-grid-cols-4 tw-gap-x-7 tw-p-0 tw-pt-2 lg:tw-grid"
          aria-hidden="true"
        >
          {GROUPS.map((group) => (
            <li
              key={group.key}
              className={`${group.span} tw-relative tw-h-4 tw-border-0 tw-border-x tw-border-t tw-border-solid tw-border-iron-700`}
            >
              {/* The group's name sits on its bracket's line. */}
              <span
                className={`${EX_TEXT.label} tw-absolute -tw-top-2 tw-left-3 tw-whitespace-nowrap tw-bg-[#0D0D0F] tw-px-1.5`}
              >
                {m(group.key)}
              </span>
            </li>
          ))}
        </ol>
        <ol className="tw-m-0 tw-grid tw-list-none tw-grid-cols-1 tw-gap-y-7 tw-p-0 lg:tw-mt-2 lg:tw-grid-cols-4 lg:tw-gap-x-7">
          {SKETCH.map((step, index) => (
            <li
              key={step.name}
              className={`tw-relative tw-flex tw-min-w-0 tw-flex-col tw-rounded-xl tw-border tw-border-solid tw-px-4 tw-pb-4 tw-pt-3.5 ${index === last ? "tw-border-green/60 tw-bg-green/[0.06]" : "tw-border-iron-800 tw-bg-iron-950"}`}
              data-step={index + 1}
            >
              <span
                className={`${EX_TEXT.label} tw-mb-2 tw-block lg:tw-hidden`}
              >
                {m(step.group)}
              </span>
              <span className="tw-flex tw-items-baseline tw-justify-between tw-gap-2">
                <span className="tw-flex tw-items-baseline tw-gap-2">
                  <span className="tw-text-[15px] tw-font-semibold tw-tabular-nums tw-text-primary-300">
                    {index + 1}
                  </span>
                  <b className="tw-text-base tw-font-semibold tw-leading-6 tw-text-iron-50">
                    {m(step.short)}
                  </b>
                </span>
              </span>
              <code className="tw-mt-1.5 tw-block tw-font-mono tw-text-[13px] tw-leading-5 tw-text-iron-400 [overflow-wrap:anywhere]">
                {step.name}
              </code>
              <span className="tw-mt-2.5 tw-text-[15px] tw-leading-6 tw-text-iron-300">
                {m(step.key)}
              </span>
              {/* The last step is the claim the section is about. */}
              {index === last && (
                <span className="tw-mt-auto tw-pt-3 tw-text-[13px] tw-font-semibold tw-leading-5 tw-text-green">
                  {m("explained.tdh.sure.sketch.claimTag")}
                </span>
              )}
              {/* The arrow to the next step: across the gap on a desktop,
                  down it on a phone. */}
              {index < last && (
                <span
                  aria-hidden="true"
                  data-tdh-check-ignore="text-escapes-frame"
                  className="tw-absolute tw-left-1/2 tw-top-full tw-flex tw-h-7 tw-w-px -tw-translate-x-1/2 tw-items-end tw-justify-center tw-bg-iron-600 lg:tw-left-full lg:tw-top-1/2 lg:tw-h-px lg:tw-w-7 lg:tw-translate-x-0 lg:tw-items-center lg:tw-justify-end"
                >
                  <span className="tw-block tw-size-0 tw-translate-y-px tw-border-x-[5px] tw-border-b-0 tw-border-t-[6px] tw-border-solid tw-border-x-transparent tw-border-t-iron-400 lg:tw-translate-x-px lg:tw-translate-y-0 lg:tw-border-y-[5px] lg:tw-border-l-[6px] lg:tw-border-r-0 lg:tw-border-y-transparent lg:tw-border-l-iron-400" />
                </span>
              )}
            </li>
          ))}
        </ol>
        {/* The frame lemmas, under every step: one rail with a tick up to
            each step it holds. */}
        <div className="tw-mt-5 lg:tw-mt-0" data-proof-frame="">
          <div
            className="tw-relative tw-hidden tw-h-5 lg:tw-grid lg:tw-grid-cols-4 lg:tw-gap-x-7"
            aria-hidden="true"
          >
            {SKETCH.map((step) => (
              <span
                key={step.name}
                className="tw-mx-auto tw-block tw-h-full tw-w-px tw-bg-iron-700"
              />
            ))}
            <span className="tw-absolute tw-inset-x-[calc(12.5%_-_10.5px)] tw-bottom-0 tw-h-px tw-bg-iron-700" />
          </div>
          <p className="tw-m-0 tw-rounded-lg tw-border tw-border-solid tw-border-iron-800 tw-px-4 tw-py-3 tw-text-[15px] tw-leading-6 tw-text-iron-300 lg:tw-text-center">
            <b className="tw-font-semibold tw-text-iron-50">
              {m("explained.tdh.sure.sketch.frameLead")}
            </b>{" "}
            {m("explained.tdh.sure.sketch.frame")}
          </p>
        </div>
        {/* Where the chain stops, at both ends, behind a dashed line as on
            the page's first figure. */}
        <div
          className="tw-mt-4 tw-rounded-xl tw-border tw-border-dashed tw-border-iron-600 tw-p-4 md:tw-p-5"
          data-proof-stops=""
        >
          <span className="tw-flex tw-items-center tw-gap-2 tw-text-[15px] tw-font-semibold tw-leading-6 tw-text-iron-50">
            <Glyph kind="notGuaranteed" className="tw-size-3.5" />
            {m("explained.tdh.sure.sketch.stopsTitle")}
          </span>
          <ul className="tw-m-0 tw-mt-3 tw-grid tw-list-none tw-grid-cols-1 tw-gap-x-7 tw-gap-y-3 tw-p-0 lg:tw-grid-cols-2">
            <li className="tw-text-[15px] tw-leading-6 tw-text-iron-300">
              <b className="tw-font-semibold tw-text-iron-50">
                {m("explained.tdh.sure.sketch.stopBeforeLead")}
              </b>{" "}
              {m("explained.tdh.sure.sketch.stopBefore")}
            </li>
            <li className="tw-text-[15px] tw-leading-6 tw-text-iron-300">
              <b className="tw-font-semibold tw-text-iron-50">
                {m("explained.tdh.sure.sketch.stopAfterLead")}
              </b>{" "}
              {m("explained.tdh.sure.sketch.stopAfter")}
            </li>
          </ul>
        </div>
      </div>
    </figure>
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
  // The timeline draws each refuted span to scale (4 h 3 min beside 2 h
  // 43 min), from the same facts its labels print.
  const minutesOf = (
    id: "netting.first.minutes" | "netting.narrowed.minutes"
  ) => {
    const value = book.maybe<number>(id)?.value;
    return value === undefined ? {} : { minutes: value };
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
      where: s("explained.tdh.sure.part.whereExact", {
        commit: p.f("netting.proved.commit"),
        exact: p.f("netting.exact.commit"),
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
        at: book.maybe("manifest.commit"),
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
      ...minutesOf("netting.first.minutes"),
    },
    {
      duration: minutes("netting.narrowed.minutes"),
      what: s("explained.tdh.sure.span.narrowed"),
      outcome: "refuted",
      ...minutesOf("netting.narrowed.minutes"),
    },
    {
      duration: s("explained.tdh.sure.span.since", {
        time: p.f("netting.proved.at"),
      }),
      what: s("explained.tdh.sure.span.holds", {
        exact: p.f("netting.exact.at"),
      }),
      outcome: "holds",
    },
  ];
  return (
    <EdSection
      id="featured"
      tight={false}
      no="02"
      label={m("explained.tdh.sure.featured.label")}
      title={m("explained.tdh.sure.featured.title")}
      full={
        <>
          <FactScope
            className="tw-mt-10 md:tw-mt-12"
            ids={[
              "netting.first.at",
              "netting.first.commit",
              "netting.narrowed.at",
              "netting.narrowed.commit",
              "netting.proved.at",
              "netting.exact.at",
              "netting.exact.commit",
              "netting.proved.commit",
              "netting.first.minutes",
              "netting.narrowed.minutes",
              "manifest.headline.name",
            ]}
          >
            <ClaimInParts parts={parts} spans={spans} locale={locale} />
          </FactScope>
          <ProofSketch m={m} />
        </>
      }
    >
      <p className={EX_LAYOUT.paragraph}>
        {m("explained.tdh.sure.featured.body", {
          day: p.v("netting.day"),
        })}
      </p>
    </EdSection>
  );
}

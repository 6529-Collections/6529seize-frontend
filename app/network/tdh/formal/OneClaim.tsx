import { ageText } from "@/components/explained/age";
import {
  ClaimInParts,
  type ClaimPart,
  type ClaimSpan,
} from "@/components/explained/evidence/claims";
import { EX_LAYOUT, EX_TEXT } from "@/components/explained/tokens";
import { CodeName } from "../_reference/parts";
import { FactScope } from "../_reference/rich";
import type { SureContext } from "./sureShared";

/**
 * §02 One claim, to the end (TDH-DESIGN.md §4.6): the netting sentence as
 * first written, as narrowed, and as it stands, each quoted with its commit
 * and time, the two refutations with their numbers, and how long each
 * sentence stood.
 */
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
    </section>
  );
}

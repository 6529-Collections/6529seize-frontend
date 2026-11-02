import Lanes from "@/components/explained/figures/Lanes";
import { Glyph } from "@/components/explained/marks/glyphs";
import { EX_LINK, EX_TEXT } from "@/components/explained/tokens";
import type { SureContext } from "./sureShared";

/**
 * What is proved, and where it stops: the picture of this page. P26's
 * text, tied to the Lean model by the vectors (tested); the model's
 * theorems, checked in Lean's kernel (proved); and, under a dashed line,
 * what the chain does not reach, each with what checks it instead. The
 * counts are the manifest's facts.
 */
export default function ProvedWhere({ ctx }: { readonly ctx: SureContext }) {
  const { m, s, p, locale } = ctx;
  const stops = [
    {
      id: "sort",
      what: m("explained.tdh.sure.where.sort"),
      then: m("explained.tdh.sure.where.sortThen"),
    },
    {
      id: "beyond",
      what: m("explained.tdh.sure.where.beyond"),
      then: m("explained.tdh.sure.where.beyondThen"),
    },
    {
      id: "code",
      what: m("explained.tdh.sure.where.code"),
      then: m("explained.tdh.sure.where.codeThen"),
    },
    {
      id: "day",
      what: m("explained.tdh.sure.where.day"),
      then: m("explained.tdh.sure.where.dayThen", {
        link: (
          <a className={EX_LINK} href="/network/tdh/verification">
            {s("explained.tdh.sure.where.dayLink")}
          </a>
        ),
      }),
    },
  ];
  return (
    <figure className="tw-m-0 tw-mt-10 md:tw-mt-12" data-fig="proved-where">
      <figcaption className={`${EX_TEXT.label} tw-mb-3.5`}>
        {s("explained.tdh.sure.where.label")}
      </figcaption>
      <Lanes
        locale={locale}
        label={s("explained.tdh.sure.where.label")}
        lanes={[
          {
            kicker: s("explained.tdh.sure.where.p26Kicker"),
            title: s("explained.tdh.sure.where.p26"),
            cap: m("explained.tdh.sure.where.p26Cap"),
          },
          {
            kicker: s("explained.tdh.sure.where.vectorsKicker"),
            title: s("explained.tdh.sure.where.vectors", {
              total: p.f("manifest.vectors.total"),
            }),
            cap: m("explained.tdh.sure.where.vectorsCap"),
          },
          {
            kicker: s("explained.tdh.sure.where.modelKicker"),
            title: s("explained.tdh.sure.where.model"),
            cap: m("explained.tdh.sure.where.modelCap", {
              commit: p.v("manifest.commit"),
            }),
          },
          {
            kicker: s("explained.tdh.sure.where.provedKicker"),
            title: s("explained.tdh.sure.where.proved", {
              proved: p.f("manifest.proved"),
            }),
            cap: m("explained.tdh.sure.where.provedCap", {
              shownFalse: p.f("manifest.shownFalse"),
            }),
            ok: true,
          },
        ]}
      />
      {/* What the chain does not reach: outside it, behind a dashed line,
          each with what checks it instead. */}
      <div
        className="tw-mt-4 tw-rounded-xl tw-border tw-border-dashed tw-border-iron-600 tw-p-4 md:tw-p-5"
        data-proved-stops=""
      >
        <span className="tw-flex tw-items-center tw-gap-2 tw-text-[15px] tw-font-semibold tw-leading-6 tw-text-iron-50">
          <Glyph kind="notGuaranteed" className="tw-size-3.5" />
          {s("explained.tdh.sure.where.stopsTitle")}
        </span>
        <ul className="tw-m-0 tw-mt-3 tw-grid tw-list-none tw-grid-cols-1 tw-gap-x-8 tw-gap-y-3 tw-p-0 md:tw-grid-cols-2">
          {stops.map((stop) => (
            <li
              key={stop.id}
              className="tw-text-[15px] tw-leading-6 tw-text-iron-300"
            >
              <b className="tw-font-semibold tw-text-iron-50">{stop.what}</b>{" "}
              {stop.then}
            </li>
          ))}
        </ul>
      </div>
    </figure>
  );
}

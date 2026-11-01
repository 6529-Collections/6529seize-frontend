import Link from "next/link";
import type { ReactNode } from "react";
import { Glyph, type GlyphKind } from "@/components/explained/marks/glyphs";
import { EX_LINK, EX_TEXT } from "@/components/explained/tokens";
import type { SupportedLocale } from "@/i18n/locales";
import type { FactBook } from "@/lib/explained/facts";
import { Fact } from "../_lib/facts";
import { hrich, ht } from "./copy";

/**
 * Three things you can check today (MAP.md §3): every identity equal in
 * today's comparison, the Lean theorems with the claims they showed false,
 * and the one day proved in zero knowledge with its second proof not done;
 * then who runs the checks. Each head links to the page that shows it.
 */
const HEAD_LINK = `${EX_LINK} tw-font-semibold`;

function Item({
  glyph,
  children,
}: {
  readonly glyph: GlyphKind;
  readonly children: ReactNode;
}) {
  return (
    <li className="tw-mt-3.5 tw-grid tw-grid-cols-[18px_minmax(0,1fr)] tw-gap-2.5 tw-text-[15px] tw-leading-[23px] tw-text-iron-300">
      <Glyph kind={glyph} className="tw-mt-1 tw-size-4" />
      <span>{children}</span>
    </li>
  );
}

/** Every result so far was equal: "in each of the n results since Oct 14". */
function everyDayEqual(book: FactBook): boolean {
  const equal = book.maybe<number>("tdh.days.equal");
  const compared = book.maybe<number>("tdh.days.compared");
  return equal !== null && compared !== null && equal.value === compared.value;
}

export default function CheckableToday({
  book,
  locale,
}: {
  readonly book: FactBook;
  readonly locale: SupportedLocale;
}) {
  const fact = (id: Parameters<typeof Fact>[0]["id"]) => (
    <Fact book={book} id={id} locale={locale} />
  );
  const days = fact("tdh.days.compared");
  const first = fact("tdh.days.first");
  return (
    <div
      className="tw-rounded-xl tw-border tw-border-solid tw-border-iron-900 tw-bg-iron-950 tw-p-6"
      data-ex-checkable=""
    >
      <span className={EX_TEXT.label}>{ht(locale, "check.label")}</span>
      <ul className="tw-m-0 tw-list-none tw-p-0">
        <Item glyph="tested">
          <Link className={HEAD_LINK} href="/network/tdh/verification">
            {hrich(locale, "check.identities", {
              equal: fact("tdh.latest.agree.live.identities.equal"),
              total: fact("tdh.latest.agree.live.identities.total"),
            })}
          </Link>{" "}
          {everyDayEqual(book)
            ? hrich(locale, "check.identitiesBody", { days, first })
            : hrich(locale, "check.identitiesSome", {
                days,
                first,
                equal: fact("tdh.days.equal"),
              })}
        </Item>
        <Item glyph="proved">
          <Link className={HEAD_LINK} href="/network/tdh/formal">
            {hrich(locale, "check.theorems", {
              proved: fact("manifest.proved"),
            })}
          </Link>{" "}
          {hrich(locale, "check.theoremsBody", {
            tdh: fact("manifest.proved.tdh"),
            p53: fact("manifest.proved.p53"),
            shownFalse: fact("manifest.shownFalse"),
          })}
        </Item>
        <Item glyph="tested">
          <Link className={HEAD_LINK} href="/network/tdh/proofs">
            {ht(locale, "check.proof")}
          </Link>{" "}
          {ht(locale, "check.proofBody")}
        </Item>
      </ul>
      <p className={`${EX_TEXT.cap} tw-m-0 tw-mt-3`}>
        {ht(locale, "check.candour")}
      </p>
    </div>
  );
}

import Link from "next/link";
import type { ReactNode } from "react";
import { HalfPair } from "@/components/explained/evidence/AssuranceLadder";
import Mark from "@/components/explained/marks/Mark";
import { EX_FOCUS, EX_LINK, EX_TEXT } from "@/components/explained/tokens";
import type { SupportedLocale } from "@/i18n/locales";
import type { FactBook } from "@/lib/explained/facts";
import { Fact } from "../_lib/facts";
import { hrich, ht } from "./copy";

/**
 * Three things checked (MAP.md §3), each with its mark in words and when it
 * was last checked: every identity equal in the daily comparison (the only
 * one run every day), the Lean theorems with the claims they showed false,
 * and the one real day proved in zero knowledge, under the retired rules,
 * with its second proof not done; then what anyone can check by themselves.
 * Each head links to the page that shows it.
 */
// The headline is a link in white, underlined on hover: blue is kept for
// the links in running text and for live values.
const HEAD_LINK = `tw-font-semibold tw-text-iron-50 tw-no-underline hover:tw-text-iron-50 hover:tw-underline hover:tw-decoration-iron-500 hover:tw-underline-offset-4 ${EX_FOCUS}`;

function Item({
  mark,
  when,
  head,
  children,
}: {
  readonly mark: ReactNode;
  readonly when: ReactNode;
  /** The one number or verdict, as a link to the page that shows it. */
  readonly head: ReactNode;
  readonly children: ReactNode;
}) {
  return (
    // From lg up the three share one grid's rows (mark and date, headline,
    // body), so their headlines sit on one baseline however long a date runs.
    <li className="tw-mt-4 tw-flex tw-flex-col tw-border-0 tw-border-t tw-border-solid tw-border-iron-900 tw-pt-4 first:tw-mt-3 first:tw-border-t-0 first:tw-pt-0 lg:tw-row-span-3 lg:tw-mt-3 lg:tw-grid lg:tw-grid-rows-subgrid lg:tw-gap-y-2 lg:tw-border-l lg:tw-border-t-0 lg:tw-pl-6 lg:tw-pt-0 lg:first:tw-border-l-0 lg:first:tw-pl-0">
      <div className="tw-flex tw-flex-wrap tw-content-start tw-items-center tw-gap-x-2 tw-gap-y-1">
        {mark}
        <span className="tw-text-[13px] tw-font-medium tw-leading-5 tw-text-iron-400">
          {when}
        </span>
      </div>
      <span className="tw-mt-2 tw-block tw-text-[22px] tw-font-semibold tw-tabular-nums tw-leading-7 tw-tracking-[-0.01em] max-[359px]:tw-text-base max-[359px]:tw-leading-6 lg:tw-mt-0 lg:tw-self-end">
        {head}
      </span>
      <span className="tw-mt-2 tw-block tw-text-base tw-leading-[26px] tw-text-iron-300 lg:tw-mt-0">
        {children}
      </span>
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
  const late = book.maybe<number>("tdh.days.late");
  return (
    <div
      className="tw-rounded-xl tw-border tw-border-solid tw-border-iron-900 tw-bg-iron-950 tw-p-6"
      data-ex-checkable=""
    >
      <span className={EX_TEXT.label}>{ht(locale, "check.label")}</span>
      <ul className="tw-m-0 tw-list-none tw-p-0 lg:tw-grid lg:tw-grid-cols-3 lg:tw-gap-x-6 lg:tw-gap-y-0">
        <Item
          mark={<Mark kind="tested" size="sm" locale={locale} />}
          when={hrich(locale, "check.identitiesWhen", {
            date: fact("tdh.latest.date"),
          })}
          head={
            <Link className={HEAD_LINK} href="/network/tdh/verification">
              {hrich(locale, "check.identities", {
                equal: fact("tdh.latest.agree.live.identities.equal"),
                total: fact("tdh.latest.agree.live.identities.total"),
              })}
            </Link>
          }
        >
          {everyDayEqual(book)
            ? hrich(locale, "check.identitiesBody", { days, first })
            : hrich(locale, "check.identitiesSome", {
                days,
                first,
                equal: fact("tdh.days.equal"),
              })}
          {late !== null && late.value > 0 && (
            <>
              {" "}
              {hrich(
                locale,
                everyDayEqual(book)
                  ? "check.identitiesLateEqual"
                  : "check.identitiesLate",
                { late: fact("tdh.days.late") }
              )}
            </>
          )}
        </Item>
        <Item
          mark={<Mark kind="proved" size="sm" locale={locale} />}
          when={hrich(locale, "check.theoremsWhen", {
            date: fact("manifest.writtenAt"),
          })}
          head={
            <Link className={HEAD_LINK} href="/network/tdh/formal">
              {hrich(locale, "check.theorems", {
                proved: fact("manifest.proved.tdh"),
              })}
            </Link>
          }
        >
          {hrich(locale, "check.theoremsBody", {
            p53: fact("manifest.proved.p53"),
            shownFalse: fact("manifest.shownFalse.tdh"),
            allFalse: fact("manifest.shownFalse"),
          })}
        </Item>
        <Item
          mark={<HalfPair a b={false} locale={locale} />}
          when={hrich(locale, "check.proofWhen", {
            day: fact("proofs.day.date"),
            date: fact("proofs.day.provedOn"),
          })}
          head={
            <Link className={HEAD_LINK} href="/network/tdh/proofs">
              {ht(locale, "check.proof")}
            </Link>
          }
        >
          {hrich(locale, "check.proofBody", {
            day: fact("proofs.day.date"),
            cycle: fact("proofs.day.cycle"),
            version: fact("proofs.day.ruleVersion"),
          })}
        </Item>
      </ul>
      <p
        className={`${EX_TEXT.claim} tw-m-0 tw-mt-4 tw-max-w-[560px] lg:tw-mt-6`}
      >
        {ht(locale, "check.candour")}{" "}
        <Link className={EX_LINK} href="/network/tdh#explain">
          {ht(locale, "check.yours")}
        </Link>
      </p>
    </div>
  );
}

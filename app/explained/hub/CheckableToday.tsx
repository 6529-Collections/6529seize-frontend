import Link from "next/link";
import type { ReactNode } from "react";
import { HalfPair } from "@/components/explained/evidence/AssuranceLadder";
import Mark from "@/components/explained/marks/Mark";
import { EX_LINK, EX_TEXT } from "@/components/explained/tokens";
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
const HEAD_LINK = `${EX_LINK} tw-font-semibold`;

function Item({
  mark,
  when,
  children,
}: {
  readonly mark: ReactNode;
  readonly when: ReactNode;
  readonly children: ReactNode;
}) {
  return (
    <li className="tw-mt-4 tw-border-0 tw-border-t tw-border-solid tw-border-iron-900 tw-pt-4 first:tw-mt-3 first:tw-border-t-0 first:tw-pt-0">
      <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-x-2 tw-gap-y-1">
        {mark}
        <span className="tw-text-[13px] tw-font-medium tw-leading-5 tw-text-iron-400">
          {when}
        </span>
      </div>
      <p className="tw-m-0 tw-mt-1.5 tw-text-[15px] tw-leading-[23px] tw-text-iron-300">
        {children}
      </p>
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
      <ul className="tw-m-0 tw-list-none tw-p-0">
        <Item
          mark={<Mark kind="tested" size="sm" locale={locale} />}
          when={hrich(locale, "check.identitiesWhen", {
            date: fact("tdh.latest.date"),
          })}
        >
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
          {late !== null &&
            late.value > 0 && (
              <>
                {" "}
                {hrich(locale, "check.identitiesLate", {
                  late: fact("tdh.days.late"),
                })}
              </>
            )}
        </Item>
        <Item
          mark={<Mark kind="proved" size="sm" locale={locale} />}
          when={hrich(locale, "check.theoremsWhen", {
            date: fact("manifest.writtenAt"),
          })}
        >
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
        <Item
          mark={<HalfPair a b={false} locale={locale} />}
          when={hrich(locale, "check.proofWhen", {
            date: fact("proofs.day.provedOn"),
          })}
        >
          <Link className={HEAD_LINK} href="/network/tdh/proofs">
            {ht(locale, "check.proof")}
          </Link>{" "}
          {hrich(locale, "check.proofBody", {
            day: fact("proofs.day.date"),
            version: fact("proofs.day.ruleVersion"),
          })}
        </Item>
      </ul>
      <p className={`${EX_TEXT.cap} tw-m-0 tw-mt-4`}>
        {ht(locale, "check.candour")}
      </p>
    </div>
  );
}

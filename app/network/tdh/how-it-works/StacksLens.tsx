"use client";

import { useMemo } from "react";
import BreakIt, { breakItLabel } from "@/components/explained/lens/BreakIt";
import { Seg } from "@/components/explained/lens/controls";
import Lens, { Readout } from "@/components/explained/lens/Lens";
import { useBreakable } from "@/components/explained/lens/useBreakable";
import StampLine from "@/components/explained/marks/StampLine";
import type { SupportedLocale } from "@/i18n/locales";
import { formatCount } from "@/lib/explained/format";
import { ht } from "./copy";
import {
  STACK_ACTIONS,
  STACKS,
  stackValues,
  type StackAction,
} from "./models/stacks";

const B = "tw-font-semibold tw-text-iron-50";

type Pick = (typeof STACK_ACTIONS)[number];

/** One copy in a wallet's stack: its whole days, the old one in blue. */
function Copy({
  days,
  old,
  label,
  gone = false,
}: {
  readonly days: string;
  readonly old: boolean;
  readonly label: string;
  readonly gone?: boolean;
}) {
  let tone = old
    ? "tw-border-primary-400/60 tw-bg-primary-400/[0.14] tw-text-iron-50"
    : "tw-border-iron-600 tw-bg-iron-900 tw-text-iron-50";
  if (gone) tone = "tw-border-dashed tw-border-error/70 tw-text-error";
  return (
    <li
      className={`tw-flex tw-min-h-11 tw-items-center tw-justify-between tw-gap-2 tw-rounded-lg tw-border tw-px-3 tw-text-[15px] tw-font-semibold tw-leading-6 ${gone ? "" : "tw-border-solid"} ${tone}`}
      data-copy={gone ? "sold" : "held"}
    >
      <span className="tw-tabular-nums">{days}</span>
      <span className="tw-text-[13px] tw-font-normal tw-leading-5 tw-text-iron-400">
        {label}
      </span>
    </li>
  );
}

/**
 * Model A, step 4: sales and moves (P26 §7.1, §7.2). Two wallets linked
 * both ways, a 300-day copy in B and a 10-day copy in A; each action is
 * replayed by the TDH v1.4 engine. The Break it moves B's copy to A and
 * then sells one: last in, first out, so the old copy leaves.
 */
export default function StacksLens({
  locale,
}: {
  readonly locale: SupportedLocale;
}) {
  const model = useBreakable<{ action: Pick }>({ action: "hold" }, () => ({
    action: "move",
  }));
  const action: StackAction = model.broken
    ? "moveThenSell"
    : model.state.action;
  const values = useMemo(() => stackValues(action), [action]);
  const n = (value: number) => formatCount(locale, value);
  const days = (value: number) =>
    ht(locale, "explained.tdh.how.stacks.days", { days: n(value) });
  const { oldDays, newDays } = STACKS;
  /** "first in" or "last in", when a stack holds more than one copy. */
  const place = (index: number, size: number) => {
    if (size < 2) return "";
    return ht(
      locale,
      index === size - 1
        ? "explained.tdh.how.stacks.lastIn"
        : "explained.tdh.how.stacks.firstIn"
    );
  };

  const column = (name: string, copies: readonly number[]) => (
    <div className="tw-min-w-0">
      <div className="tw-mb-2 tw-text-sm tw-font-semibold tw-text-iron-300">
        {name}
      </div>
      <ol
        className="tw-m-0 tw-flex tw-min-h-[100px] tw-list-none tw-flex-col-reverse tw-gap-2 tw-rounded-xl tw-border tw-border-dashed tw-border-iron-800 tw-p-2"
        aria-label={ht(locale, "explained.tdh.how.stacks.stackOf", { name })}
      >
        {copies.length === 0 && (
          <li className="tw-flex tw-min-h-11 tw-items-center tw-px-1 tw-text-[13px] tw-leading-5 tw-text-iron-400">
            {ht(locale, "explained.tdh.how.stacks.empty")}
          </li>
        )}
        {copies.map((value, index) => (
          <Copy
            // A stack's entries are in arrival order.
            key={index}
            days={days(value)}
            old={value === oldDays}
            label={place(index, copies.length)}
          />
        ))}
      </ol>
    </div>
  );

  let lead: string | null = null;
  let say: string;
  if (model.broken) {
    lead = ht(locale, "explained.tdh.how.stacks.sayBreakLead");
    say = ht(locale, "explained.tdh.how.stacks.sayBreak", {
      old: n(oldDays),
      fresh: n(newDays),
    });
  } else if (action === "sell") {
    say = ht(locale, "explained.tdh.how.stacks.saySell", {
      fresh: n(newDays),
    });
  } else if (action === "move") {
    say = ht(locale, "explained.tdh.how.stacks.sayMove", { old: n(oldDays) });
  } else {
    say = ht(locale, "explained.tdh.how.stacks.sayHold");
  }
  const sellOn = action === "sell" || action === "moveThenSell";
  const moveOn = action === "move" || action === "moveThenSell";

  return (
    <Lens
      id="stacks"
      label={ht(locale, "explained.tdh.how.stacks.label")}
      question={ht(locale, "explained.tdh.how.stacks.question")}
      broken={model.broken}
      locale={locale}
      stage={
        <>
          <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-x-3 tw-gap-y-2">
            <span className="tw-text-sm tw-font-semibold tw-text-iron-400">
              {ht(locale, "explained.tdh.how.stacks.then")}
            </span>
            <Seg
              label={ht(locale, "explained.tdh.how.stacks.group")}
              attr="act"
              value={model.broken ? null : model.state.action}
              onChange={(next) => model.set({ action: next })}
              options={STACK_ACTIONS.map((value) => ({
                value,
                label: ht(locale, `explained.tdh.how.stacks.act.${value}`),
              }))}
            />
          </div>
          <div
            className="tw-mt-5 tw-grid tw-grid-cols-2 tw-gap-3 md:tw-max-w-[560px] md:tw-gap-5"
            data-fig="stacks"
          >
            {column(ht(locale, "explained.tdh.how.stacks.walletA"), values.a)}
            {column(ht(locale, "explained.tdh.how.stacks.walletB"), values.b)}
          </div>
          <p className="tw-m-0 tw-mt-3 tw-text-[13px] tw-leading-5 tw-text-iron-400">
            {ht(locale, "explained.tdh.how.stacks.linked")}
          </p>
          {values.sold !== null && (
            <ul className="tw-m-0 tw-mt-3 tw-max-w-[270px] tw-list-none tw-p-0">
              <Copy
                days={days(values.sold)}
                old={values.sold === oldDays}
                label={ht(locale, "explained.tdh.how.stacks.sold")}
                gone
              />
            </ul>
          )}
        </>
      }
      rule={{
        lines: [
          { text: ht(locale, "explained.tdh.how.stacks.ruleStack") },
          { text: ht(locale, "explained.tdh.how.stacks.ruleSell"), on: sellOn },
          { text: ht(locale, "explained.tdh.how.stacks.ruleMove"), on: moveOn },
          { text: ht(locale, "explained.tdh.how.stacks.ruleOther") },
          {
            text: ht(locale, "explained.tdh.how.stacks.ruleRaw", {
              raw: n(values.raw),
            }),
            on: action === "hold",
          },
        ],
        source: ht(locale, "explained.tdh.how.stacks.ruleSource"),
      }}
      readout={
        <Readout
          big={days(values.raw)}
          say={
            <>
              {lead && <b className={B}>{lead}</b>} {say}
            </>
          }
        />
      }
      breakIt={
        <BreakIt
          id="movesell"
          pressed={model.broken}
          onToggle={model.toggleBreak}
          label={breakItLabel(
            locale,
            ht(locale, "explained.tdh.how.stacks.break")
          )}
        />
      }
      stamp={
        <StampLine
          locale={locale}
          marks={[
            {
              maturity: "live",
              label: ht(locale, "explained.tdh.how.firstday.stamp"),
            },
          ]}
          tag={{
            kind: "example",
            text: ht(locale, "explained.tdh.how.stacks.tag"),
          }}
        />
      }
    />
  );
}

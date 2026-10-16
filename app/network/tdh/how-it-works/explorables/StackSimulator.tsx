"use client";

import { useId, useState } from "react";
import { formatInteger } from "@/i18n/format";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import TdhDisclosure from "../../shared/TdhDisclosure";
import { TDH_BUTTON, TDH_FOCUS_RING } from "../../shared/tdhStyles";
import ExplorableFrame from "./ExplorableFrame";

type StackEvent = {
  readonly kind: "buy" | "sell" | "move";
  readonly day: number;
};

const ADVANCE_DAYS = 10;
const MAX_COPIES = 8;
/** The simulator starts with one copy bought 30 days ago, so it is never empty. */
const SEED_EVENTS: readonly StackEvent[] = [{ kind: "buy", day: 0 }];
const SEED_DAY = 30;

interface StackState {
  readonly a: readonly number[];
  readonly b: readonly number[];
}

/**
 * Replays the events with today's consolidation setting, as P26 §6.4 applies
 * the grouping at the snapshot to the whole history (DEV-10): a move carries
 * the copy's acquisition day only when A and B are consolidated.
 */
export function replayStacks(
  events: readonly StackEvent[],
  consolidated: boolean
): StackState {
  const a: number[] = [];
  const b: number[] = [];
  for (const event of events) {
    if (event.kind === "buy") {
      a.push(event.day);
    } else if (event.kind === "sell") {
      a.pop();
    } else {
      const moved = a.pop();
      if (moved !== undefined) {
        b.push(consolidated ? moved : event.day);
      }
    }
  }
  return { a, b };
}

function rawDays(stack: readonly number[], today: number): number {
  return stack.reduce(
    (sum, acquired) => sum + Math.max(today - acquired, 0),
    0
  );
}

function Stack({
  locale,
  name,
  stack,
  today,
}: {
  readonly locale: SupportedLocale;
  readonly name: string;
  readonly stack: readonly number[];
  readonly today: number;
}) {
  // A tower on a shelf: copies stack upward from the wallet's name, and
  // the box is only as tall as its copies, at least one copy high.
  return (
    <div className="tw-flex tw-min-w-0 tw-flex-col tw-justify-end">
      <ol
        reversed
        className="tw-m-0 tw-flex tw-min-h-[3.25rem] tw-list-none tw-flex-col-reverse tw-justify-start tw-gap-1 tw-rounded-lg tw-border tw-border-dashed tw-border-iron-700 tw-p-2"
      >
        {stack.length === 0 && (
          <li className="tw-m-auto tw-text-xs tw-text-iron-500">
            {t(locale, "network.tdh.how.stack.empty")}
          </li>
        )}
        {stack.map((acquired, index) => {
          const days = Math.max(today - acquired, 0);
          return (
            <li
              key={`${acquired}-${index}`}
              className="tw-flex tw-min-h-9 tw-items-center tw-justify-between tw-gap-2 tw-rounded-md tw-bg-sky-400/15 tw-px-3 tw-text-sm tw-tabular-nums tw-text-sky-100 tw-ring-1 tw-ring-inset tw-ring-sky-400/30"
            >
              <span className="tw-sr-only">
                {t(locale, "network.tdh.how.stack.copy", {
                  acquired: formatInteger(locale, acquired),
                  days: formatInteger(locale, days),
                })}
              </span>
              <span
                aria-hidden="true"
                className="tw-text-xs tw-text-sky-200/70"
              >
                {t(locale, "network.tdh.how.stack.day", {
                  day: formatInteger(locale, acquired),
                })}
              </span>
              <span aria-hidden="true" className="tw-font-semibold">
                {t(locale, "network.tdh.how.s4.daysLabel", {
                  days: formatInteger(locale, days),
                })}
              </span>
            </li>
          );
        })}
      </ol>
      <p className="tw-m-0 tw-mt-2 tw-border-0 tw-border-t-2 tw-border-solid tw-border-iron-600 tw-pt-2 tw-text-sm tw-font-medium tw-text-iron-100">
        {t(locale, "network.tdh.how.stack.wallet", { name })}
      </p>
      <p className="tw-m-0 tw-text-sm tw-tabular-nums tw-text-iron-300">
        {t(locale, "network.tdh.how.stack.raw", {
          raw: formatInteger(locale, rawDays(stack, today)),
        })}
      </p>
    </div>
  );
}

/** Step 4: buy, sell and move copies of one card between two wallets. */
export default function StackSimulator({
  locale,
}: {
  readonly locale: SupportedLocale;
}) {
  const toggleId = useId();
  const [events, setEvents] = useState<readonly StackEvent[]>(SEED_EVENTS);
  const [today, setToday] = useState(SEED_DAY);
  const [consolidated, setConsolidated] = useState(false);
  const { a, b } = replayStacks(events, consolidated);
  const add = (kind: StackEvent["kind"]) =>
    setEvents((current) => [...current, { kind, day: today }]);

  return (
    <ExplorableFrame
      locale={locale}
      title={t(locale, "network.tdh.how.stack.title")}
      onReset={() => {
        setEvents(SEED_EVENTS);
        setToday(SEED_DAY);
        setConsolidated(false);
      }}
    >
      <p className="tw-m-0 tw-text-sm tw-leading-6 tw-text-iron-300">
        {t(locale, "network.tdh.how.stack.intro")}
      </p>
      <div className="tw-mt-3 tw-flex tw-flex-wrap tw-gap-2">
        <button
          type="button"
          className={TDH_BUTTON}
          disabled={a.length + b.length >= MAX_COPIES}
          onClick={() => add("buy")}
        >
          {t(locale, "network.tdh.how.stack.buy")}
        </button>
        <button
          type="button"
          className={TDH_BUTTON}
          disabled={a.length === 0}
          onClick={() => add("sell")}
        >
          {t(locale, "network.tdh.how.stack.sell")}
        </button>
        <button
          type="button"
          className={TDH_BUTTON}
          disabled={a.length === 0}
          onClick={() => add("move")}
        >
          {t(locale, "network.tdh.how.stack.move")}
        </button>
        <button
          type="button"
          className={TDH_BUTTON}
          onClick={() => setToday((day) => day + ADVANCE_DAYS)}
        >
          {t(locale, "network.tdh.how.stack.advance", {
            days: formatInteger(locale, ADVANCE_DAYS),
          })}
        </button>
      </div>
      <div className="tw-mt-3 tw-flex tw-flex-wrap tw-items-center tw-justify-between tw-gap-3">
        <label
          htmlFor={toggleId}
          className="tw-inline-flex tw-min-h-11 tw-cursor-pointer tw-items-center tw-gap-2 tw-text-sm tw-text-iron-200"
        >
          <input
            id={toggleId}
            type="checkbox"
            checked={consolidated}
            onChange={(event) => setConsolidated(event.target.checked)}
            className={`tw-form-checkbox tw-size-5 tw-shrink-0 tw-rounded tw-border tw-border-solid tw-border-iron-500 tw-bg-iron-950 tw-text-primary-500 focus:tw-ring-primary-400 disabled:tw-opacity-40 ${TDH_FOCUS_RING}`}
          />
          {t(locale, "network.tdh.how.stack.consolidated")}
        </label>
        <span className="tw-rounded-full tw-bg-iron-800 tw-px-3 tw-py-1 tw-text-sm tw-font-medium tw-tabular-nums tw-text-iron-100">
          {t(locale, "network.tdh.how.stack.day", {
            day: formatInteger(locale, today),
          })}
        </span>
      </div>
      <div className="tw-mt-4 tw-grid tw-grid-cols-2 tw-gap-3 sm:tw-gap-5">
        <Stack locale={locale} name="A" stack={a} today={today} />
        <Stack locale={locale} name="B" stack={b} today={today} />
      </div>
      <p aria-live="polite" className="tw-sr-only">
        {t(locale, "network.tdh.how.stack.status", {
          day: formatInteger(locale, today),
          a: formatInteger(locale, a.length),
          b: formatInteger(locale, b.length),
          rawA: formatInteger(locale, rawDays(a, today)),
          rawB: formatInteger(locale, rawDays(b, today)),
        })}
      </p>
      <TdhDisclosure
        className="tw-mt-4"
        defaultOpen
        summary={t(locale, "network.tdh.how.stack.log")}
      >
        <ol className="tw-m-0 tw-space-y-1 tw-pl-11 tw-text-sm tw-text-iron-300">
          {events.length === 0 ? (
            <li className="-tw-ml-5 tw-list-none tw-pl-0">
              {t(locale, "network.tdh.how.stack.log.empty")}
            </li>
          ) : (
            events.map((event, index) => (
              <li key={index}>
                {t(locale, `network.tdh.how.stack.log.${event.kind}`, {
                  day: formatInteger(locale, event.day),
                })}
              </li>
            ))
          )}
        </ol>
      </TdhDisclosure>
    </ExplorableFrame>
  );
}

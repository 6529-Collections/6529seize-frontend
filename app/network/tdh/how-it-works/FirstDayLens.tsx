"use client";

import { useMemo, useState } from "react";
import { useFact } from "@/components/explained/facts/FactsProvider";
import { kt } from "@/components/explained/i18n";
import BreakIt, { breakItLabel } from "@/components/explained/lens/BreakIt";
import { Seg } from "@/components/explained/lens/controls";
import Lens, { Readout, RuleValue } from "@/components/explained/lens/Lens";
import Predict from "@/components/explained/lens/Predict";
import { useBreakable } from "@/components/explained/lens/useBreakable";
import StampLine from "@/components/explained/marks/StampLine";
import type { SupportedLocale } from "@/i18n/locales";
import { formatCount } from "@/lib/explained/format";
import {
  secondsOf,
  utcClock,
  utcDay,
  utcLongWeekday,
} from "@/components/explained/layout/time";
import { ht } from "./copy";
import FirstDayTimeline from "./FirstDayTimeline";
import {
  ARRIVAL_KEYS,
  arrivalAt,
  firstDay,
  hoursAndMinutes,
  snapshotTimes,
  type ArrivalKey,
  type FirstDayResult,
  type FirstDayWorld,
} from "./models/firstDay";

/** "28 h 55 min": a span held, in the kit's words. */
function held(locale: SupportedLocale, seconds: number): string {
  return kt(locale, "explained.kit.age.hours", { ...hoursAndMinutes(seconds) });
}

/** The readout's sentence: a bold lead (or none) and the rest. */
function sentence(
  locale: SupportedLocale,
  result: FirstDayResult
): { readonly lead: string | null; readonly rest: string } {
  if (result.sold !== null) {
    return {
      lead: ht(locale, "explained.tdh.how.firstday.saySoldLead", {
        when: `${utcDay(locale, result.sold)}, ${utcClock(locale, result.sold)} UTC`,
      }),
      rest: ht(locale, "explained.tdh.how.firstday.saySold"),
    };
  }
  if (result.first === null) {
    return {
      lead: null,
      rest: ht(locale, "explained.tdh.how.firstday.sayNone"),
    };
  }
  const first = ht(locale, "explained.tdh.how.firstday.sayFirst", {
    date: utcLongWeekday(locale, result.first),
    held: held(locale, result.heldAtFirst ?? 0),
  });
  const before =
    result.heldBefore === null
      ? ""
      : ` ${ht(locale, "explained.tdh.how.firstday.sayBefore", {
          held: held(locale, result.heldBefore),
        })}`;
  return { lead: null, rest: `${first}${before}` };
}

/**
 * Model A: a card ages (TDH-DESIGN.md §5.3), with Guess first. The copy's
 * arrival is the facts layer's constructed example; the day's length is
 * the rule registry's; every day count is the engine's.
 */
export default function FirstDayLens({
  locale,
}: {
  readonly locale: SupportedLocale;
}) {
  const arrived = useFact<string>("example.firstCard.arrivedAt");
  const day = useFact<number>("rules.daySeconds");
  const world: FirstDayWorld | null = useMemo(
    () =>
      arrived && day
        ? { example: secondsOf(arrived.value), dayS: day.value }
        : null,
    [arrived, day]
  );
  const model = useBreakable<{ arrival: ArrivalKey; sold: boolean }>(
    { arrival: "example", sold: false },
    (state) => ({ ...state, sold: true })
  );
  // Guess first: the answer stays hidden until the reader guesses or moves
  // the model, and a guess moves the model to the case it asked about.
  const [shown, setShown] = useState(false);
  if (!world) {
    return null;
  }
  const result = firstDay(world, model.state.arrival, model.state.sold);
  const guess = firstDay(world, "beforeMidnight", false);
  const after = firstDay(world, "afterMidnight", false);
  const { times } = snapshotTimes(world);
  const options = ARRIVAL_KEYS.map((key) => ({
    key,
    at: arrivalAt(world, key),
  }));
  const said = sentence(locale, result);
  const dayText = formatCount(locale, world.dayS);

  return (
    <Lens
      id="firstday"
      label={ht(locale, "explained.tdh.how.firstday.label")}
      question={ht(locale, "explained.tdh.how.firstday.question")}
      broken={model.broken}
      locale={locale}
      predict={
        <Predict
          id="firstday"
          locale={locale}
          question={ht(locale, "explained.tdh.how.firstday.guess", {
            time: `${utcClock(locale, guess.arrived)} UTC`,
            date: utcDay(locale, guess.arrived),
          })}
          options={times.slice(1).map((T) => ({
            label: utcDay(locale, T),
            right: T === guess.first,
          }))}
          onAnswer={() => {
            setShown(true);
            model.set({ arrival: "beforeMidnight", sold: false });
          }}
          answer={ht(locale, "explained.tdh.how.firstday.answer", {
            right: utcDay(locale, guess.first ?? 0),
            early: utcDay(locale, times[1] ?? 0),
            hours: formatCount(locale, world.dayS / 3_600),
            later: `${utcClock(locale, after.arrived)} UTC`,
            after: utcDay(locale, after.first ?? 0),
          })}
        />
      }
      stage={
        <>
          <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-x-3 tw-gap-y-2">
            <span className="tw-text-sm tw-font-semibold tw-text-iron-400">
              {ht(locale, "explained.tdh.how.firstday.arrives")}
            </span>
            <Seg
              label={ht(locale, "explained.tdh.how.firstday.arrivesGroup")}
              attr="at"
              value={model.state.arrival}
              onChange={(key) => {
                const picked = options.find((o) => o.key === key);
                if (picked) {
                  setShown(true);
                  model.set({ arrival: picked.key, sold: false });
                }
              }}
              options={options.map(({ key, at }) => ({
                value: key,
                label: ht(locale, "explained.tdh.how.firstday.option", {
                  date: utcDay(locale, at),
                  time: utcClock(locale, at),
                }),
              }))}
            />
          </div>
          <FirstDayTimeline
            result={result}
            locale={locale}
            label={ht(locale, "explained.tdh.how.firstday.aria", {
              say: said.lead ? `${said.lead} ${said.rest}` : said.rest,
            })}
          />
        </>
      }
      rule={{
        lines: [
          {
            text: ht(locale, "explained.tdh.how.firstday.ruleDays", {
              day: dayText,
            }),
            on: true,
          },
          {
            text: ht(locale, "explained.tdh.how.firstday.ruleT", {
              day: dayText,
            }),
          },
          { text: ht(locale, "explained.tdh.how.firstday.ruleDrawn") },
          { text: ht(locale, "explained.tdh.how.firstday.ruleA") },
          {
            text: (
              <>
                {ht(locale, "explained.tdh.how.firstday.ruleCounts", {
                  one: formatCount(locale, 1),
                })}
                {shown && result.first !== null && (
                  <>
                    {" · "}
                    <RuleValue>{utcDay(locale, result.first)}</RuleValue>
                  </>
                )}
              </>
            ),
          },
        ],
        source: ht(locale, "explained.tdh.how.firstday.ruleSource"),
      }}
      readout={
        <Readout
          big={
            !shown
              ? "?"
              : result.first === null
                ? ht(locale, "explained.tdh.how.firstday.none")
                : utcDay(locale, result.first)
          }
          say={
            !shown ? (
              ht(locale, "explained.tdh.how.firstday.hidden")
            ) : (
              <>
                {said.lead && (
                  <>
                    <b className="tw-font-semibold tw-text-iron-50">
                      {said.lead}
                    </b>{" "}
                  </>
                )}
                {said.rest}
              </>
            )
          }
        />
      }
      breakIt={
        <BreakIt
          id="sellearly"
          pressed={model.broken}
          onToggle={() => {
            setShown(true);
            model.toggleBreak();
          }}
          label={breakItLabel(
            locale,
            ht(locale, "explained.tdh.how.firstday.break")
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
            text: ht(locale, "explained.tdh.how.firstday.tag"),
          }}
        />
      }
    />
  );
}

"use client";

import { useMemo } from "react";
import { useFactSnapshot } from "@/components/explained/facts/FactsProvider";
import BreakIt, { breakItLabel } from "@/components/explained/lens/BreakIt";
import { Seg } from "@/components/explained/lens/controls";
import Lens, { Readout, RuleValue } from "@/components/explained/lens/Lens";
import { useBreakable } from "@/components/explained/lens/useBreakable";
import StampLine from "@/components/explained/marks/StampLine";
import type { SupportedLocale } from "@/i18n/locales";
import { factFromSnapshot } from "@/lib/explained/facts";
import { formatCount } from "@/lib/explained/format";
import ValueTable from "@/components/explained/layout/ValueTable";
import {
  secondsOf,
  utcClock,
  utcDay,
  utcLongWeekday,
} from "@/components/explained/layout/time";
import { ht } from "./copy";
import FirstDayTimeline from "./FirstDayTimeline";
import { CASE_I, caseI, firstCountingResult } from "./models/eligibility";
import { firstDay } from "./models/firstDay";

const B = "tw-font-semibold tw-text-iron-50";

/**
 * Model A, step 3: which cards count (P26 §5.1). The newest cards' first
 * mints are the facts layer's (6529.io's API); the first result that counts
 * each is placed by the rule of whole days, on the same timeline as "A card
 * ages". The Break it is counterexample I, replayed by the engine.
 */
export default function EligibilityLens({
  locale,
  cards,
}: {
  readonly locale: SupportedLocale;
  /** The newest Meme ids, ascending; the server resolved their first mints. */
  readonly cards: readonly number[];
}) {
  const snapshot = useFactSnapshot();
  const day = factFromSnapshot<number>(snapshot, "rules.daySeconds");
  const mints = cards
    .map((id) => ({
      id,
      fact: factFromSnapshot<string>(snapshot, `meme.${id}.firstMint`),
    }))
    .filter((entry) => entry.fact !== null);
  const newest = mints.at(-1)?.id ?? null;
  const model = useBreakable<{ card: number | null }>(
    { card: newest },
    (state) => state
  );
  const cases = useMemo(
    () => ({ before: caseI(false), after: caseI(true) }),
    []
  );
  const found = mints.find((entry) => entry.id === model.state.card);
  if (!day) {
    return (
      <p className="tw-m-0 tw-rounded-xl tw-border tw-border-dashed tw-border-iron-700 tw-p-5 tw-text-[15px] tw-leading-6 tw-text-iron-400">
        {ht(locale, "explained.tdh.how.model.unavailable")}
      </p>
    );
  }
  const n = (value: number) => formatCount(locale, value);
  // The real part needs the newest cards' first mints; when 6529.io could
  // not give them, the lens says so and its Break it still runs.
  const real = found?.fact
    ? (() => {
        const mint = secondsOf(found.fact.value);
        const result = firstDay(
          { example: mint, dayS: day.value },
          "example",
          false
        );
        return {
          id: found.id,
          result,
          from: result.first ?? firstCountingResult(mint, day.value),
          card: `Meme #${found.id}`,
          when: `${utcDay(locale, mint)}, ${utcClock(locale, mint)} UTC`,
        };
      })()
    : null;
  const dayText = formatCount(locale, day.value);
  const broken = model.broken;
  const { before, after } = cases;
  const yesNo = (value: boolean) =>
    ht(
      locale,
      value ? "explained.tdh.how.eligible.yes" : "explained.tdh.how.eligible.no"
    );

  const caseStage = (
    <div className="tw-grid tw-gap-4">
      <p className="tw-m-0 tw-text-[15px] tw-leading-6 tw-text-iron-300">
        <b className={B}>{ht(locale, "explained.tdh.how.eligible.iLead")}</b>{" "}
        {ht(locale, "explained.tdh.how.eligible.iSetup", {
          late: CASE_I.late,
          lateCopies: n(CASE_I.lateCopies),
          early: CASE_I.early,
          earlyCopies: n(CASE_I.earlyCopies),
          days: n(CASE_I.earlyDays),
          inserted: n(CASE_I.inserted),
        })}
      </p>
      <ValueTable
        caption={ht(locale, "explained.tdh.how.eligible.iCaption")}
        head={[
          "",
          ht(locale, "explained.tdh.how.eligible.iWithout"),
          ht(locale, "explained.tdh.how.eligible.iWith"),
        ]}
        rows={[
          {
            key: "counts",
            label: ht(locale, "explained.tdh.how.eligible.iCounts", {
              late: CASE_I.late,
            }),
            values: [yesNo(before.lateCounts), yesNo(after.lateCounts)],
          },
          {
            key: "H",
            label: ht(locale, "explained.tdh.how.eligible.iH"),
            values: [n(before.H), n(after.H)],
          },
          {
            key: "A",
            label: ht(locale, "explained.tdh.how.eligible.iA", {
              late: CASE_I.late,
            }),
            values: [n(before.aBalance), n(after.aBalance)],
          },
          {
            key: "Y",
            label: ht(locale, "explained.tdh.how.eligible.iY"),
            values: [n(before.yFinal), n(after.yFinal)],
            tone: "on",
          },
        ]}
      />
    </div>
  );
  const missingStage = (
    <p className="tw-m-0 tw-rounded-xl tw-border tw-border-dashed tw-border-iron-700 tw-p-5 tw-text-[15px] tw-leading-6 tw-text-iron-400">
      {ht(locale, "explained.tdh.how.eligible.unavailable")}
    </p>
  );
  const realStage = real && (
    <>
      <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-x-3 tw-gap-y-2">
        <span className="tw-text-sm tw-font-semibold tw-text-iron-400">
          {ht(locale, "explained.tdh.how.eligible.pick")}
        </span>
        <Seg
          label={ht(locale, "explained.tdh.how.eligible.pickGroup")}
          attr="card"
          value={String(real.id)}
          onChange={(value) => model.set({ card: Number(value) })}
          options={mints.map((entry) => ({
            value: String(entry.id),
            label: `#${entry.id}`,
          }))}
        />
      </div>
      <FirstDayTimeline
        result={real.result}
        locale={locale}
        label={ht(locale, "explained.tdh.how.eligible.aria", {
          card: real.card,
          when: real.when,
          date: utcDay(locale, real.from),
        })}
        startText={(at) =>
          ht(locale, "explained.tdh.how.eligible.mintedAt", { when: at })
        }
      />
    </>
  );
  let stage = realStage ?? missingStage;
  if (broken) stage = caseStage;

  return (
    <Lens
      id="eligible"
      label={ht(locale, "explained.tdh.how.eligible.label")}
      question={ht(locale, "explained.tdh.how.eligible.question")}
      broken={broken}
      locale={locale}
      stage={stage}
      rule={{
        lines: [
          {
            text: ht(locale, "explained.tdh.how.eligible.ruleMemes", {
              day: dayText,
            }),
            on: !broken,
          },
          { text: ht(locale, "explained.tdh.how.eligible.ruleNextGen") },
          {
            text: ht(locale, "explained.tdh.how.eligible.ruleFirstMint"),
            on: broken,
          },
          ...(broken || real === null
            ? []
            : [
                {
                  text: (
                    <>
                      {`#${real.id}: firstMint = `}
                      <RuleValue>{real.when}</RuleValue>
                    </>
                  ),
                },
              ]),
          { text: ht(locale, "explained.tdh.how.eligible.ruleCount") },
        ],
        source: ht(locale, "explained.tdh.how.eligible.ruleSource"),
      }}
      readout={
        broken ? (
          <Readout
            big={ht(locale, "explained.tdh.how.eligible.iBig", {
              before: n(before.yFinal),
              after: n(after.yFinal),
            })}
            say={
              <>
                <b className={B}>
                  {ht(locale, "explained.tdh.how.eligible.sayILead")}
                </b>{" "}
                {ht(locale, "explained.tdh.how.eligible.sayI", {
                  days: n(CASE_I.earlyDays),
                })}
              </>
            }
          />
        ) : (
          <Readout
            big={
              real === null
                ? ht(locale, "explained.tdh.how.firstday.none")
                : utcDay(locale, real.from)
            }
            say={
              real === null
                ? ht(locale, "explained.tdh.how.eligible.sayUnavailable")
                : ht(locale, "explained.tdh.how.eligible.say", {
                    card: real.card,
                    when: real.when,
                    date: utcLongWeekday(locale, real.from),
                  })
            }
          />
        )
      }
      breakIt={
        <BreakIt
          id="mintearly"
          pressed={broken}
          onToggle={model.toggleBreak}
          label={breakItLabel(
            locale,
            ht(locale, "explained.tdh.how.eligible.break", {
              days: n(CASE_I.earlyDays),
            })
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
          tag={
            broken || real === null
              ? {
                  kind: "example",
                  text: ht(locale, "explained.tdh.how.eligible.tagCase"),
                }
              : {
                  kind: "real",
                  text: ht(locale, "explained.tdh.how.eligible.tagReal"),
                }
          }
        />
      }
    />
  );
}

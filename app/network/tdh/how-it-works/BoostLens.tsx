"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useFact } from "@/components/explained/facts/FactsProvider";
import BoostFigure from "@/components/explained/figures/BoostFigure";
import BreakIt, { breakItLabel } from "@/components/explained/lens/BreakIt";
import { Stepper } from "@/components/explained/lens/controls";
import Lens, { Readout, RuleValue } from "@/components/explained/lens/Lens";
import { useBreakable } from "@/components/explained/lens/useBreakable";
import StampLine from "@/components/explained/marks/StampLine";
import { EX_LINK } from "@/components/explained/tokens";
import type { SupportedLocale } from "@/i18n/locales";
import { formatCents, formatCount } from "@/lib/explained/format";
import { formatDecimal } from "@/components/explained/layout/numbers";
import Toggles from "@/components/explained/layout/Toggles";
import { ht } from "./copy";
import {
  BOOST_START,
  MAX_SETS,
  boostOf,
  boostRuleValues,
  extraSetsLimit,
  gradientLimit,
  payingSeasons,
  type BoostState,
} from "./models/boost";

const MICRO = 1_000_000;

/**
 * Model C: the boost ladder (TDH-DESIGN.md §5.6). The boost and its parts
 * are the engine's (P26 §8.3) on the real number of eligible Memes; today's
 * highest and the rule's ceiling are the facts layer's. Break it adds one
 * Gradient past the registry's limit.
 */
export default function BoostLens({
  locale,
}: {
  readonly locale: SupportedLocale;
}) {
  const count = useFact<number>("memes.count");
  const todayMax = useFact<number>("engine.boost.todayMax");
  const ceiling = useFact<number>("engine.boost.ceiling");
  const bonus = useFact<number>("rules.gradientBonus");
  const limit = gradientLimit();
  const model = useBreakable<BoostState>(BOOST_START, (state) => ({
    ...state,
    gradients: limit + 1,
  }));
  const nMemes = count?.value ?? null;
  const result = useMemo(
    () => (nMemes === null ? null : boostOf(model.state, nMemes)),
    [model.state, nMemes]
  );
  if (!result || nMemes === null || !todayMax || !ceiling || !bonus) {
    return (
      <p className="tw-m-0 tw-rounded-xl tw-border tw-border-dashed tw-border-iron-700 tw-p-5 tw-text-[15px] tw-leading-6 tw-text-iron-400">
        {ht(locale, "explained.tdh.how.model.unavailable")}
      </p>
    );
  }
  const state = model.state;
  // Past the limit is the broken state, however the reader got there: the
  // Break it, or the stepper's last step.
  const broken = state.gradients > limit;
  const toggleBreak = () => {
    if (broken && !model.broken) model.set({ gradients: limit });
    else model.toggleBreak();
  };
  const paying = payingSeasons(nMemes);
  const p = result.parts;
  const parts = [
    {
      label: ht(locale, "explained.tdh.how.boost.partSeasons"),
      value: p.seasons,
    },
    {
      label: ht(locale, "explained.tdh.how.boost.partSets"),
      value: p.extraSets,
    },
    {
      label: ht(locale, "explained.tdh.how.boost.partGenesis"),
      value: p.genesis,
    },
    {
      label: ht(locale, "explained.tdh.how.boost.partNakamoto"),
      value: p.nakamoto,
    },
    {
      label: ht(locale, "explained.tdh.how.boost.partGradients"),
      value: p.gradients,
    },
  ].map((part) => ({ ...part, value: part.value / MICRO }));
  const B = "tw-font-semibold tw-text-iron-50";
  const rv = boostRuleValues();
  const dec = (value: number, digits = 2) =>
    formatDecimal(locale, value, digits);
  const singles =
    state.sets === 0 && state.seasons < 1 && (state.genesis || state.nakamoto);
  const ruleLines = [
    {
      text: (
        <>
          {ht(locale, "explained.tdh.how.boost.ruleSets")}
          {" = "}
          <RuleValue>{formatCount(locale, state.sets)}</RuleValue>
        </>
      ),
    },
    {
      text: ht(locale, "explained.tdh.how.boost.ruleSetsOn", {
        season: dec(rv.season),
      }),
      on: state.sets > 0,
    },
    {
      // P26 §8.3's notation, the same in every language.
      text: `ADD(s) = ${dec(rv.first)} × (1 − q^(s−1)) ÷ (1 − q), q = ${dec(rv.q, 4)}`,
    },
    {
      text: ht(locale, "explained.tdh.how.boost.ruleSeasons", {
        season: dec(rv.season),
      }),
      on: state.sets === 0 && state.seasons > 0,
    },
    {
      text: ht(locale, "explained.tdh.how.boost.ruleSingles", {
        genesis: dec(rv.genesis),
        nakamoto: dec(rv.nakamoto),
      }),
      on: singles,
    },
    {
      text: ht(locale, "explained.tdh.how.boost.ruleGradients", {
        gradient: dec(rv.gradient),
        max: formatCount(locale, rv.gradientMax),
      }),
      on: state.gradients > 0,
    },
    {
      text: (
        <>
          {ht(locale, "explained.tdh.how.boost.ruleBeta")}
          {" = "}
          <RuleValue>{formatCents(locale, result.beta / 100)}</RuleValue>
        </>
      ),
      on: true,
    },
  ];

  let say;
  if (broken) {
    say = (
      <>
        <b className={B}>{ht(locale, "explained.tdh.how.boost.sayGradLead")}</b>{" "}
        {ht(locale, "explained.tdh.how.boost.sayGrad", {
          gradient: formatCents(locale, bonus.value),
          max: formatCount(locale, limit),
        })}
      </>
    );
  } else if (state.sets > 0) {
    say = ht(locale, "explained.tdh.how.boost.saySets", {
      count: formatCount(locale, result.paidSeasons.length),
      extra: formatDecimal(locale, extraSetsLimit(), 3),
    });
  } else if ((state.genesis || state.nakamoto) && state.seasons < 1) {
    say = ht(locale, "explained.tdh.how.boost.saySingles");
  } else {
    say = ht(locale, "explained.tdh.how.boost.say");
  }

  return (
    <Lens
      id="boost"
      label={ht(locale, "explained.tdh.how.boost.label")}
      question={ht(locale, "explained.tdh.how.boost.question")}
      broken={broken}
      locale={locale}
      stage={
        <>
          <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-x-6 tw-gap-y-3">
            <Stepper
              label={ht(locale, "explained.tdh.how.boost.seasons")}
              value={state.seasons}
              min={0}
              max={paying}
              onChange={(seasons) => model.set({ seasons })}
              locale={locale}
              attr="seasons"
            />
            <Stepper
              label={ht(locale, "explained.tdh.how.boost.sets")}
              value={state.sets}
              min={0}
              max={MAX_SETS}
              onChange={(sets) => model.set({ sets })}
              locale={locale}
              attr="sets"
            />
            <Stepper
              label={ht(locale, "explained.tdh.how.boost.gradients")}
              value={state.gradients}
              min={0}
              max={limit + 1}
              onChange={(gradients) => model.set({ gradients })}
              locale={locale}
              attr="gradients"
            />
          </div>
          <div className="tw-mt-3">
            <Toggles
              label={ht(locale, "explained.tdh.how.boost.singles")}
              options={[
                {
                  key: "genesis",
                  label: ht(locale, "explained.tdh.how.boost.genesis"),
                },
                {
                  key: "nakamoto",
                  label: ht(locale, "explained.tdh.how.boost.nakamoto"),
                },
              ]}
              on={{ genesis: state.genesis, nakamoto: state.nakamoto }}
              onToggle={(key) =>
                key === "genesis"
                  ? model.set({ genesis: !state.genesis })
                  : model.set({ nakamoto: !state.nakamoto })
              }
            />
          </div>
          <div className="tw-mt-6">
            <BoostFigure
              parts={parts}
              betaCents={result.beta}
              todayMaxCents={Math.round(todayMax.value * 100)}
              ceilingCents={Math.round(ceiling.value * 100)}
              locale={locale}
              hatchId="how-boost-band"
            />
          </div>
        </>
      }
      rule={{
        lines: ruleLines,
        source: ht(locale, "explained.tdh.how.boost.ruleSource"),
      }}
      readout={
        <Readout
          big={formatCents(locale, result.beta / 100)}
          unit={ht(locale, "explained.tdh.how.boost.unit")}
          say={say}
        />
      }
      breakIt={
        <BreakIt
          id="gradient"
          pressed={broken}
          onToggle={toggleBreak}
          label={breakItLabel(
            locale,
            ht(locale, "explained.tdh.how.boost.break")
          )}
        />
      }
      stamp={
        <span className="tw-flex tw-flex-wrap tw-items-center tw-gap-x-4 tw-gap-y-1.5">
          <StampLine
            locale={locale}
            marks={[
              {
                maturity: "live",
                label: ht(locale, "explained.tdh.how.boost.stamp"),
              },
            ]}
          />
          <Link
            className={`${EX_LINK} tw-text-[13px] tw-font-semibold tw-leading-5`}
            href="/network/tdh/historic-boosts"
          >
            {ht(locale, "explained.tdh.how.boost.history")}
          </Link>
        </span>
      }
    />
  );
}

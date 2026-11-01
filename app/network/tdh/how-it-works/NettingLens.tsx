"use client";

import { useMemo } from "react";
import BreakIt, { breakItLabel } from "@/components/explained/lens/BreakIt";
import { Seg } from "@/components/explained/lens/controls";
import Lens, { Readout } from "@/components/explained/lens/Lens";
import { useBreakable } from "@/components/explained/lens/useBreakable";
import StampLine from "@/components/explained/marks/StampLine";
import type { SupportedLocale } from "@/i18n/locales";
import { formatCents, formatCount } from "@/lib/explained/format";
import { ht } from "./copy";
import { CASE_H, caseH, roundTripDays } from "./models/netting";

type Mode = "net" | "steps";
const B = "tw-font-semibold tw-text-iron-50";

/**
 * Model A, step 5: inside one transaction (TDH-DESIGN.md §5.4). The days
 * a copy keeps after a round trip, and counterexample H, are computed by
 * the TDH v1.4 engine on constructed inputs; nothing is typed.
 */
export default function NettingLens({
  locale,
}: {
  readonly locale: SupportedLocale;
}) {
  const values = useMemo(
    () => ({
      net: roundTripDays(true),
      steps: roundTripDays(false),
      before: caseH(false),
      after: caseH(true),
    }),
    []
  );
  const model = useBreakable<{ mode: Mode }>({ mode: "net" }, (s) => s);
  const caseOn = model.broken;
  const net = model.state.mode === "net";
  const days = net ? values.net : values.steps;
  const n = (value: number) => formatCount(locale, value);

  let stage;
  let big;
  let say;
  if (caseOn) {
    const { before, after } = values;
    stage = (
      <div className="tw-grid tw-gap-3 tw-text-[15px] tw-leading-6 tw-text-iron-300">
        <p className="tw-m-0">
          <b className={B}>
            {ht(locale, "explained.tdh.how.netting.hOneLead")}
          </b>{" "}
          {ht(locale, "explained.tdh.how.netting.hOne", {
            m1: CASE_H.meme1,
            m2: CASE_H.meme2,
            n: n(CASE_H.inserted),
          })}
        </p>
        <p className="tw-m-0">
          {ht(locale, "explained.tdh.how.netting.hTwo", {
            mintedBefore: n(before.minted1),
            mintedAfter: n(after.minted1),
            hBefore: n(before.H),
            hAfter: n(after.H),
            m2: CASE_H.meme2,
            rateBefore: formatCents(locale, before.rate2 / 100),
            rateAfter: formatCents(locale, after.rate2 / 100),
            bBefore: n(before.bFinal),
            bAfter: n(after.bFinal),
          })}
        </p>
      </div>
    );
    big = ht(locale, "explained.tdh.how.netting.hBig", {
      before: n(before.bFinal),
      after: n(after.bFinal),
    });
    say = (
      <>
        <b className={B}>{ht(locale, "explained.tdh.how.netting.sayHLead")}</b>{" "}
        {ht(locale, "explained.tdh.how.netting.sayH")}
      </>
    );
  } else {
    const rows = [
      ht(locale, "explained.tdh.how.netting.stepOut"),
      ht(locale, "explained.tdh.how.netting.stepBack"),
    ];
    stage = (
      <>
        <ol className="tw-m-0 tw-list-none tw-p-0">
          {rows.map((row, index) => (
            <li
              key={row}
              className="tw-grid tw-grid-cols-[28px_minmax(0,1fr)_auto] tw-items-center tw-gap-2.5 tw-border-0 tw-border-b tw-border-solid tw-border-iron-900 tw-py-2"
            >
              <span className="tw-text-iron-400">{n(index + 1)}</span>
              <span className="tw-text-iron-50">{row}</span>
              <span className="tw-text-right tw-text-iron-400">
                {ht(locale, "explained.tdh.how.netting.copies", {
                  count: n(1),
                })}
              </span>
            </li>
          ))}
        </ol>
        <p className="tw-m-0 tw-mt-3 tw-text-[15px] tw-leading-6 tw-text-iron-300">
          {ht(locale, "explained.tdh.how.netting.netLead")}{" "}
          <b className={B}>
            {ht(locale, "explained.tdh.how.netting.netValues", {
              a: n(0),
              m: n(0),
            })}
          </b>{" "}
          {ht(
            locale,
            net
              ? "explained.tdh.how.netting.netSay"
              : "explained.tdh.how.netting.stepsSay"
          )}
        </p>
      </>
    );
    big = ht(locale, "explained.tdh.how.netting.days", { days: n(days) });
    say = net ? (
      <>
        <b className={B}>
          {ht(locale, "explained.tdh.how.netting.sayNetLead")}
        </b>{" "}
        {ht(locale, "explained.tdh.how.netting.sayNet", { days: n(days) })}
      </>
    ) : (
      <>
        <b className={B}>
          {ht(locale, "explained.tdh.how.netting.sayStepsLead")}
        </b>{" "}
        {ht(locale, "explained.tdh.how.netting.saySteps")}
      </>
    );
  }

  return (
    <Lens
      id="netting"
      label={ht(locale, "explained.tdh.how.netting.label")}
      question={ht(locale, "explained.tdh.how.netting.question")}
      broken={caseOn}
      locale={locale}
      stage={
        <>
          <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-x-3 tw-gap-y-2">
            <span className="tw-text-sm tw-font-semibold tw-text-iron-400">
              {ht(locale, "explained.tdh.how.netting.count")}
            </span>
            <Seg
              label={ht(locale, "explained.tdh.how.netting.countGroup")}
              attr="mode"
              value={caseOn ? null : model.state.mode}
              onChange={(mode) => model.set({ mode })}
              options={[
                {
                  value: "net",
                  label: ht(locale, "explained.tdh.how.netting.net"),
                },
                {
                  value: "steps",
                  label: ht(locale, "explained.tdh.how.netting.steps"),
                },
              ]}
            />
          </div>
          <div className="tw-mt-4">{stage}</div>
        </>
      }
      rule={{
        lines: [
          {
            text: ht(locale, "explained.tdh.how.netting.ruleNet"),
            on: net && !caseOn,
          },
          { text: ht(locale, "explained.tdh.how.netting.ruleSides") },
          { text: ht(locale, "explained.tdh.how.netting.rulePairs") },
          {
            text: ht(locale, "explained.tdh.how.netting.ruleReplay"),
            on: !net && !caseOn,
          },
          {
            text: ht(locale, "explained.tdh.how.netting.ruleMinted"),
            on: caseOn,
          },
        ],
        source: ht(locale, "explained.tdh.how.netting.ruleSource"),
      }}
      readout={<Readout big={big} say={say} />}
      breakIt={
        <BreakIt
          id="mintburn"
          pressed={caseOn}
          onToggle={model.toggleBreak}
          label={breakItLabel(
            locale,
            ht(locale, "explained.tdh.how.netting.break")
          )}
        />
      }
      stamp={
        <StampLine
          locale={locale}
          marks={[
            { kind: "decided", refText: "D131" },
            {
              kind: "proved",
              refText: ht(locale, "explained.tdh.how.netting.stampProved"),
            },
          ]}
        />
      }
    />
  );
}

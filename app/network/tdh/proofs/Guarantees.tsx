"use client";

import Link from "next/link";
import { useState } from "react";
import { useFactSnapshot } from "@/components/explained/facts/FactsProvider";
import { fill } from "@/components/explained/i18n";
import BreakIt, { breakItLabel } from "@/components/explained/lens/BreakIt";
import { Seg } from "@/components/explained/lens/controls";
import Lens, { Readout } from "@/components/explained/lens/Lens";
import { Glyph } from "@/components/explained/marks/glyphs";
import StampLine from "@/components/explained/marks/StampLine";
import { EX_LINK, EX_MOTION } from "@/components/explained/tokens";
import type { SupportedLocale } from "@/i18n/locales";
import { fmt, isFact, type FactId } from "@/lib/explained/facts";
import { CONTRACT_CHECKS, PROGRAM_RULE } from "./_lib/checks";
import { k } from "./_lib/copy";
import { pageFacts } from "./_lib/facts";
import { rich } from "@/components/explained/rich";
import {
  LAYERS,
  SCENARIOS,
  layerStates,
  scenarioById,
  type Layer,
  type LayerState,
  type ScenarioId,
} from "./_lib/scenarios";

/**
 * Model · What a proof guarantees (TDH-DESIGN.md §5.12): pick what goes
 * wrong, and the model follows it through the layers a day passes on its
 * way to the D128 contract's record, lighting the layer that stops it, the
 * contract's check that does, and the test that shows it. Break it: a
 * mistake in the rules both programs follow, which every layer lets
 * through. The scenarios are data (`_lib/scenarios.ts`), tested against the
 * contract's record.
 */

const LAYER_TITLE = {
  program: "layer.program",
  proof: "layer.proof",
  second: "layer.second",
  contract: "layer.contract",
  recorded: "layer.recorded",
} as const;

const LAYER_SUB = {
  program: "layer.programSub",
  proof: "layer.proofSub",
  second: "layer.secondSub",
  contract: "layer.contractSub",
  recorded: "layer.recordedSub",
} as const;

const STATE_WORD = {
  passed: "state.passed",
  differs: "state.differs",
  stops: "state.stops",
  unreached: "state.unreached",
  wrong: "state.wrong",
} as const;

const BOX: Record<LayerState, string> = {
  passed: "tw-border-solid tw-border-iron-800 tw-bg-iron-950",
  differs: "tw-border-solid tw-border-primary-400/45 tw-bg-primary-400/[0.07]",
  stops: "tw-border-solid tw-border-green/55 tw-bg-green/[0.09]",
  unreached: "tw-border-dashed tw-border-iron-800",
  wrong: "tw-border-solid tw-border-error/60 tw-bg-error/[0.09]",
};

const STATE_TONE: Record<LayerState, string> = {
  passed: "tw-text-iron-400",
  differs: "tw-text-primary-300",
  stops: "tw-text-green",
  unreached: "tw-text-iron-400",
  wrong: "tw-text-error",
};

function StateGlyph({
  state,
  evidence,
}: {
  readonly state: LayerState;
  readonly evidence: "tested" | "decided";
}) {
  if (state === "stops") {
    return <Glyph kind={evidence} className="tw-size-3.5" />;
  }
  if (state === "wrong") {
    return <Glyph kind="shownFalse" className="tw-size-3.5" />;
  }
  return (
    <svg viewBox="0 0 14 14" className="tw-size-3.5" aria-hidden="true">
      <path
        d="M2 7h8M7 3.5 10.5 7 7 10.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Layers({
  states,
  evidence,
  locale,
}: {
  readonly states: Record<Layer, LayerState>;
  readonly evidence: "tested" | "decided";
  readonly locale: SupportedLocale;
}) {
  return (
    <ol
      className="tw-m-0 tw-mt-5 tw-grid tw-list-none tw-gap-2 tw-p-0"
      aria-label={fill(locale, k("guard.layers"))}
      data-layers=""
    >
      {LAYERS.map((layer, index) => {
        const state = states[layer];
        return (
          <li
            key={layer}
            className={`tw-relative tw-grid tw-grid-cols-[minmax(0,1fr)] tw-items-center tw-gap-x-4 tw-gap-y-1.5 tw-rounded-xl tw-border tw-px-4 tw-py-3 xl:tw-grid-cols-[minmax(0,1fr)_auto] ${BOX[state]} ${EX_MOTION.model}`}
            data-layer={layer}
            data-state={state}
          >
            <span className="tw-flex tw-min-w-0 tw-items-baseline tw-gap-3">
              <span
                className="tw-w-4 tw-flex-none tw-text-[13px] tw-font-semibold tw-text-iron-400"
                aria-hidden="true"
              >
                {index + 1}
              </span>
              <span className="tw-min-w-0">
                <b
                  className={`tw-block tw-text-[15px] tw-font-semibold tw-leading-5 ${state === "unreached" ? "tw-text-iron-400" : "tw-text-iron-50"}`}
                >
                  {fill(locale, k(LAYER_TITLE[layer]))}
                </b>
                <span className="tw-block tw-text-[13px] tw-leading-[18px] tw-text-iron-400">
                  {fill(locale, k(LAYER_SUB[layer]))}
                </span>
              </span>
            </span>
            <span
              className={`tw-inline-flex tw-items-center tw-gap-1.5 tw-whitespace-nowrap tw-pl-7 tw-text-[13px] tw-font-semibold xl:tw-pl-0 ${STATE_TONE[state]}`}
            >
              <StateGlyph state={state} evidence={evidence} />
              {fill(locale, k(STATE_WORD[state]))}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

const REFUSED = "big.refused";

const BIG = {
  total: REFUSED,
  log: "big.noProof",
  blocks: REFUSED,
  bugA: REFUSED,
  flaw: "big.notAlone",
  skip: REFUSED,
  rule: REFUSED,
} as const;

export default function Guarantees({
  locale,
}: {
  readonly locale: SupportedLocale;
}) {
  const snapshot = useFactSnapshot();
  const facts = pageFacts(snapshot, locale);
  const [picked, setPicked] = useState<ScenarioId>("total");
  const [broken, setBroken] = useState(false);
  const scenario = scenarioById(picked);
  const states = layerStates(scenario, broken);

  const text = (id: FactId): string => {
    const entry = facts.entry(id);
    return entry && isFact(entry) ? fmt(entry, locale) : "";
  };
  const fillRule = (rule: string) =>
    rule
      .replace("{bytes}", text("proofs.statement.bytes"))
      .replace("{words}", text("proofs.statement.words"));

  const say = broken ? (
    <>
      {fill(locale, k("say.broken"))}{" "}
      <Link href="/network/tdh/formal" className={EX_LINK}>
        {fill(locale, k("guard.toSure"))}
      </Link>
    </>
  ) : (
    rich(locale, k(`say.${picked}`), {
      bytes: facts.print("proofs.statement.bytes"),
      words: facts.print("proofs.statement.words"),
      id: facts.print("proofs.sp1Advisory.id"),
      earlier: facts.print("proofs.sp1Advisory.earlier", "long"),
    })
  );

  const lines = [
    { id: "program", text: `P  ${PROGRAM_RULE}` },
    ...CONTRACT_CHECKS.map((check, index) => ({
      id: check.id,
      text: `${index + 1}  ${fillRule(check.rule)}`,
    })),
  ];

  return (
    <Lens
      id="guard"
      label={fill(locale, k("guard.label"))}
      question={fill(locale, k("guard.question"))}
      broken={broken}
      locale={locale}
      stage={
        <div>
          <Seg
            label={fill(locale, k("guard.pick"))}
            attr="scenario"
            value={broken ? null : picked}
            onChange={(next) => {
              setBroken(false);
              setPicked(next);
            }}
            options={SCENARIOS.map((entry) => ({
              value: entry.id,
              label: fill(locale, k(`guard.s.${entry.id}`)),
            }))}
          />
          <Layers
            states={states}
            evidence={scenario.evidence}
            locale={locale}
          />
        </div>
      }
      rule={{
        lines: lines.map((line) => ({
          text: line.text,
          on: !broken && line.id === scenario.line,
        })),
        source: rich(locale, k("guard.ruleSource")),
      }}
      readout={
        <Readout
          big={fill(locale, k(broken ? "big.wrong" : BIG[picked]))}
          say={say}
        />
      }
      breakIt={
        <BreakIt
          id="rules"
          pressed={broken}
          onToggle={() => setBroken((value) => !value)}
          label={breakItLabel(locale, fill(locale, k("guard.breakEdge")))}
        />
      }
      stamp={
        <StampLine
          locale={locale}
          marks={[
            { kind: "decided", refText: "D128" },
            { maturity: "built" },
            { kind: "tested" },
          ]}
        />
      }
    />
  );
}

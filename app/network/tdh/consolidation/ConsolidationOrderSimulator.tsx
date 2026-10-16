"use client";

import type { ConsolidationLimits } from "@/helpers/consolidationPolicy";

import { useMemo, useState } from "react";
import { formatInteger, formatList } from "@/i18n/format";
import type { SupportedLocale } from "@/i18n/locales";
import { t, type MessageKey } from "@/i18n/messages";
import { TDH_BUTTON } from "../shared/tdhStyles";
import { TDH_PANEL, TDH_TEXT } from "../TDHSection";
import {
  matchesSimulatedScenario,
  SIMULATED_SIGNERS,
  type SimulatedWallet,
  simulateAddingFourthWallet,
} from "./consolidation-order-simulation";

const SIGNER_LABELS: Record<SimulatedWallet, MessageKey> = {
  A: "network.tdhConsolidation.order.signerA",
  B: "network.tdhConsolidation.order.signerB",
  C: "network.tdhConsolidation.order.signerC",
  D: "network.tdhConsolidation.order.signerD",
};
const SAFE_ORDER: readonly SimulatedWallet[] = ["A", "B", "C", "D"];
const UNSAFE_ORDER: readonly SimulatedWallet[] = ["D", "A", "B", "C"];
/** The explorables' shared button, as on How it works, left-aligned. */
const BUTTON = `${TDH_BUTTON} tw-justify-start tw-text-left`;

const START_GROUPS: readonly (readonly SimulatedWallet[])[] = [
  ["A", "B", "C"],
  ["D"],
];
/**
 * The same four wallets under TDH-v1 (tdh-v1.0, P26 §6.3), when D's links
 * were confirmed D–A, then D–B, then D–C: an identity of three from the
 * newest link, and A on its own.
 */
const TDH_V1_GROUPS: readonly (readonly SimulatedWallet[])[] = [
  ["B", "C", "D"],
  ["A"],
];

/** A group's outline: a lone wallet dashed; a group amber while split. */
function groupTone(group: readonly SimulatedWallet[], split: boolean): string {
  if (group.length < 2) {
    return "tw-border-dashed tw-border-iron-600";
  }
  return split
    ? "tw-border-amber-400/60 tw-bg-amber-400/[0.06]"
    : "tw-border-primary-400/60 tw-bg-primary-500/10";
}

/**
 * The wallets as they are grouped, drawn: each group an outlined box of
 * wallet discs, so a split shows as boxes coming apart and the join as one
 * box of four. Decorative; the groups are also said in words.
 */
function GroupChips({
  groups,
  split,
}: {
  readonly groups: readonly (readonly SimulatedWallet[])[];
  readonly split: boolean;
}) {
  return (
    <span aria-hidden="true" className="tw-flex tw-flex-wrap tw-gap-2">
      {groups.map((group) => (
        <span
          key={group.join("")}
          className={`tw-inline-flex tw-gap-1 tw-rounded-full tw-border tw-border-solid tw-p-1 ${groupTone(group, split)}`}
        >
          {group.map((wallet) => (
            <span
              key={wallet}
              className="tw-flex tw-size-8 tw-items-center tw-justify-center tw-rounded-full tw-bg-iron-800 tw-text-sm tw-font-semibold tw-text-iron-50"
            >
              {wallet}
            </span>
          ))}
        </span>
      ))}
    </span>
  );
}

export default function ConsolidationOrderSimulator({
  locale,
  activationDate,
  limits,
}: {
  readonly locale: SupportedLocale;
  readonly activationDate: string;
  readonly limits: ConsolidationLimits | null;
}) {
  const [order, setOrder] = useState<readonly SimulatedWallet[]>([]);
  const steps = useMemo(
    () => (limits ? simulateAddingFourthWallet(order, limits) : []),
    [order, limits]
  );
  const remaining = SIMULATED_SIGNERS.filter(
    (signer) => !order.includes(signer)
  );
  const splitCount = steps.filter(
    (step) => !step.existingMembersTogether
  ).length;
  const complete = order.length === SIMULATED_SIGNERS.length;

  const describeGroups = (groups: readonly (readonly SimulatedWallet[])[]) =>
    formatList(
      locale,
      groups.map((group) => group.join(" + ")),
      { type: "conjunction", style: "long" }
    );

  const describeState = (step: (typeof steps)[number]) =>
    step.existingMembersTogether
      ? t(locale, "network.tdhConsolidation.order.together")
      : t(locale, "network.tdhConsolidation.order.split");
  const lastStep = steps.at(-1);

  if (!limits)
    return (
      <output className={`tw-block ${TDH_TEXT}`}>
        {t(locale, "network.tdhConsolidation.policy.pendingLimits")}
      </output>
    );
  // The walkthrough is written for three members and a fourth wallet. With
  // other limits it would mislead, so the section says why it is not shown.
  if (!matchesSimulatedScenario(limits))
    return (
      <p className={TDH_TEXT}>
        {t(locale, "network.tdhConsolidation.order.unavailable")}
      </p>
    );

  return (
    <div className={`${TDH_PANEL} tw-space-y-5 tw-p-5`}>
      <p className={TDH_TEXT}>
        {t(locale, "network.tdhConsolidation.order.activation", {
          date: activationDate,
        })}
      </p>
      <div className="tw-flex tw-flex-wrap tw-gap-2">
        <button
          type="button"
          className={BUTTON}
          onClick={() => setOrder(SAFE_ORDER)}
        >
          {t(locale, "network.tdhConsolidation.order.presetSafe")}
        </button>
        <button
          type="button"
          className={BUTTON}
          onClick={() => setOrder(UNSAFE_ORDER)}
        >
          {t(locale, "network.tdhConsolidation.order.presetUnsafe")}
        </button>
        {order.length > 0 && (
          <button type="button" className={BUTTON} onClick={() => setOrder([])}>
            {t(locale, "network.tdhConsolidation.order.reset")}
          </button>
        )}
      </div>

      {!complete && (
        <fieldset className="tw-m-0 tw-min-w-0 tw-border-0 tw-p-0">
          <legend className="tw-mb-3 tw-p-0 tw-text-sm tw-font-medium tw-text-iron-100">
            {t(locale, "network.tdhConsolidation.order.pick")}
          </legend>
          <div className="tw-grid tw-grid-cols-1 tw-gap-2 sm:tw-grid-cols-2">
            {remaining.map((signer) => (
              <button
                key={signer}
                type="button"
                className={BUTTON}
                onClick={() => setOrder([...order, signer])}
              >
                {t(locale, SIGNER_LABELS[signer])}
              </button>
            ))}
          </div>
        </fieldset>
      )}

      <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-x-4 tw-gap-y-2 tw-rounded-lg tw-bg-iron-950 tw-px-3 tw-py-3">
        <span className="tw-text-sm tw-font-medium tw-text-iron-300">
          {lastStep === undefined
            ? t(locale, "network.tdhConsolidation.order.start")
            : t(locale, "network.tdhConsolidation.order.after", {
                wallet: lastStep.signer,
              })}
        </span>
        <GroupChips
          groups={lastStep?.groups ?? START_GROUPS}
          split={lastStep !== undefined && !lastStep.existingMembersTogether}
        />
      </div>

      <p className={TDH_TEXT}>
        {order.length > 0
          ? t(locale, "network.tdhConsolidation.order.chosen", {
              order: formatList(locale, order, {
                type: "unit",
                style: "short",
              }),
            })
          : t(locale, "network.tdhConsolidation.order.none")}
      </p>

      {steps.length > 0 && (
        <ol className="tw-m-0 tw-list-none tw-space-y-3 tw-p-0">
          {steps.map((step, index) => (
            <li
              key={step.signer}
              className="tw-grid tw-grid-cols-[2rem_minmax(0,1fr)] tw-gap-3"
            >
              <span className="tw-flex tw-size-8 tw-items-center tw-justify-center tw-rounded-full tw-bg-iron-800 tw-text-sm tw-font-medium tw-text-iron-200">
                {formatInteger(locale, index + 1)}
              </span>
              <div className="tw-min-w-0">
                <p className="tw-m-0 tw-text-sm tw-font-medium tw-leading-6 tw-text-iron-100">
                  {t(locale, "network.tdhConsolidation.order.after", {
                    wallet: step.signer,
                  })}
                </p>
                <span className="tw-mt-1 tw-block">
                  <GroupChips
                    groups={step.groups}
                    split={!step.existingMembersTogether}
                  />
                </span>
                <p className={`${TDH_TEXT} tw-mt-1`}>
                  {t(locale, "network.tdhConsolidation.order.groups", {
                    groups: describeGroups(step.groups),
                  })}
                  <span
                    className={`tw-mt-1 tw-block tw-text-xs tw-font-medium tw-uppercase tw-tracking-wide ${
                      step.existingMembersTogether
                        ? "tw-text-iron-400"
                        : "tw-text-error"
                    }`}
                  >
                    {describeState(step)}
                  </span>
                </p>
              </div>
            </li>
          ))}
        </ol>
      )}

      <output aria-live="polite" className={`tw-block ${TDH_TEXT}`}>
        {lastStep && (
          <span className="tw-sr-only">
            {t(locale, "network.tdhConsolidation.order.stepAnnouncement", {
              wallet: lastStep.signer,
              groups: describeGroups(lastStep.groups),
              state: describeState(lastStep),
            })}{" "}
          </span>
        )}
        {complete &&
          (splitCount === 0
            ? t(locale, "network.tdhConsolidation.order.safe")
            : t(locale, "network.tdhConsolidation.order.unsafe", {
                count: formatInteger(locale, splitCount),
                total: formatInteger(locale, steps.length),
              }))}
      </output>

      {complete && lastStep?.groups.some((group) => group.length === 4) && (
        <div className="tw-rounded-lg tw-border-0 tw-border-l-2 tw-border-solid tw-border-amber-400/70 tw-bg-amber-400/[0.05] tw-py-3 tw-pl-4 tw-pr-3">
          <p className="tw-m-0 tw-text-sm tw-font-medium tw-text-iron-100">
            {t(locale, "network.tdhConsolidation.order.v1Title")}
          </p>
          <span className="tw-mt-2 tw-block">
            <GroupChips groups={TDH_V1_GROUPS} split={false} />
          </span>
          <p className={`${TDH_TEXT} tw-mt-2`}>
            {t(locale, "network.tdhConsolidation.order.v1Body")}
          </p>
        </div>
      )}

      <p className="tw-m-0 tw-max-w-[38em] tw-border-0 tw-border-l-2 tw-border-solid tw-border-iron-600 tw-pl-4 tw-text-sm tw-leading-6 tw-text-iron-300">
        {t(locale, "network.tdhConsolidation.order.note")}
      </p>
    </div>
  );
}

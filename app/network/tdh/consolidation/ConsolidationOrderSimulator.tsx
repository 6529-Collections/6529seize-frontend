"use client";

import { useMemo, useState } from "react";
import { formatInteger, formatList } from "@/i18n/format";
import type { SupportedLocale } from "@/i18n/locales";
import { t, type MessageKey } from "@/i18n/messages";
import { TDH_FOCUS, TDH_PANEL, TDH_TEXT } from "../TDHSection";
import {
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
const BUTTON = `tw-rounded-lg tw-border tw-border-solid tw-border-iron-700 tw-bg-transparent tw-px-3 tw-py-2.5 tw-text-left tw-text-sm tw-font-medium tw-text-iron-200 hover:tw-bg-iron-800 hover:tw-text-iron-50 ${TDH_FOCUS}`;

export default function ConsolidationOrderSimulator({
  locale,
}: {
  readonly locale: SupportedLocale;
}) {
  const [order, setOrder] = useState<readonly SimulatedWallet[]>([]);
  const steps = useMemo(() => simulateAddingFourthWallet(order), [order]);
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

  return (
    <div className={`${TDH_PANEL} tw-space-y-5 tw-p-5`}>
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
        <button
          type="button"
          className={BUTTON}
          disabled={order.length === 0}
          onClick={() => setOrder([])}
        >
          {t(locale, "network.tdhConsolidation.order.reset")}
        </button>
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
                <p className={TDH_TEXT}>
                  {t(locale, "network.tdhConsolidation.order.groups", {
                    groups: describeGroups(step.groups),
                  })}
                </p>
                <p
                  className={`tw-m-0 tw-mt-1 tw-text-xs tw-font-medium tw-uppercase tw-tracking-wide ${
                    step.existingMembersTogether
                      ? "tw-text-iron-400"
                      : "tw-text-error"
                  }`}
                >
                  {step.existingMembersTogether
                    ? t(locale, "network.tdhConsolidation.order.together")
                    : t(locale, "network.tdhConsolidation.order.split")}
                </p>
              </div>
            </li>
          ))}
        </ol>
      )}

      <div role="status" aria-live="polite" className={TDH_TEXT}>
        {complete &&
          (splitCount === 0
            ? t(locale, "network.tdhConsolidation.order.safe")
            : t(locale, "network.tdhConsolidation.order.unsafe", {
                count: formatInteger(locale, splitCount),
                total: formatInteger(locale, steps.length),
              }))}
      </div>

      <p className="tw-m-0 tw-border-0 tw-border-l-2 tw-border-solid tw-border-iron-600 tw-pl-4 tw-text-sm tw-leading-6 tw-text-iron-400">
        {t(locale, "network.tdhConsolidation.order.note")}
      </p>
    </div>
  );
}

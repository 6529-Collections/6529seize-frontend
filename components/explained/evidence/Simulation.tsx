"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import type { SupportedLocale } from "@/i18n/locales";
import { kt } from "../i18n";
import Tag from "../marks/Tag";
import BreakIt from "../lens/BreakIt";

/**
 * Show the failing case (EXPLAINED.md §1.8, §6.4 SimulatedState): a check's
 * Break it swaps the real state for a constructed failing one, marked
 * Simulated, and back. `SimulationSwitch` holds the switch; `WhenReal` and
 * `WhenSimulated` mark what each state shows, so one button can turn the
 * verdict and the ribbon together (linked views).
 */
const SimulationContext = createContext<{
  readonly on: boolean;
  readonly toggle: () => void;
} | null>(null);

export function SimulationSwitch({
  id,
  children,
  defaultOn = false,
}: {
  /** The lens's id: `data-lens` for the gates' states. */
  readonly id: string;
  readonly children: ReactNode;
  readonly defaultOn?: boolean;
}) {
  const [on, setOn] = useState(defaultOn);
  return (
    <SimulationContext.Provider
      value={{ on, toggle: () => setOn((value) => !value) }}
    >
      <div data-lens={id} data-simulating={on ? "1" : "0"}>
        {children}
      </div>
    </SimulationContext.Provider>
  );
}

function useSimulation() {
  const context = useContext(SimulationContext);
  if (!context) {
    throw new Error(
      "WhenReal, WhenSimulated and SimulationButton need a SimulationSwitch."
    );
  }
  return context;
}

/**
 * Whether the switch shows the failing state. For a component that keeps
 * one tree in both states (a verdict whose Break it must keep its focus
 * when pressed), instead of swapping two trees with WhenReal and
 * WhenSimulated.
 */
export function useSimulating(): boolean {
  return useSimulation().on;
}

export function WhenReal({ children }: { readonly children: ReactNode }) {
  return useSimulation().on ? null : <>{children}</>;
}

export function WhenSimulated({ children }: { readonly children: ReactNode }) {
  return useSimulation().on ? <>{children}</> : null;
}

/** The switch's Break it: "Show a day that fails", then "Back to today". */
export function SimulationButton({
  id,
  edge,
  back,
}: {
  /** `data-break`: "fail". */
  readonly id: string;
  /** What breaks: "Show a day that fails" (shown whole, not after "Break it:"). */
  readonly edge: string;
  readonly back: string;
}) {
  const { on, toggle } = useSimulation();
  return (
    <BreakIt
      id={id}
      pressed={on}
      onToggle={toggle}
      label={on ? back : edge}
      plain
    />
  );
}

/** A component shown in its failing state, with the Simulated tag and its note. */
export function SimulatedState({
  children,
  locale,
}: {
  readonly children: ReactNode;
  readonly locale: SupportedLocale;
}) {
  return (
    <div
      className="tw-rounded-xl tw-border tw-border-solid tw-border-error/55 tw-bg-[repeating-linear-gradient(135deg,rgba(249,112,102,0.05)_0_12px,transparent_12px_24px)] tw-p-4"
      data-simulated=""
    >
      <div className="tw-mb-3 tw-flex tw-flex-wrap tw-items-center tw-gap-2.5">
        <Tag kind="simulated" locale={locale} />
        <span className="tw-text-[13px] tw-font-medium tw-text-iron-400">
          {kt(locale, "explained.kit.simulated.note")}
        </span>
      </div>
      {children}
    </div>
  );
}

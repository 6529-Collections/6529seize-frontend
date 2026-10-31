"use client";

import type { ReactNode } from "react";
import { useSimulating } from "@/components/explained/evidence/Simulation";
import Verdict, {
  type VerdictState,
} from "@/components/explained/evidence/Verdict";
import type { SupportedLocale } from "@/i18n/locales";
import type { FactEntry } from "@/lib/explained/facts";

/**
 * The daily check's verdict with its Break it (TDH-DESIGN.md §4.4, §5.10):
 * the real day, or, while "Show a day that fails" is pressed, the
 * constructed failing day marked Simulated. One verdict block serves both
 * states, so the button stays where it is and keeps the keyboard's focus;
 * only the words, the equation and the frame change.
 */
export interface VerdictFace {
  readonly state: VerdictState;
  readonly word?: string;
  readonly headline: ReactNode;
  readonly detail: ReactNode;
  readonly aside: ReactNode;
  readonly incident?: {
    readonly steps: readonly string[];
    readonly done: number;
  };
}

export default function FailDayVerdict({
  real,
  simulated,
  date,
  cycle,
  actions,
  locale,
}: {
  readonly real: VerdictFace;
  /** The failing day; null when there is nothing to simulate. */
  readonly simulated: VerdictFace | null;
  readonly date: FactEntry | null;
  readonly cycle: FactEntry | null;
  readonly actions: ReactNode;
  readonly locale: SupportedLocale;
}) {
  const on = useSimulating() && simulated !== null;
  const face = on ? simulated : real;
  return (
    <div id="side" className="tw-scroll-mt-24" aria-live="polite">
      <Verdict
        state={face.state}
        {...(face.word === undefined ? {} : { word: face.word })}
        date={date}
        cycle={cycle}
        headline={face.headline}
        aside={face.aside}
        actions={actions}
        {...(face.incident === undefined ? {} : { incident: face.incident })}
        locale={locale}
      >
        {face.detail}
      </Verdict>
    </div>
  );
}

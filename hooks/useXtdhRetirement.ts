"use client";

import { useIdentityMovePhase } from "@/hooks/useIdentityMovePhase";
import { xtdhRetirementOf, type XtdhRetirement } from "@/lib/xtdh/retirement";

/** Where xTDH stands in its retirement (lib/xtdh/retirement.ts), live. */
export function useXtdhRetirement(): XtdhRetirement {
  return xtdhRetirementOf(useIdentityMovePhase());
}

/**
 * Whether xTDH is retired: from the identity switch-on, no xTDH figures are
 * shown.
 */
export function useXtdhRetired(): boolean {
  return useXtdhRetirement() === "retired";
}

"use client";

import { useRatingSave } from "./useRatingSave";

/** Existing category/grant consumers share the batch save with the full lists. */
export function useRepRatingSave() {
  return useRatingSave("REP");
}

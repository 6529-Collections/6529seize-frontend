"use client";

import { createContext, useContext } from "react";

/** Share the mobile shell's rules navigation with its nested Wave content. */
export const BrainMobileSubmissionRulesContext = createContext<
  (() => void) | null
>(null);

/** Return shell navigation when Wave content is rendered in the mobile shell. */
export const useBrainMobileSubmissionRules = (): (() => void) | null =>
  useContext(BrainMobileSubmissionRulesContext);

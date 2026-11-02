"use client";

import { createContext, useContext } from "react";

type EULAConsentContextType = {
  readonly consent: () => Promise<void>;
  readonly isSaving: boolean;
  readonly saveError: string | null;
};

// Kept apart from EULAConsentProvider so the lazily loaded EULAModal can read
// the consent state without importing the provider that loads it.
export const EULAConsentContext = createContext<
  EULAConsentContextType | undefined
>(undefined);

export const useEULAConsent = () => {
  const context = useContext(EULAConsentContext);
  if (!context)
    throw new Error("useEULAConsent must be used within a EULAConsentProvider");
  return context;
};

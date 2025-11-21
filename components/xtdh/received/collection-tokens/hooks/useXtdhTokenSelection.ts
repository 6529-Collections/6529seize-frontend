import { useCallback, useState } from "react";

import type { XtdhSelectedTokenDescriptor } from "../types";

interface UseXtdhTokenSelectionResult {
  readonly selectedToken: XtdhSelectedTokenDescriptor | null;
  readonly selectToken: (selection: XtdhSelectedTokenDescriptor) => void;
  readonly clearSelectedToken: () => void;
}

export function useXtdhTokenSelection(): UseXtdhTokenSelectionResult {
  const [selectedToken, setSelectedToken] =
    useState<XtdhSelectedTokenDescriptor | null>(null);

  const selectToken = useCallback((selection: XtdhSelectedTokenDescriptor) => {
    setSelectedToken(selection);
  }, []);

  const clearSelectedToken = useCallback(() => {
    setSelectedToken(null);
  }, []);

  return {
    selectedToken,
    selectToken,
    clearSelectedToken,
  };
}

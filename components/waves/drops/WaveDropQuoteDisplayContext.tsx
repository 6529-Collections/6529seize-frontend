"use client";

import type { ApiProfileMin } from "@/generated/models/ApiProfileMin";
import { createContext, type ReactNode, useContext, useMemo } from "react";

type QuoteAuthorIdentity = Pick<
  ApiProfileMin,
  "handle" | "id" | "primary_address"
>;

type WaveDropQuoteDisplayContextValue = {
  readonly flattenWhenAuthorSameAs: QuoteAuthorIdentity | null;
};

const WaveDropQuoteDisplayContext =
  createContext<WaveDropQuoteDisplayContextValue>({
    flattenWhenAuthorSameAs: null,
  });

export function WaveDropQuoteDisplayProvider({
  children,
  flattenWhenAuthorSameAs,
}: {
  readonly children: ReactNode;
  readonly flattenWhenAuthorSameAs: QuoteAuthorIdentity | null;
}) {
  const value = useMemo(
    () => ({ flattenWhenAuthorSameAs }),
    [flattenWhenAuthorSameAs]
  );

  return (
    <WaveDropQuoteDisplayContext.Provider value={value}>
      {children}
    </WaveDropQuoteDisplayContext.Provider>
  );
}

export const useWaveDropQuoteDisplay = () =>
  useContext(WaveDropQuoteDisplayContext);

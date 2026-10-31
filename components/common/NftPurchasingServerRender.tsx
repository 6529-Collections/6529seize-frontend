"use client";

import { createContext, useContext, type ReactNode } from "react";

// Off unless the root layout found the request clearly not from the iOS app.
const NftPurchasingServerRenderContext = createContext(false);

export function NftPurchasingServerRenderProvider({
  enabled,
  children,
}: {
  readonly enabled: boolean;
  readonly children: ReactNode;
}) {
  return (
    <NftPurchasingServerRenderContext value={enabled}>
      {children}
    </NftPurchasingServerRenderContext>
  );
}

export function useNftPurchasingServerRender(): boolean {
  return useContext(NftPurchasingServerRenderContext);
}

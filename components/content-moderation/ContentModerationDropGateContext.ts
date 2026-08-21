"use client";

import { createContext, useContext } from "react";

export interface ContentModerationDropGateContextValue {
  readonly setOptimisticHidden: (hidden: boolean) => () => void;
}

export const ContentModerationDropGateContext =
  createContext<ContentModerationDropGateContextValue | null>(null);

export const useContentModerationDropGateContext = () =>
  useContext(ContentModerationDropGateContext);

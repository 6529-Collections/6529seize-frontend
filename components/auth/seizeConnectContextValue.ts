"use client";

import { createContext, useContext } from "react";
import type { SeizeConnectContextType } from "./seizeConnectTypes";

export const SeizeConnectContext = createContext<
  SeizeConnectContextType | undefined
>(undefined);

export const useSeizeConnectContext = (): SeizeConnectContextType => {
  const context = useContext(SeizeConnectContext);
  if (!context) {
    throw new Error(
      "useSeizeConnectContext must be used within a SeizeConnectProvider"
    );
  }
  return context;
};

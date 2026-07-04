"use client";

import { createContext, useContext } from "react";

export type AppKitBootstrapStatus = "initializing" | "ready" | "error";

export type AppKitBootstrapContextValue = {
  readonly status: AppKitBootstrapStatus;
  readonly isReady: boolean;
  readonly isWaiting: boolean;
  readonly waitForReady: () => Promise<void>;
};

const readyContextValue = {
  status: "ready",
  isReady: true,
  isWaiting: false,
  waitForReady: () => Promise.resolve(),
} satisfies AppKitBootstrapContextValue;

export const AppKitBootstrapContext =
  createContext<AppKitBootstrapContextValue>(readyContextValue);

export const useAppKitBootstrap = (): AppKitBootstrapContextValue =>
  useContext(AppKitBootstrapContext);

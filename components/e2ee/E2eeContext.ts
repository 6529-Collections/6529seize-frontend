"use client";

import { createContext, useContext } from "react";
import type { E2eeEngine } from "@/lib/e2ee/types";
import type { E2eeEngineStore } from "./e2eeEngineStore";

/**
 * Why the engine is or is not available, before engine status applies.
 * - disabled: the build has encrypted messages off (production)
 * - unavailable: no signed-in profile or no connected wallet
 * - proxy: acting as a proxy; encrypted chat belongs to the own profile
 * - idle: allowed, but nothing has asked for the engine yet
 * - loading / loaded / failed: engine module and instance lifecycle
 */
export type E2eeAvailability =
  | "disabled"
  | "unavailable"
  | "proxy"
  | "idle"
  | "loading"
  | "loaded"
  | "failed";

export interface E2eeContextValue {
  readonly availability: E2eeAvailability;
  readonly profileId: string | null;
  readonly engine: E2eeEngine | null;
  readonly store: E2eeEngineStore | null;
  /** Error code when the engine module or instance failed to load. */
  readonly loadError: string | null;
  /** Dispose and recreate the engine (after an error). */
  readonly restart: () => void;
}

const noop = () => undefined;

const DISABLED_E2EE_CONTEXT: E2eeContextValue = {
  availability: "disabled",
  profileId: null,
  engine: null,
  store: null,
  loadError: null,
  restart: noop,
};

export const E2eeContext = createContext<E2eeContextValue>(
  DISABLED_E2EE_CONTEXT
);

export const useE2eeContext = (): E2eeContextValue => useContext(E2eeContext);

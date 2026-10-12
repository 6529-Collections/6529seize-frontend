import type { E2eeApiClient } from "@/lib/e2ee/api";
import type { E2eeEngine, E2eeEngineDeps } from "@/lib/e2ee/types";

export interface E2eeEngineModules {
  readonly createE2eeEngine: (deps: E2eeEngineDeps) => Promise<E2eeEngine>;
  readonly createE2eeApiClient: () => E2eeApiClient;
}

export type LoadE2eeEngineModules = () => Promise<E2eeEngineModules>;

/**
 * Loads the engine and its REST client on demand. Both are dynamic imports so
 * the engine (and, through it, the MLS WebAssembly module) never enters the
 * main bundle; this runs only when the flag is on and the user opens an
 * encrypted route or this browser already enrolled a device.
 */
export const loadE2eeEngineModules: LoadE2eeEngineModules = async () => {
  const [engineModule, apiModule] = await Promise.all([
    import("@/lib/e2ee/engine"),
    import("@/lib/e2ee/api"),
  ]);
  return {
    createE2eeEngine: engineModule.createE2eeEngine,
    createE2eeApiClient: apiModule.createE2eeApiClient,
  };
};

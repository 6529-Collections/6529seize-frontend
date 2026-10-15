// The default entry bundles the rrweb session recorder (~85 KB gzip). Recording
// is off (record_sessions_percent: 0), so use the recorder-free core build; it
// is the same SDK without the recorder bundle. The sibling .d.ts supplies types.
import type mixpanelCore from "mixpanel-browser/dist/mixpanel-core.cjs.js";

export type MixpanelSdk = typeof mixpanelCore;

let loadedSdk: MixpanelSdk | undefined;
let pendingLoad: Promise<MixpanelSdk | undefined> | undefined;

export const getLoadedMixpanelSdk = (): MixpanelSdk | undefined => loadedSdk;

// The CommonJS build's default export is the SDK instance. Anything else is a
// packaging change, reported apart from a failed download.
const readSdk = (sdkModule: { default?: unknown }): MixpanelSdk | undefined => {
  const sdk = sdkModule.default as Partial<MixpanelSdk> | undefined;
  if (typeof sdk?.init === "function" && typeof sdk.track === "function") {
    return sdk as MixpanelSdk;
  }
  console.warn("Mixpanel SDK module has an unexpected shape; analytics is off");
  return undefined;
};

/**
 * Downloads the SDK on first use so it stays out of first-load JavaScript.
 * Callers request it only once analytics may run (production, token and
 * performance consent). A failed download or an unexpected module shape
 * resolves undefined and is not cached, so the next request retries it.
 */
export const loadMixpanelSdk = (): Promise<MixpanelSdk | undefined> => {
  if (loadedSdk) {
    return Promise.resolve(loadedSdk);
  }
  pendingLoad ??= import("mixpanel-browser/dist/mixpanel-core.cjs.js")
    .then(
      (sdkModule) => {
        loadedSdk = readSdk(sdkModule);
        return loadedSdk;
      },
      () => undefined
    )
    .finally(() => {
      pendingLoad = undefined;
    });
  return pendingLoad;
};

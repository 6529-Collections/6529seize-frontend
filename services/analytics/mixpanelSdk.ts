// The default entry bundles the rrweb session recorder (~85 KB gzip). Recording
// is off (record_sessions_percent: 0), so use the recorder-free core build; it
// is the same SDK without the recorder bundle. The sibling .d.ts supplies types.
import type mixpanelCore from "mixpanel-browser/dist/mixpanel-core.cjs.js";

export type MixpanelSdk = typeof mixpanelCore;

let loadedSdk: MixpanelSdk | undefined;
let pendingLoad: Promise<MixpanelSdk | undefined> | undefined;

export const getLoadedMixpanelSdk = (): MixpanelSdk | undefined => loadedSdk;

/**
 * Downloads the SDK on first use so it stays out of first-load JavaScript.
 * Callers request it only once analytics may run (production, token and
 * performance consent). A failed download resolves undefined and the next
 * request retries it.
 */
export const loadMixpanelSdk = (): Promise<MixpanelSdk | undefined> => {
  if (loadedSdk) {
    return Promise.resolve(loadedSdk);
  }
  pendingLoad ??= import("mixpanel-browser/dist/mixpanel-core.cjs.js")
    .then(
      (sdkModule) => {
        loadedSdk = sdkModule.default;
        return loadedSdk;
      },
      () => undefined
    )
    .finally(() => {
      pendingLoad = undefined;
    });
  return pendingLoad;
};

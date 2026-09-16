import { beginVersionReload } from "@/components/version-update/versionReload";
import { preserveWaveScrollPositionForReload } from "@/helpers/waves/wave-visible-serial.helpers";

/** Reload the app bundle without losing the current route or wave reading position. */
export const refreshAppVersion = () => {
  const url = new URL(globalThis.location.href);
  url.searchParams.delete("showNewVersionToast");
  globalThis.history.replaceState(globalThis.history.state, "", url);
  preserveWaveScrollPositionForReload();
  beginVersionReload(() => globalThis.location.reload());
};

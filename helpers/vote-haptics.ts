import { Capacitor, registerPlugin } from "@capacitor/core";

const haptics = registerPlugin<{
  impact: (options: { style: "LIGHT" }) => Promise<void>;
}>("Haptics");

/** Older native shells may not include the optional Haptics plugin. */
export function triggerVoteSuccessHaptic() {
  if (!Capacitor.isNativePlatform() || !Capacitor.isPluginAvailable("Haptics"))
    return;
  void haptics.impact({ style: "LIGHT" }).catch(() => undefined);
}

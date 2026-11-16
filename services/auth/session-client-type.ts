import { Capacitor } from "@capacitor/core";
import { isDesktopShell } from "@/helpers/desktop-shell";
import type { AuthSessionClientType } from "./session-refresh-coordination.utils";

/**
 * Which session the API should issue: a cookie session on the web, a
 * refresh-token session in the mobile app, or a desktop session whose refresh
 * token the 6529 Desktop shell keeps.
 */
export function getSessionClientType(): AuthSessionClientType {
  if (isDesktopShell()) {
    return "desktop";
  }
  return Capacitor.isNativePlatform() ? "native" : "web";
}

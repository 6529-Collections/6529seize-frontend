"use client";

import { useSyncExternalStore } from "react";
import { getDesktopShellApi } from "@/helpers/desktop-shell";

/**
 * The 6529 Desktop window frame, as the host describes it on `<html>`
 * (`data-desktop-platform`, `data-desktop-titlebar`, `data-desktop-window`,
 * `data-desktop-focused`). The host sets these before first paint and keeps
 * them current, so the page reads them synchronously instead of waiting for
 * a bridge call. Null outside the desktop app and during server rendering.
 */
interface WindowChromeState {
  readonly platform: "windows" | "macos" | "linux";
  readonly style: "overlay" | "native";
  readonly maximized: boolean;
  readonly fullscreen: boolean;
  readonly focused: boolean;
}

const ATTRIBUTES = [
  "data-desktop-platform",
  "data-desktop-titlebar",
  "data-desktop-window",
  "data-desktop-focused",
];

let cachedKey: string | null = null;
let cachedState: WindowChromeState | null = null;

function readWindowChrome(): WindowChromeState | null {
  if (!getDesktopShellApi()) return null;
  const root = document.documentElement;
  const platform = root.getAttribute("data-desktop-platform");
  const style = root.getAttribute("data-desktop-titlebar");
  const windowState = root.getAttribute("data-desktop-window");
  const focused = root.getAttribute("data-desktop-focused");
  const key = [platform, style, windowState, focused].join("|");
  if (key === cachedKey) return cachedState;
  cachedKey = key;
  cachedState =
    (platform === "windows" || platform === "macos" || platform === "linux") &&
    (style === "overlay" || style === "native")
      ? {
          platform,
          style,
          maximized: windowState === "maximized",
          fullscreen: windowState === "fullscreen",
          focused: focused !== "false",
        }
      : null;
  return cachedState;
}

const getServerWindowChrome = (): WindowChromeState | null => null;

function subscribeWindowChrome(onChange: () => void): () => void {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ATTRIBUTES,
  });
  // The host also announces changes on the bridge; the attributes follow
  // them, but listening keeps a host that only sends events working.
  const api = getDesktopShellApi();
  api?.onWindowChromeChange?.(onChange);
  return () => {
    observer.disconnect();
    api?.offWindowChromeChange?.(onChange);
  };
}

export function useWindowChrome(): WindowChromeState | null {
  return useSyncExternalStore(
    subscribeWindowChrome,
    readWindowChrome,
    getServerWindowChrome
  );
}

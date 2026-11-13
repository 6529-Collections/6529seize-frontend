"use client";

import { useMyStreamOptional } from "@/contexts/wave/MyStreamContext";
import { useNavigationHistoryContext } from "@/contexts/NavigationHistoryContext";
import { useWaveInformation } from "@/contexts/WaveInformationContext";
import {
  getActiveWaveIdFromUrl,
  getEncryptedMessagesRoute,
  getHomeRoute,
  getMessagesBaseRoute,
  isMessageComposePathname,
  getWaveHomeRoute,
  isEncryptedMessagesPathname,
} from "@/helpers/navigation.helpers";
import { closeDropInCurrentUrl } from "@/helpers/waves/close-drop.helpers";
import { useNativeKeyboard } from "@/hooks/useNativeKeyboard";
import { dismissAndroidBackLayer } from "@/services/capacitor/android-back-layers";
import { App } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import { Keyboard } from "@capacitor/keyboard";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useLayoutEffect, useRef } from "react";
import { useExitActiveWave } from "./useExitActiveWave";

const ROOT_ROUTES = new Set([
  "/",
  "/discover",
  "/waves",
  "/messages",
  "/notifications",
  "/network",
  "/the-memes",
]);
const BACK_REPEAT_INTERVAL_MS = 250;

function dismissKeyboard(
  keyboard: ReturnType<typeof useNativeKeyboard>
): boolean {
  if (!keyboard.isVisible && keyboard.phase !== "hiding") return false;
  // Android normally dismisses the IME before dispatching Back. Also cover
  // shells that deliver the callback while their keyboard is hiding.
  if (document.activeElement instanceof HTMLElement) {
    document.activeElement.blur();
  }
  if (keyboard.isVisible && Capacitor.isPluginAvailable("Keyboard")) {
    void Keyboard.hide().catch(() => undefined);
  }
  return true;
}

function dismissQueryOverlay(url: URL): boolean {
  if (url.searchParams.has("drop")) {
    closeDropInCurrentUrl();
    return true;
  }
  if (url.searchParams.has("create")) {
    url.searchParams.delete("create");
    globalThis.history.replaceState(null, "", url);
    return true;
  }
  return false;
}

function getParentRoute(url: URL): string | null {
  if (isEncryptedMessagesPathname(url.pathname)) {
    return url.pathname === getEncryptedMessagesRoute()
      ? getMessagesBaseRoute(true)
      : getEncryptedMessagesRoute();
  }
  if (
    url.pathname === "/waves/create" ||
    isMessageComposePathname(url.pathname)
  ) {
    return getWaveHomeRoute({
      isDirectMessage: url.pathname.startsWith("/messages"),
      isApp: true,
    });
  }
  return null;
}

/** One native subscription; UI and route changes only update its callback. */
export default function AndroidBackNavigation() {
  const router = useRouter();
  const history = useNavigationHistoryContext();
  const information = useWaveInformation();
  const myStream = useMyStreamOptional();
  const exitActiveWave = useExitActiveWave();
  const keyboard = useNativeKeyboard();

  const handleBack = useCallback(() => {
    if (dismissKeyboard(keyboard)) return;
    if (dismissAndroidBackLayer()) return;

    const url = new URL(globalThis.location.href);
    if (dismissQueryOverlay(url)) return;
    if (information?.returnFromNavigation || information?.request?.overlay) {
      history.goBack();
      return;
    }

    const isDirectMessage = url.pathname.startsWith("/messages");
    const waveId = getActiveWaveIdFromUrl({
      pathname: url.pathname,
      searchParams: url.searchParams,
    });
    if (waveId) {
      if (myStream) exitActiveWave(isDirectMessage);
      else router.replace(getWaveHomeRoute({ isDirectMessage, isApp: true }));
      return;
    }
    const parentRoute = getParentRoute(url);
    if (parentRoute) {
      router.replace(parentRoute);
      return;
    }
    if (history.canGoBack) {
      history.goBack();
    } else if (!ROOT_ROUTES.has(url.pathname)) {
      // A direct/deep link without app history still has an in-app way back.
      router.replace(getHomeRoute());
    } else {
      void App.minimizeApp().catch(() => undefined);
    }
  }, [keyboard, information, history, myStream, exitActiveWave, router]);

  const callback = useRef(handleBack);
  useLayoutEffect(() => {
    callback.current = handleBack;
  }, [handleBack]);

  useEffect(() => {
    if (
      !Capacitor.isNativePlatform() ||
      Capacitor.getPlatform() !== "android"
    ) {
      return;
    }
    let disposed = false;
    let lastBackAt = Number.NEGATIVE_INFINITY;
    const listener = App.addListener("backButton", () => {
      const now = Date.now();
      // Do not let key repeats race a closing layer or an asynchronous route.
      if (disposed || now - lastBackAt < BACK_REPEAT_INTERVAL_MS) return;
      lastBackAt = now;
      callback.current();
    });
    void listener.catch(() => undefined);
    return () => {
      disposed = true;
      void listener.then((handle) => handle.remove()).catch(() => undefined);
    };
  }, []);

  return null;
}

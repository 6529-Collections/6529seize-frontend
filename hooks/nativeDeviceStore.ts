"use client";

import { App } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import type { PluginListenerHandle } from "@capacitor/core";
import {
  hasTouchCapability,
  isTouchFirstEnvironment,
  subscribeToTouchFirstChanges,
} from "@/helpers/touch-first.helpers";

enum CapacitorOrientationType {
  PORTRAIT,
  LANDSCAPE,
}

interface CapacitorSnapshot {
  readonly isCapacitor: boolean;
  readonly platform: string;
  readonly isIos: boolean;
  readonly isAndroid: boolean;
  readonly orientation: CapacitorOrientationType;
  readonly isActive: boolean;
}

export interface DeviceInfo {
  readonly isMobileDevice: boolean;
  /**
   * Touch-first device (see helpers/touch-first.helpers.ts): phones and
   * tablets, including phones with a paired mouse or hovering stylus.
   * Hybrid touch-screen laptops (e.g. Windows Surface) are NOT touch-first —
   * they get the desktop experience. Use this for choosing touch vs desktop
   * affordances.
   */
  readonly hasTouchScreen: boolean;
  readonly isApp: boolean;
  readonly isAppleMobile: boolean;
}

type StoreSubscriber = () => void;

const CAPACITOR_LISTENER_RETRY_DELAY_MS = 250;

const DEFAULT_CAPACITOR_SNAPSHOT: CapacitorSnapshot = {
  isCapacitor: false,
  platform: "web",
  isIos: false,
  isAndroid: false,
  orientation: CapacitorOrientationType.PORTRAIT,
  isActive: false,
};

const DEFAULT_DEVICE_INFO: DeviceInfo = {
  isMobileDevice: false,
  hasTouchScreen: false,
  isApp: false,
  isAppleMobile: false,
};

let capacitorSnapshot = DEFAULT_CAPACITOR_SNAPSHOT;
let deviceInfoSnapshot = DEFAULT_DEVICE_INFO;
let deviceTouchDetected = false;

const capacitorSubscribers = new Set<StoreSubscriber>();
const deviceInfoSubscribers = new Set<StoreSubscriber>();

let capacitorListenerHandles: PluginListenerHandle[] = [];
let capacitorListenerSetupPromise: Promise<void> | null = null;
let capacitorListenerSetupToken = 0;
let capacitorListenerRetryTimer: ReturnType<typeof setTimeout> | null = null;
let orientationListenerAttached = false;
let deviceInfoListenerCleanup: (() => void) | null = null;

function snapshotsAreEqual(
  left: CapacitorSnapshot,
  right: CapacitorSnapshot
): boolean {
  return (
    left.isCapacitor === right.isCapacitor &&
    left.platform === right.platform &&
    left.isIos === right.isIos &&
    left.isAndroid === right.isAndroid &&
    left.orientation === right.orientation &&
    left.isActive === right.isActive
  );
}

function deviceInfosAreEqual(left: DeviceInfo, right: DeviceInfo): boolean {
  return (
    left.isMobileDevice === right.isMobileDevice &&
    left.hasTouchScreen === right.hasTouchScreen &&
    left.isApp === right.isApp &&
    left.isAppleMobile === right.isAppleMobile
  );
}

function notifySubscribers(subscribers: Set<StoreSubscriber>): void {
  subscribers.forEach((subscriber) => subscriber());
}

function getBrowserWindow(): Window | undefined {
  return (globalThis as typeof globalThis & { window?: Window }).window;
}

function readCapacitorRuntimeState(): Pick<
  CapacitorSnapshot,
  "isCapacitor" | "platform" | "isIos" | "isAndroid"
> {
  if (getBrowserWindow() === undefined) {
    return {
      isCapacitor: false,
      platform: "web",
      isIos: false,
      isAndroid: false,
    };
  }

  const platform = Capacitor.getPlatform();
  const isCapacitor = Capacitor.isNativePlatform();

  return {
    isCapacitor,
    platform,
    isIos: platform === "ios",
    isAndroid: platform === "android",
  };
}

function readOrientation(isCapacitor: boolean): CapacitorOrientationType {
  const browserWindow = getBrowserWindow();

  if (
    !isCapacitor ||
    browserWindow === undefined ||
    typeof browserWindow.matchMedia !== "function"
  ) {
    return CapacitorOrientationType.PORTRAIT;
  }

  return browserWindow.matchMedia("(orientation: portrait)").matches
    ? CapacitorOrientationType.PORTRAIT
    : CapacitorOrientationType.LANDSCAPE;
}

function readCapacitorSnapshot(): CapacitorSnapshot {
  const runtimeState = readCapacitorRuntimeState();
  return {
    ...capacitorSnapshot,
    ...runtimeState,
    orientation: readOrientation(runtimeState.isCapacitor),
  };
}

function emitCapacitorSnapshot(nextSnapshot: CapacitorSnapshot): void {
  if (snapshotsAreEqual(capacitorSnapshot, nextSnapshot)) {
    return;
  }

  capacitorSnapshot = nextSnapshot;
  notifySubscribers(capacitorSubscribers);
  refreshDeviceInfoSnapshot();
}

function refreshCapacitorSnapshot(): void {
  emitCapacitorSnapshot(readCapacitorSnapshot());
}

function handleOrientationChange(): void {
  emitCapacitorSnapshot(readCapacitorSnapshot());
}

function setCapacitorAppActive(isActive: boolean): void {
  emitCapacitorSnapshot({
    ...capacitorSnapshot,
    isActive,
  });
}

async function syncCapacitorAppState(): Promise<void> {
  try {
    const state = await App.getState();
    setCapacitorAppActive(state.isActive);
  } catch (error) {
    console.error("Capacitor app state error:", error);
  }
}

async function removeListenerHandles(
  handles: readonly PluginListenerHandle[]
): Promise<void> {
  await Promise.all(
    handles.map((handle) =>
      Promise.resolve(handle.remove()).catch((error: unknown) => {
        console.error("Capacitor app state listener cleanup error:", error);
      })
    )
  );
}

function attachOrientationListener(): void {
  const browserWindow = getBrowserWindow();

  if (orientationListenerAttached || browserWindow === undefined) {
    return;
  }

  orientationListenerAttached = true;
  browserWindow.addEventListener("orientationchange", handleOrientationChange);
  handleOrientationChange();
}

function detachOrientationListener(): void {
  const browserWindow = getBrowserWindow();

  if (!orientationListenerAttached || browserWindow === undefined) {
    return;
  }

  orientationListenerAttached = false;
  browserWindow.removeEventListener(
    "orientationchange",
    handleOrientationChange
  );
}

function clearCapacitorListenerRetry(): void {
  if (capacitorListenerRetryTimer === null) {
    return;
  }

  clearTimeout(capacitorListenerRetryTimer);
  capacitorListenerRetryTimer = null;
}

function shouldRetryCapacitorListenerSetup(setupToken: number): boolean {
  return (
    setupToken === capacitorListenerSetupToken &&
    capacitorSubscribers.size > 0 &&
    capacitorListenerHandles.length === 0 &&
    capacitorSnapshot.isCapacitor
  );
}

function scheduleCapacitorListenerRetry(setupToken: number): void {
  if (
    capacitorListenerRetryTimer !== null ||
    !shouldRetryCapacitorListenerSetup(setupToken)
  ) {
    return;
  }

  capacitorListenerRetryTimer = setTimeout(() => {
    capacitorListenerRetryTimer = null;

    if (shouldRetryCapacitorListenerSetup(setupToken)) {
      ensureCapacitorListeners();
    }
  }, CAPACITOR_LISTENER_RETRY_DELAY_MS);
}

function teardownCapacitorListeners(): void {
  capacitorListenerSetupToken += 1;
  clearCapacitorListenerRetry();
  detachOrientationListener();

  if (capacitorListenerHandles.length === 0) {
    return;
  }

  const handles = capacitorListenerHandles;
  capacitorListenerHandles = [];
  void removeListenerHandles(handles);
}

function ensureCapacitorListeners(): void {
  refreshCapacitorSnapshot();

  if (
    getBrowserWindow() === undefined ||
    !capacitorSnapshot.isCapacitor ||
    capacitorListenerHandles.length > 0 ||
    capacitorListenerSetupPromise
  ) {
    return;
  }

  attachOrientationListener();

  const setupToken = capacitorListenerSetupToken;
  capacitorListenerSetupPromise = (async () => {
    try {
      await syncCapacitorAppState();

      const handle = await App.addListener("appStateChange", (state) => {
        setCapacitorAppActive(state.isActive);
      });

      if (
        setupToken !== capacitorListenerSetupToken ||
        capacitorSubscribers.size === 0
      ) {
        await removeListenerHandles([handle]);
        return;
      }

      capacitorListenerHandles = [handle];
    } catch (error) {
      console.error("Capacitor app state listener setup error:", error);
    } finally {
      capacitorListenerSetupPromise = null;
      scheduleCapacitorListenerRetry(setupToken);
    }
  })();
}

function readDeviceInfo(): DeviceInfo {
  if (typeof navigator === "undefined") {
    return DEFAULT_DEVICE_INFO;
  }

  const browserWindow = getBrowserWindow();
  const nav = navigator as Navigator & {
    userAgentData?: { mobile?: boolean | undefined } | undefined;
    standalone?: boolean | undefined;
  };
  // Device info needs only Capacitor's static runtime platform, not app-state
  // listeners owned by the Capacitor store.
  const isCapacitor = readCapacitorRuntimeState().isCapacitor;

  // Raw capability — true when touch input exists at all. Only used for
  // UA disambiguation (iPads pretending to be Macs) — never for UI mode.
  const hasTouchInput = deviceTouchDetected || hasTouchCapability();
  const hasTouchScreen = isTouchFirstEnvironment({
    touchDetected: deviceTouchDetected,
  });

  const ua = nav.userAgent;
  const uaDataMobile = nav.userAgentData?.mobile;
  const classicMobile =
    /Android|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
  const iPadDesktopUA = ua.includes("Macintosh") && hasTouchInput;
  const appleMobile = /(iPhone|iPad|iPod)/i.test(ua) || iPadDesktopUA;
  const widthMobile =
    browserWindow === undefined
      ? false
      : browserWindow.matchMedia("(max-width: 768px)").matches;

  const isMobileDevice =
    uaDataMobile ??
    (classicMobile || (isCapacitor && (iPadDesktopUA || widthMobile)));

  return {
    isMobileDevice,
    hasTouchScreen,
    isApp: isCapacitor,
    isAppleMobile: appleMobile,
  };
}

function refreshDeviceInfoSnapshot(): void {
  const nextSnapshot = readDeviceInfo();

  if (deviceInfosAreEqual(deviceInfoSnapshot, nextSnapshot)) {
    return;
  }

  deviceInfoSnapshot = nextSnapshot;
  notifySubscribers(deviceInfoSubscribers);
}

function ensureDeviceInfoListeners(): void {
  if (deviceInfoListenerCleanup) {
    return;
  }

  const cleanupCallbacks: Array<() => void> = [];
  const hasEventListenerApi =
    typeof globalThis.addEventListener === "function" &&
    typeof globalThis.removeEventListener === "function";

  const update = () => refreshDeviceInfoSnapshot();

  const onceTouch = () => {
    deviceTouchDetected = true;
    update();

    if (hasEventListenerApi) {
      globalThis.removeEventListener("touchstart", onceTouch);
    }
  };

  if (hasEventListenerApi) {
    globalThis.addEventListener("resize", update);
    globalThis.addEventListener("touchstart", onceTouch, { passive: true });
    cleanupCallbacks.push(() => {
      globalThis.removeEventListener("resize", update);
      globalThis.removeEventListener("touchstart", onceTouch);
    });
  }

  // Pointer/hover capabilities change when a mouse is (un)plugged or a
  // convertible flips posture — keep the classification in sync.
  cleanupCallbacks.push(subscribeToTouchFirstChanges(update));

  deviceInfoListenerCleanup = () => {
    for (const cleanup of cleanupCallbacks) {
      cleanup();
    }
    deviceInfoListenerCleanup = null;
  };

  update();
}

export function getCapacitorSnapshot(): CapacitorSnapshot {
  return capacitorSnapshot;
}

export function getServerCapacitorSnapshot(): CapacitorSnapshot {
  return DEFAULT_CAPACITOR_SNAPSHOT;
}

export function subscribeToCapacitorStore(
  subscriber: StoreSubscriber
): () => void {
  capacitorSubscribers.add(subscriber);
  ensureCapacitorListeners();

  return () => {
    capacitorSubscribers.delete(subscriber);

    if (capacitorSubscribers.size === 0) {
      teardownCapacitorListeners();
    }
  };
}

export function getDeviceInfoSnapshot(): DeviceInfo {
  return deviceInfoSnapshot;
}

export function getServerDeviceInfoSnapshot(): DeviceInfo {
  return DEFAULT_DEVICE_INFO;
}

export function subscribeToDeviceInfoStore(
  subscriber: StoreSubscriber
): () => void {
  deviceInfoSubscribers.add(subscriber);
  ensureDeviceInfoListeners();

  return () => {
    deviceInfoSubscribers.delete(subscriber);

    if (deviceInfoSubscribers.size === 0) {
      deviceInfoListenerCleanup?.();
    }
  };
}

export function __resetNativeDeviceStoresForTests(): void {
  deviceInfoListenerCleanup?.();
  teardownCapacitorListeners();
  capacitorSubscribers.clear();
  deviceInfoSubscribers.clear();
  capacitorSnapshot = DEFAULT_CAPACITOR_SNAPSHOT;
  deviceInfoSnapshot = DEFAULT_DEVICE_INFO;
  deviceTouchDetected = false;
  capacitorListenerHandles = [];
  capacitorListenerSetupPromise = null;
  capacitorListenerSetupToken = 0;
  clearCapacitorListenerRetry();
  orientationListenerAttached = false;
  deviceInfoListenerCleanup = null;
}

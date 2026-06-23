import type { BrowserContext } from "@playwright/test";

const EULA_CONSENT_COOKIE = "eula-consent";
const CAPACITOR_PROJECT_PLATFORMS: Record<string, "ios" | "android"> = {
  "capacitor-ios-sim": "ios",
  "capacitor-android-sim": "android",
};

export function isMobileSurfaceProject(projectName: string) {
  return (
    isMobileWebProject(projectName) ||
    projectName === "capacitor-ios-sim" ||
    projectName === "capacitor-android-sim"
  );
}

export function isMobileWebProject(projectName: string) {
  return projectName === "web-mobile-chromium";
}

export function isDesktopWebProject(projectName: string) {
  return projectName.startsWith("web-desktop-");
}

export function isChromiumDesktopWebProject(projectName: string) {
  return projectName === "web-desktop-chromium";
}

export function isCapacitorSimulationProject(projectName: string) {
  return Object.hasOwn(CAPACITOR_PROJECT_PLATFORMS, projectName);
}

export function isElectronSimulationProject(projectName: string) {
  return projectName === "electron-shell-sim";
}

export async function installSurfaceSimulation(
  context: BrowserContext,
  projectName: string,
  baseURL?: string
) {
  const capacitorPlatform = CAPACITOR_PROJECT_PLATFORMS[projectName];

  if (capacitorPlatform) {
    await context.addInitScript(
      ({ platform }) => {
        const simulatedNativeResponses: Record<string, unknown> = {
          "App.getState": { isActive: true },
          "App.getLaunchUrl": { url: null },
          "Device.getBatteryInfo": { isCharging: true, batteryLevel: 1 },
          "Device.getId": { identifier: `playwright-${platform}-device` },
          "Device.getInfo": {
            isVirtual: true,
            manufacturer: "Playwright",
            model: platform === "ios" ? "iPhone Simulator" : "Android Emulator",
            operatingSystem: platform,
            osVersion: platform === "ios" ? "17.0" : "14",
            platform,
            webViewVersion: "Playwright",
          },
          "Device.getLanguageCode": { value: "en" },
          "Device.getLanguageTag": { value: "en-US" },
          "Keyboard.getResizeMode": { mode: "native" },
        };
        const simulatedHeaders = [
          {
            name: "App",
            methods: [
              { name: "addListener", rtype: "callback" },
              { name: "getLaunchUrl", rtype: "promise" },
              { name: "getState", rtype: "promise" },
              { name: "removeAllListeners", rtype: "promise" },
              { name: "removeListener", rtype: "promise" },
            ],
          },
          {
            name: "Device",
            methods: [
              { name: "getBatteryInfo", rtype: "promise" },
              { name: "getId", rtype: "promise" },
              { name: "getInfo", rtype: "promise" },
              { name: "getLanguageCode", rtype: "promise" },
              { name: "getLanguageTag", rtype: "promise" },
            ],
          },
          {
            name: "Keyboard",
            methods: [
              { name: "addListener", rtype: "callback" },
              { name: "getResizeMode", rtype: "promise" },
              { name: "hide", rtype: "promise" },
              { name: "removeAllListeners", rtype: "promise" },
              { name: "removeListener", rtype: "promise" },
              { name: "setAccessoryBarVisible", rtype: "promise" },
              { name: "setResizeMode", rtype: "promise" },
              { name: "setScroll", rtype: "promise" },
              { name: "setStyle", rtype: "promise" },
              { name: "show", rtype: "promise" },
            ],
          },
        ];
        Object.defineProperty(globalThis, "CapacitorCustomPlatform", {
          configurable: true,
          value: { name: platform },
        });
        const runtime = globalThis as typeof globalThis & {
          Capacitor?: Record<string, unknown> | undefined;
        };
        const existingCapacitor = runtime.Capacitor ?? {};
        const existingPluginHeaders = Array.isArray(
          existingCapacitor["PluginHeaders"]
        )
          ? existingCapacitor["PluginHeaders"]
          : [];
        const simulatedHeaderNames = new Set(
          simulatedHeaders.map((header) => header.name)
        );
        const pluginHeaders = [
          ...existingPluginHeaders.filter((header) => {
            if (!header || typeof header !== "object") {
              return false;
            }
            const name = (header as { name?: unknown }).name;
            return typeof name === "string" && !simulatedHeaderNames.has(name);
          }),
          ...simulatedHeaders,
        ];
        const existingNativePromise =
          typeof existingCapacitor["nativePromise"] === "function"
            ? existingCapacitor["nativePromise"]
            : null;
        const existingNativeCallback =
          typeof existingCapacitor["nativeCallback"] === "function"
            ? existingCapacitor["nativeCallback"]
            : null;
        const convertFileSrc =
          typeof existingCapacitor["convertFileSrc"] === "function"
            ? existingCapacitor["convertFileSrc"]
            : // Current surface simulations do not exercise native file URL conversion.
              (filePath: string) => filePath;
        Object.defineProperty(runtime, "Capacitor", {
          configurable: true,
          writable: true,
          value: {
            ...existingCapacitor,
            Plugins:
              typeof existingCapacitor["Plugins"] === "object" &&
              existingCapacitor["Plugins"] !== null
                ? existingCapacitor["Plugins"]
                : {},
            convertFileSrc,
            getPlatform: () => platform,
            isNativePlatform: () => true,
            nativeCallback: (
              pluginName: string,
              methodName: string,
              options: unknown,
              callback: unknown
            ) => {
              const simulatedKey = `${pluginName}.${methodName}`;
              if (
                simulatedKey === "App.addListener" ||
                simulatedKey === "Keyboard.addListener"
              ) {
                return Promise.resolve(
                  `playwright-${platform}-${pluginName}-${Date.now()}`
                );
              }
              return existingNativeCallback?.(
                pluginName,
                methodName,
                options,
                callback
              );
            },
            nativePromise: (
              pluginName: string,
              methodName: string,
              options: unknown
            ) => {
              const simulatedKey = `${pluginName}.${methodName}`;
              if (Object.hasOwn(simulatedNativeResponses, simulatedKey)) {
                return Promise.resolve(simulatedNativeResponses[simulatedKey]);
              }
              if (simulatedHeaderNames.has(pluginName)) {
                return Promise.resolve(undefined);
              }
              return existingNativePromise?.(pluginName, methodName, options);
            },
            PluginHeaders: pluginHeaders,
            isPluginAvailable: (pluginName: string) => {
              const existingIsAvailable = existingCapacitor[
                "isPluginAvailable"
              ] as ((name: string) => boolean) | undefined;
              return (
                pluginHeaders.some((header) => header.name === pluginName) ||
                Boolean(existingIsAvailable?.(pluginName))
              );
            },
          },
        });
        Object.defineProperty(globalThis.navigator, "standalone", {
          configurable: true,
          value: true,
        });
        Object.defineProperty(globalThis, "__PLAYWRIGHT_SURFACE__", {
          configurable: true,
          value: `capacitor-${platform}-sim`,
        });
      },
      { platform: capacitorPlatform }
    );
    if (capacitorPlatform === "ios") {
      await seedIosEulaConsent(context, baseURL);
    }
    return;
  }

  await context.addInitScript(
    ({ surface }) => {
      Object.defineProperty(globalThis, "__PLAYWRIGHT_SURFACE__", {
        configurable: true,
        value: surface,
      });
    },
    { surface: projectName || "unknown" }
  );
}

async function seedIosEulaConsent(context: BrowserContext, baseURL?: string) {
  await context.addCookies([
    {
      name: EULA_CONSENT_COOKIE,
      value: "true",
      url: baseURL ?? "http://localhost",
      expires: Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60,
    },
  ]);
}

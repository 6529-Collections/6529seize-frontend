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
        Object.defineProperty(globalThis, "CapacitorCustomPlatform", {
          configurable: true,
          value: { name: platform },
        });
        const runtime = globalThis as typeof globalThis & {
          Capacitor?: Record<string, unknown> | undefined;
        };
        const existingCapacitor = runtime.Capacitor ?? {};
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
            convertFileSrc:
              typeof existingCapacitor["convertFileSrc"] === "function"
                ? existingCapacitor["convertFileSrc"]
                : (filePath: string) => filePath,
            getPlatform: () => platform,
            isNativePlatform: () => true,
            isPluginAvailable:
              typeof existingCapacitor["isPluginAvailable"] === "function"
                ? existingCapacitor["isPluginAvailable"]
                : () => false,
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

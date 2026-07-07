import yaml from "js-yaml";
import type { ReactNode } from "react";

import { DeepLinkScope } from "@/hooks/useDeepLinkNavigation";
import {
  getRefreshToken,
  getWalletAddress,
  getWalletRole,
  hasActiveSessionV2Auth,
} from "@/services/auth/auth.utils";
import { createConnectionShare } from "@/services/auth/session-v2.utils";

const QRCode = require("qrcode");

export type NativeConnectionShare = Awaited<
  ReturnType<typeof createConnectionShare>
>;

export type CachedConnectionShare = {
  readonly addressKey: string;
  readonly expiresAtMs: number;
  readonly share: NativeConnectionShare;
};

type SetQrSource = (dataUrl: string) => void;
export type IsStaleGeneration = () => boolean | undefined;
type SearchParamsLike = {
  toString(): string;
};
export type ConnectionShareStatus =
  | "unauthenticated"
  | "legacy-auth"
  | "loading"
  | "ready"
  | "error";
export type TerminalConnectionShareStatus = Extract<
  ConnectionShareStatus,
  "legacy-auth" | "error"
>;
export type DisplayContent = {
  readonly content: ReactNode;
  readonly url: string;
};
export type ConnectionShareSessionVerificationStatus =
  | "active"
  | "inactive"
  | "error"
  | "stale";

export function getLocalLegacyDesktopAuth(walletAddress: string): {
  readonly refreshToken: string;
  readonly role: string | null;
} | null {
  if (hasActiveSessionV2Auth({ address: walletAddress })) {
    return null;
  }

  const activeWalletAddress = getWalletAddress();
  if (activeWalletAddress?.toLowerCase() !== walletAddress.toLowerCase()) {
    return null;
  }

  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    return null;
  }

  return {
    refreshToken,
    role: getWalletRole(),
  };
}

export function isAbortError(error: unknown, signal?: AbortSignal): boolean {
  return (
    signal?.aborted === true ||
    (typeof error === "object" &&
      error !== null &&
      "name" in error &&
      error.name === "AbortError")
  );
}

export function isSessionUpgradeRequiredError(error: unknown): boolean {
  const message = getErrorMessage(error);
  return message.toLowerCase().includes("session-v2");
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  return "";
}

export function buildRouterPath(
  pathname: string | null,
  searchParams: SearchParamsLike | null
): string {
  let routerPath = pathname ?? "";
  if (routerPath.endsWith("/")) {
    routerPath = routerPath.slice(0, -1);
  }

  const searchParamsString = searchParams?.toString() ?? "";
  if (searchParamsString) {
    return `${routerPath}?${searchParamsString}`;
  }

  return routerPath;
}

export function buildConnectionShareFailureKey({
  addressKey,
  routerPath,
  target,
}: {
  readonly addressKey: string;
  readonly routerPath: string;
  readonly target: "mobile" | "desktop";
}): string {
  return `${target}:${addressKey}:${routerPath}`;
}

export function getCachedConnectionShare(
  cachedShare: CachedConnectionShare | null,
  addressKey: string
): NativeConnectionShare | null {
  if (cachedShare?.addressKey === addressKey) {
    const isReusable = cachedShare.expiresAtMs > Date.now() + 30_000;
    if (isReusable) {
      return cachedShare.share;
    }
  }

  return null;
}

export function buildNativeConnectionShareUrls({
  share,
  appScheme,
}: {
  readonly share: NativeConnectionShare;
  readonly appScheme: string;
}): {
  readonly appUrl: string;
} {
  const shareParams = new URLSearchParams({
    connection_share_code: share.connection_share_code,
    address: share.address,
  });

  return {
    appUrl: `${appScheme}://${DeepLinkScope.SHARE_CONNECTION}?${shareParams.toString()}`,
  };
}

export function buildLegacyDesktopConnectionSharePath({
  token,
  address,
  role,
}: {
  readonly token: string;
  readonly address: string;
  readonly role: string | null;
}): string {
  const shareParams = new URLSearchParams({
    token,
    address,
  });
  if (role) {
    shareParams.set("role", role);
  }
  return `/accept-connection-sharing?${shareParams.toString()}`;
}

export function buildLegacyDesktopConnectionShareUrl({
  coreScheme,
  deepLinkPath,
}: {
  readonly coreScheme: string;
  readonly deepLinkPath: string;
}): string {
  return `${coreScheme}://${DeepLinkScope.NAVIGATE}${deepLinkPath}`;
}

export function generateQrCodeSource({
  url,
  setSource,
  clearSource,
  staleGeneration,
  signal,
  errorMessage,
}: {
  readonly url: string;
  readonly setSource: SetQrSource;
  readonly clearSource: () => void;
  readonly staleGeneration: IsStaleGeneration;
  readonly signal?: AbortSignal | undefined;
  readonly errorMessage: string;
}): void {
  QRCode.toDataURL(url, { width: 500, margin: 0 })
    .then((dataUrl: string) => {
      if (staleGeneration()) {
        return;
      }
      setSource(dataUrl);
    })
    .catch((error: unknown) => {
      if (staleGeneration() || isAbortError(error, signal)) {
        return;
      }
      console.error(errorMessage, error);
      clearSource();
    });
}

export async function fetchCoreAppsVersions(): Promise<OSInfo[]> {
  const fetchYml = async (url: string): Promise<LatestYml> => {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to fetch ${url}`);
    }

    const text = await response.text();
    return yaml.load(text) as LatestYml;
  };

  const enabledConfigs = CORE_OS_CONFIGS.filter((config) => config.enabled);
  const results = await Promise.allSettled(
    enabledConfigs.map((config) => fetchYml(config.url))
  );

  return results.flatMap((result, index) => {
    const osConfig = enabledConfigs[index];
    if (!osConfig) {
      return [];
    }

    if (result.status === "fulfilled") {
      return [{ ...osConfig, version: result.value.version }];
    }

    console.error(
      `Failed to fetch or process ${osConfig.displayName}:`,
      result.reason
    );
    return [];
  });
}

interface OSInfo {
  name: "windows" | "mac" | "linux";
  url: string;
  displayName: string;
  downloadPath: string;
  image: string;
  enabled: boolean;
  version?: string | undefined;
}

interface FileData {
  url: string;
  sha512: string;
  size: number;
}

interface LatestYml {
  version: string;
  files: FileData[];
}

const CORE_OS_CONFIGS: OSInfo[] = [
  {
    name: "windows",
    url: "https://6529bucket.s3.eu-west-1.amazonaws.com/6529-core-app/win/latest.yml",
    displayName: "Windows",
    downloadPath: "6529-core-app/win/links",
    image: "/windows.png",
    enabled: true,
  },
  {
    name: "mac",
    url: "https://6529bucket.s3.eu-west-1.amazonaws.com/6529-core-app/mac/latest-mac.yml",
    displayName: "macOS",
    downloadPath: "6529-core-app/mac/links",
    image: "/macos.png",
    enabled: true,
  },
  {
    name: "linux",
    url: "https://6529bucket.s3.eu-west-1.amazonaws.com/6529-core-app/linux/latest-linux.yml",
    displayName: "Linux",
    downloadPath: "6529-core-app/linux/links",
    image: "/linux.png",
    enabled: true,
  },
];

export const bodyScrollLock = (() => {
  let lockCount = 0;
  let previousOverflow = "";

  return {
    lock: () => {
      if (typeof document === "undefined") {
        return;
      }

      if (lockCount === 0) {
        previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
      }

      lockCount += 1;
    },
    unlock: () => {
      if (typeof document === "undefined" || lockCount === 0) {
        return;
      }

      lockCount -= 1;
      if (lockCount === 0) {
        document.body.style.overflow = previousOverflow;
      }
    },
  };
})();

export function getFocusableElements(container: HTMLElement): HTMLElement[] {
  const selectors = [
    'a[href]:not([tabindex="-1"])',
    'button:not([disabled]):not([tabindex="-1"])',
    'textarea:not([disabled]):not([tabindex="-1"])',
    'input:not([disabled]):not([tabindex="-1"])',
    'select:not([disabled]):not([tabindex="-1"])',
    '[tabindex]:not([tabindex="-1"])',
  ].join(",");

  return Array.from(container.querySelectorAll<HTMLElement>(selectors)).filter(
    (element) =>
      !element.hasAttribute("disabled") &&
      element.getAttribute("aria-hidden") !== "true"
  );
}

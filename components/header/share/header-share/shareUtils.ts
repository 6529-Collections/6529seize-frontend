import { toDataURL } from "qrcode";

import { publicEnv } from "@/config/env";
import { DeepLinkScope } from "@/hooks/useDeepLinkNavigation";
import {
  getRefreshToken,
  getWalletAddress,
  getWalletRole,
  hasActiveSessionV2Auth,
} from "@/services/auth/auth.utils";
import type { createConnectionShare } from "@/services/auth/session-v2.utils";

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
export type ConnectionShareSessionVerificationStatus =
  | "active"
  | "inactive"
  | "error"
  | "stale";

export type PageShareData = {
  readonly title: string;
  readonly url: string;
};

export type PageShareSystemShareAdapter = {
  readonly canShare: (shareData: PageShareData) => Promise<boolean>;
  readonly share: (shareData: PageShareData) => Promise<void>;
};

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

type PermissionsPolicyLike = {
  readonly allowsFeature?: ((feature: string) => boolean) | undefined;
  readonly features?: (() => readonly string[]) | undefined;
};

type DocumentWithPermissionsPolicy = Document & {
  readonly permissionsPolicy?: PermissionsPolicyLike | undefined;
  readonly featurePolicy?: PermissionsPolicyLike | undefined;
};

function isWebShareBlockedByPermissionsPolicy(): boolean {
  if (typeof document === "undefined") {
    return false;
  }

  const policyDocument = document as DocumentWithPermissionsPolicy;
  const policy =
    policyDocument.permissionsPolicy ?? policyDocument.featurePolicy;
  if (
    typeof policy?.allowsFeature !== "function" ||
    typeof policy.features !== "function"
  ) {
    return false;
  }

  try {
    if (!policy.features().includes("web-share")) {
      return false;
    }

    return policy.allowsFeature("web-share") === false;
  } catch {
    return false;
  }
}

export function canUseSystemShare(shareData: ShareData): boolean {
  if (
    globalThis.isSecureContext !== true ||
    typeof navigator === "undefined" ||
    typeof navigator.share !== "function" ||
    isWebShareBlockedByPermissionsPolicy()
  ) {
    return false;
  }

  try {
    if (typeof navigator.canShare !== "function") {
      return true;
    }

    return navigator.canShare(shareData);
  } catch {
    return false;
  }
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

export function getCurrentPageLocation(): {
  readonly fullUrl: string;
  readonly routerPath: string;
} {
  if (typeof window === "undefined") {
    return { fullUrl: "", routerPath: "" };
  }

  const { hash, href, pathname, search } = window.location;
  return {
    fullUrl: href,
    routerPath: `${pathname}${search}${hash}`,
  };
}

export function getCurrentFullUrl(): string {
  return getCurrentPageLocation().fullUrl;
}

export function getCurrentPublicUrl(): string {
  const route = getCurrentPageLocation().routerPath;
  if (!route) {
    return "";
  }

  const normalizedBase = publicEnv.BASE_ENDPOINT.replace(/\/$/, "");
  const normalizedRoute = route.startsWith("/") ? route : `/${route}`;
  return `${normalizedBase}${normalizedRoute}`;
}

export function buildSocialShareUrls({
  url,
  title,
}: {
  readonly url: string;
  readonly title: string;
}): {
  readonly x: string;
  readonly farcaster: string;
} {
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);
  const encodedXText = encodeURIComponent(`${title}\n${url}`);

  return {
    x: `https://x.com/intent/post?text=${encodedXText}`,
    farcaster: `https://farcaster.xyz/~/compose?text=${encodedTitle}&embeds%5B%5D=${encodedUrl}`,
  };
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

export function buildNavigateDeepLinkUrl({
  scheme,
  routerPath,
}: {
  readonly scheme: string;
  readonly routerPath: string;
}): string {
  return `${scheme}://${DeepLinkScope.NAVIGATE}${routerPath}`;
}

async function createQrCodeSource({
  url,
  staleGeneration,
  signal,
  errorMessage,
}: {
  readonly url: string;
  readonly staleGeneration: IsStaleGeneration;
  readonly signal?: AbortSignal | undefined;
  readonly errorMessage: string;
}): Promise<string> {
  try {
    const dataUrl = await toDataURL(url, {
      width: 500,
      margin: 4,
      color: {
        dark: "#000000",
        light: "#ffffff",
      },
    });

    return staleGeneration() ? "" : dataUrl;
  } catch (error: unknown) {
    if (!staleGeneration() && !isAbortError(error, signal)) {
      console.error(errorMessage, error);
    }
    return "";
  }
}

const CONNECTION_QR_PREPARATION_ATTEMPTS = 2;

async function decodeQrCodeSource({
  source,
  staleGeneration,
  signal,
}: {
  readonly source: string;
  readonly staleGeneration: IsStaleGeneration;
  readonly signal?: AbortSignal | undefined;
}): Promise<boolean> {
  const ImageConstructor = globalThis.Image;
  if (typeof ImageConstructor !== "function") {
    return true;
  }

  const image = new ImageConstructor();
  image.src = source;
  if (typeof image.decode !== "function") {
    return true;
  }

  try {
    await image.decode();
    return !staleGeneration();
  } catch (error: unknown) {
    if (!staleGeneration() && !isAbortError(error, signal)) {
      console.error("Failed to decode share connection QR code", error);
    }
    return false;
  }
}

export async function createReadyQrCodeSource({
  url,
  staleGeneration,
  signal,
  errorMessage,
}: {
  readonly url: string;
  readonly staleGeneration: IsStaleGeneration;
  readonly signal?: AbortSignal | undefined;
  readonly errorMessage: string;
}): Promise<string> {
  for (
    let attempt = 0;
    attempt < CONNECTION_QR_PREPARATION_ATTEMPTS;
    attempt++
  ) {
    if (staleGeneration()) {
      return "";
    }
    const source = await createQrCodeSource({
      url,
      staleGeneration,
      signal,
      errorMessage,
    });
    if (staleGeneration()) {
      return "";
    }
    if (
      source &&
      (await decodeQrCodeSource({ source, staleGeneration, signal }))
    ) {
      return staleGeneration() ? "" : source;
    }
  }

  return "";
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
  void createQrCodeSource({
    url,
    staleGeneration,
    signal,
    errorMessage,
  }).then((dataUrl) => {
    if (staleGeneration()) {
      return;
    }
    if (dataUrl) {
      setSource(dataUrl);
    } else {
      clearSource();
    }
  });
}

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

"use client";

import { publicEnv } from "@/config/env";
import { faCopy, faExternalLink } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { ShareIcon } from "@heroicons/react/24/outline";
import yaml from "js-yaml";
import Image from "next/image";
import { usePathname, useSearchParams } from "next/navigation";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useQuery } from "@tanstack/react-query";
import { Tooltip } from "react-tooltip";
import { useAuth } from "@/components/auth/Auth";
import useIsMobileDevice from "@/hooks/isMobileDevice";
import useCapacitor from "@/hooks/useCapacitor";
import { DeepLinkScope } from "@/hooks/useDeepLinkNavigation";
import { useElectron } from "@/hooks/useElectron";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import {
  getRefreshToken,
  getWalletAddress,
  getWalletRole,
  hasActiveSessionV2Auth,
} from "@/services/auth/auth.utils";
import {
  createConnectionShare,
  createLegacyDesktopConnectionShare,
} from "@/services/auth/session-v2.utils";
import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import { ShareMobileApp } from "./HeaderShareMobileApps";

const QRCode = require("qrcode");
const HEADER_SHARE_LOCALE = DEFAULT_LOCALE;

type NativeConnectionShare = Awaited<ReturnType<typeof createConnectionShare>>;

type CachedConnectionShare = {
  readonly addressKey: string;
  readonly expiresAtMs: number;
  readonly share: NativeConnectionShare;
};

type SetQrSource = (dataUrl: string) => void;
type IsStaleGeneration = () => boolean | undefined;
type SearchParamsLike = {
  toString(): string;
};
type ConnectionShareStatus =
  | "unauthenticated"
  | "legacy-auth"
  | "loading"
  | "ready"
  | "error";
type TerminalConnectionShareStatus = Extract<
  ConnectionShareStatus,
  "legacy-auth" | "error"
>;
type DisplayContent = {
  readonly content: ReactNode;
  readonly url: string;
};
type ConnectionShareSessionVerificationStatus =
  | "active"
  | "inactive"
  | "error"
  | "stale";

function getLocalLegacyDesktopAuth(walletAddress: string): {
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

function isAbortError(error: unknown, signal?: AbortSignal): boolean {
  return (
    signal?.aborted === true ||
    (typeof error === "object" &&
      error !== null &&
      "name" in error &&
      error.name === "AbortError")
  );
}

function isSessionUpgradeRequiredError(error: unknown): boolean {
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

function buildRouterPath(
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

function buildConnectionShareFailureKey({
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

function getCachedConnectionShare(
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

function buildNativeConnectionShareUrls({
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

function buildLegacyDesktopConnectionSharePath({
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

function buildLegacyDesktopConnectionShareUrl({
  coreScheme,
  deepLinkPath,
}: {
  readonly coreScheme: string;
  readonly deepLinkPath: string;
}): string {
  return `${coreScheme}://${DeepLinkScope.NAVIGATE}${deepLinkPath}`;
}

function generateQrCodeSource({
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

async function fetchCoreAppsVersions(): Promise<OSInfo[]> {
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

const bodyScrollLock = (() => {
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

enum Mode {
  NAVIGATE,
  SHARE,
  APPS,
}

enum SubMode {
  BROWSER,
  APP,
  CORE,
}

const squareStyle = {
  width: "100%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

function getSubTabCount(activeTab: Mode, isElectron: boolean): number {
  if (activeTab === Mode.NAVIGATE) {
    return isElectron ? 2 : 3;
  }
  return isElectron ? 1 : 2;
}

function getSubTabLabel(activeTab: Mode): string {
  if (activeTab === Mode.APPS) {
    return t(HEADER_SHARE_LOCALE, "headerShare.menu.selectPlatform");
  }
  if (activeTab === Mode.SHARE) {
    return t(HEADER_SHARE_LOCALE, "headerShare.menu.openLinkIn");
  }
  return t(HEADER_SHARE_LOCALE, "headerShare.menu.openUrlIn");
}

function getFocusableElements(container: HTMLElement): HTMLElement[] {
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

export default function HeaderShare({
  isCollapsed = false,
}: {
  readonly isCollapsed?: boolean | undefined;
}) {
  const capacitor = useCapacitor();
  const isMobileDevice = useIsMobileDevice();
  const [showQRModal, setShowQRModal] = useState<boolean>(false);

  if (capacitor.isCapacitor || isMobileDevice) {
    return <></>;
  }

  return (
    <div className="tailwind-scope tw-relative tw-px-3">
      <button
        type="button"
        aria-label={t(HEADER_SHARE_LOCALE, "headerShare.trigger.ariaLabel")}
        title={t(HEADER_SHARE_LOCALE, "headerShare.trigger.title")}
        onClick={() => setShowQRModal(true)}
        className={`tw-block tw-h-[2.875rem] tw-w-full tw-cursor-pointer tw-rounded-xl tw-border-none tw-bg-transparent tw-px-2 tw-text-left tw-text-base tw-font-medium tw-text-iron-400 tw-no-underline tw-transition-colors tw-duration-200 focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-iron-500 focus-visible:tw-ring-offset-2 ${
          isCollapsed
            ? "desktop-hover:hover:tw-text-white"
            : "desktop-hover:hover:tw-bg-iron-900 desktop-hover:hover:tw-text-white"
        } active:tw-bg-transparent`}
        data-tooltip-id="sidebar-tooltip"
        data-tooltip-content="Share"
        data-tooltip-hidden={!isCollapsed}
      >
        <div
          className={`tw-flex tw-h-full tw-w-full tw-items-center ${
            isCollapsed ? "" : "tw-gap-x-2"
          }`}
        >
          <div className="tw-flex tw-w-10 tw-flex-shrink-0 tw-items-center tw-justify-center">
            <ShareIcon className="tw-h-6 tw-w-6 tw-flex-shrink-0" />
          </div>
          <span
            className={`tw-block tw-overflow-hidden tw-whitespace-nowrap tw-transition-all tw-duration-300 ${
              isCollapsed ? "tw-w-0 tw-opacity-0" : "tw-flex-1 tw-opacity-100"
            }`}
          >
            {t(HEADER_SHARE_LOCALE, "headerShare.trigger.text")}
          </span>
        </div>
      </button>
      <HeaderQRModal show={showQRModal} onClose={() => setShowQRModal(false)} />
    </div>
  );
}

export function HeaderQRModal({
  show,
  onClose,
}: {
  readonly show: boolean;
  readonly onClose: () => void;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchParamsString = searchParams?.toString() ?? "";
  const isMobile = useIsMobileDevice();

  const [shouldRender, setShouldRender] = useState(show);
  const [isVisible, setIsVisible] = useState(show);

  const { address: contextWalletAddress, hasValidWalletAuth } =
    useSeizeConnectContext();
  const { ensureActiveSessionV2WebSession, requestSessionUpgrade } = useAuth();
  const activeWalletAddress = contextWalletAddress ?? getWalletAddress();
  const hasWalletAddress = Boolean(activeWalletAddress);

  const [activeTab, setActiveTab] = useState<Mode>(
    hasValidWalletAuth || hasWalletAddress ? Mode.SHARE : Mode.NAVIGATE
  );
  const [activeSubTab, setActiveSubTab] = useState<SubMode>(SubMode.APP);

  const [navigateBrowserUrl, setNavigateBrowserUrl] = useState<string>("");
  const [navigateAppUrl, setNavigateAppUrl] = useState<string>("");
  const [shareConnectionAppUrl, setShareConnectionAppUrl] =
    useState<string>("");
  const [navigateCoreUrl, setNavigateCoreUrl] = useState<string>("");
  const [shareConnectionCoreUrl, setShareConnectionCoreUrl] =
    useState<string>("");
  const [mobileConnectionShareStatus, setMobileConnectionShareStatus] =
    useState<ConnectionShareStatus>(
      hasValidWalletAuth || hasWalletAddress ? "legacy-auth" : "unauthenticated"
    );
  const [desktopConnectionShareStatus, setDesktopConnectionShareStatus] =
    useState<ConnectionShareStatus>(
      hasValidWalletAuth || hasWalletAddress ? "legacy-auth" : "unauthenticated"
    );

  const [navigateBrowserSrc, setNavigateBrowserSrc] = useState<string>("");
  const [navigateAppSrc, setNavigateAppSrc] = useState<string>("");
  const [shareConnectionSrc, setShareConnectionSrc] = useState<string>("");

  const [urlCopied, setUrlCopied] = useState<boolean>(false);
  const onCloseRef = useRef(onClose);
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const previouslyFocusedElementRef = useRef<HTMLElement | null>(null);
  const connectionShareAbortRef = useRef<AbortController | null>(null);
  const shareGenerationIdRef = useRef(0);
  const cachedConnectionShareRef = useRef<CachedConnectionShare | null>(null);
  const visibleDisplayContentRef = useRef<DisplayContent | null>(null);
  const terminalConnectionShareFailuresRef = useRef<
    Map<string, TerminalConnectionShareStatus>
  >(new Map());

  const trapFocusInDialog = useCallback((event: KeyboardEvent) => {
    if (event.key !== "Tab") {
      return;
    }

    const dialog = dialogRef.current;
    if (!dialog) {
      return;
    }

    const focusableElements = getFocusableElements(dialog);
    if (focusableElements.length === 0) {
      event.preventDefault();
      dialog.focus();
      return;
    }

    const firstElement = focusableElements[0];
    const lastElement = focusableElements.at(-1);
    if (!firstElement || !lastElement) {
      event.preventDefault();
      dialog.focus();
      return;
    }
    const activeElement = document.activeElement as HTMLElement | null;
    const activeInsideDialog = activeElement
      ? dialog.contains(activeElement)
      : false;

    if (event.shiftKey) {
      if (
        !activeInsideDialog ||
        activeElement === firstElement ||
        activeElement === dialog
      ) {
        event.preventDefault();
        lastElement.focus();
      }
      return;
    }

    if (!activeInsideDialog || activeElement === lastElement) {
      event.preventDefault();
      firstElement.focus();
    }
  }, []);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
        copyTimeoutRef.current = null;
      }
    };
  }, []);

  const handleEscapeKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === "Tab") {
        trapFocusInDialog(event);
        return;
      }

      if (event.key === "Escape") {
        event.stopPropagation();
        event.preventDefault();
        onCloseRef.current();
      }
    },
    [trapFocusInDialog]
  );

  async function generateSources(
    walletAddress: string | null,
    signal?: AbortSignal
  ) {
    const generationId = ++shareGenerationIdRef.current;
    const isStaleGeneration = () =>
      generationId !== shareGenerationIdRef.current || signal?.aborted;

    setNavigateBrowserSrc("");
    setNavigateAppSrc("");
    setShareConnectionSrc("");

    const routerPath = buildRouterPath(pathname, searchParams);
    const appScheme = publicEnv.MOBILE_APP_SCHEME ?? "mobile6529";
    const coreScheme = publicEnv.CORE_SCHEME ?? "core6529";

    const browserUrl = `${globalThis.window.location.origin}${routerPath}`;
    const appUrl = `${appScheme}://${DeepLinkScope.NAVIGATE}${routerPath}`;
    const coreUrl = `${coreScheme}://${DeepLinkScope.NAVIGATE}${routerPath}`;

    setNavigateBrowserUrl(browserUrl);
    setNavigateAppUrl(appUrl);
    setNavigateCoreUrl(coreUrl);

    const shareConnectionAppUrl = await generateNativeConnectionShareUrl({
      appScheme,
      isStaleGeneration,
      signal,
      walletAddress,
      routerPath,
    });
    await generateLegacyDesktopConnectionShareUrl({
      coreScheme,
      isStaleGeneration,
      signal,
      walletAddress,
      routerPath,
    });

    if (isStaleGeneration()) {
      return;
    }

    generateQrCodeSource({
      url: browserUrl,
      setSource: setNavigateBrowserSrc,
      clearSource: () => setNavigateBrowserSrc(""),
      staleGeneration: isStaleGeneration,
      signal,
      errorMessage: "Failed to generate browser QR code",
    });

    generateQrCodeSource({
      url: appUrl,
      setSource: setNavigateAppSrc,
      clearSource: () => setNavigateAppSrc(""),
      staleGeneration: isStaleGeneration,
      signal,
      errorMessage: "Failed to generate mobile app QR code",
    });

    if (shareConnectionAppUrl) {
      generateQrCodeSource({
        url: shareConnectionAppUrl,
        setSource: setShareConnectionSrc,
        clearSource: () => setShareConnectionSrc(""),
        staleGeneration: isStaleGeneration,
        signal,
        errorMessage: "Failed to generate share connection QR code",
      });
    }
  }

  async function generateNativeConnectionShareUrl({
    appScheme,
    isStaleGeneration,
    routerPath,
    signal,
    walletAddress,
  }: {
    readonly appScheme: string;
    readonly isStaleGeneration: IsStaleGeneration;
    readonly signal?: AbortSignal | undefined;
    readonly walletAddress: string | null;
    readonly routerPath: string;
  }): Promise<string> {
    if (!walletAddress) {
      setUnavailableMobileConnectionShare("unauthenticated");
      return "";
    }

    const addressKey = walletAddress.toLowerCase();
    const failureKey = buildConnectionShareFailureKey({
      addressKey,
      routerPath,
      target: "mobile",
    });
    const terminalFailure =
      terminalConnectionShareFailuresRef.current.get(failureKey);
    if (terminalFailure) {
      setUnavailableMobileConnectionShare(terminalFailure);
      return "";
    }

    try {
      setMobileConnectionShareStatus("loading");
      const verificationStatus = await verifyConnectionShareV2Session({
        isStaleGeneration,
        signal,
        walletAddress,
      });
      if (verificationStatus === "stale") {
        return "";
      }

      if (verificationStatus === "error") {
        setUnavailableMobileConnectionShare("error");
        return "";
      }

      if (verificationStatus === "inactive") {
        terminalConnectionShareFailuresRef.current.set(
          failureKey,
          "legacy-auth"
        );
        setUnavailableMobileConnectionShare("legacy-auth");
        return "";
      }

      const cachedShare = getCachedConnectionShare(
        cachedConnectionShareRef.current,
        addressKey
      );
      const share = cachedShare ?? (await createConnectionShare({ signal }));

      if (isStaleGeneration()) {
        return "";
      }

      cacheConnectionShare(addressKey, share);
      const shareUrls = buildNativeConnectionShareUrls({
        share,
        appScheme,
      });

      terminalConnectionShareFailuresRef.current.delete(failureKey);
      setMobileConnectionShareStatus("ready");
      setShareConnectionAppUrl(shareUrls.appUrl);
      return shareUrls.appUrl;
    } catch (error: unknown) {
      if (isStaleGeneration() || isAbortError(error, signal)) {
        return "";
      }

      console.error("Failed to create connection share", error);
      const terminalStatus: TerminalConnectionShareStatus =
        isSessionUpgradeRequiredError(error) ? "legacy-auth" : "error";
      terminalConnectionShareFailuresRef.current.set(
        failureKey,
        terminalStatus
      );
      setUnavailableMobileConnectionShare(terminalStatus);
      return "";
    }
  }

  async function verifyConnectionShareV2Session({
    isStaleGeneration,
    signal,
    walletAddress,
  }: {
    readonly isStaleGeneration: IsStaleGeneration;
    readonly signal?: AbortSignal | undefined;
    readonly walletAddress: string;
  }): Promise<ConnectionShareSessionVerificationStatus> {
    try {
      const hasActiveSession = ensureActiveSessionV2WebSession
        ? await ensureActiveSessionV2WebSession({
            address: walletAddress,
            abortSignal: signal,
          })
        : false;

      if (isStaleGeneration() || signal?.aborted) {
        return "stale";
      }

      return hasActiveSession ? "active" : "inactive";
    } catch (error: unknown) {
      if (isStaleGeneration() || isAbortError(error, signal)) {
        return "stale";
      }

      console.error("Failed to verify active web session", error);
      return "error";
    }
  }

  async function generateLegacyDesktopConnectionShareUrl({
    coreScheme,
    isStaleGeneration,
    routerPath,
    signal,
    walletAddress,
  }: {
    readonly coreScheme: string;
    readonly isStaleGeneration: IsStaleGeneration;
    readonly signal?: AbortSignal | undefined;
    readonly walletAddress: string | null;
    readonly routerPath: string;
  }): Promise<string> {
    if (!walletAddress) {
      setUnavailableDesktopConnectionShare("unauthenticated");
      return "";
    }

    const localLegacyDesktopAuth = getLocalLegacyDesktopAuth(walletAddress);
    if (localLegacyDesktopAuth) {
      const legacyPath = buildLegacyDesktopConnectionSharePath({
        token: localLegacyDesktopAuth.refreshToken,
        address: walletAddress,
        role: localLegacyDesktopAuth.role,
      });
      const coreUrl = buildLegacyDesktopConnectionShareUrl({
        coreScheme,
        deepLinkPath: legacyPath,
      });
      setDesktopConnectionShareStatus("ready");
      setShareConnectionCoreUrl(coreUrl);
      return coreUrl;
    }

    const addressKey = walletAddress.toLowerCase();
    const failureKey = buildConnectionShareFailureKey({
      addressKey,
      routerPath,
      target: "desktop",
    });
    const terminalFailure =
      terminalConnectionShareFailuresRef.current.get(failureKey);
    if (terminalFailure) {
      setUnavailableDesktopConnectionShare(terminalFailure);
      return "";
    }

    try {
      setDesktopConnectionShareStatus("loading");
      const verificationStatus = await verifyConnectionShareV2Session({
        isStaleGeneration,
        signal,
        walletAddress,
      });
      if (verificationStatus === "stale") {
        return "";
      }

      if (verificationStatus === "error") {
        setUnavailableDesktopConnectionShare("error");
        return "";
      }

      if (verificationStatus === "inactive") {
        terminalConnectionShareFailuresRef.current.set(
          failureKey,
          "legacy-auth"
        );
        setUnavailableDesktopConnectionShare("legacy-auth");
        return "";
      }

      const share = await createLegacyDesktopConnectionShare({ signal });

      if (isStaleGeneration()) {
        return "";
      }

      const coreUrl = buildLegacyDesktopConnectionShareUrl({
        coreScheme,
        deepLinkPath: share.deep_link_path,
      });

      terminalConnectionShareFailuresRef.current.delete(failureKey);
      setDesktopConnectionShareStatus("ready");
      setShareConnectionCoreUrl(coreUrl);
      return coreUrl;
    } catch (error: unknown) {
      if (isStaleGeneration() || isAbortError(error, signal)) {
        return "";
      }

      console.error("Failed to create legacy desktop connection share", error);
      const terminalStatus: TerminalConnectionShareStatus =
        isSessionUpgradeRequiredError(error) ? "legacy-auth" : "error";
      terminalConnectionShareFailuresRef.current.set(
        failureKey,
        terminalStatus
      );
      setUnavailableDesktopConnectionShare(terminalStatus);
      return "";
    }
  }

  function cacheConnectionShare(
    addressKey: string,
    share: NativeConnectionShare
  ): void {
    const expiresAtMs = Date.parse(share.expires_at);
    if (Number.isFinite(expiresAtMs)) {
      cachedConnectionShareRef.current = {
        addressKey,
        expiresAtMs,
        share,
      };
    }
  }

  function setUnavailableMobileConnectionShare(
    status: ConnectionShareStatus
  ): void {
    setMobileConnectionShareStatus(status);
    setShareConnectionAppUrl("");
    setShareConnectionSrc("");
  }

  function setUnavailableDesktopConnectionShare(
    status: ConnectionShareStatus
  ): void {
    setDesktopConnectionShareStatus(status);
    setShareConnectionCoreUrl("");
  }

  useEffect(() => {
    terminalConnectionShareFailuresRef.current.clear();
  }, [activeWalletAddress, hasValidWalletAuth]);

  useEffect(() => {
    if (!show) {
      shareGenerationIdRef.current += 1;
      cachedConnectionShareRef.current = null;
      terminalConnectionShareFailuresRef.current.clear();
      connectionShareAbortRef.current?.abort();
      connectionShareAbortRef.current = null;
      const nextStatus: ConnectionShareStatus =
        hasValidWalletAuth || hasWalletAddress
          ? "legacy-auth"
          : "unauthenticated";
      setMobileConnectionShareStatus(nextStatus);
      setDesktopConnectionShareStatus(nextStatus);
      setShareConnectionAppUrl("");
      setShareConnectionCoreUrl("");
      setShareConnectionSrc("");
      return;
    }

    visibleDisplayContentRef.current = null;
    connectionShareAbortRef.current?.abort();
    const controller = new AbortController();
    connectionShareAbortRef.current = controller;

    void generateSources(activeWalletAddress, controller.signal);

    return () => {
      shareGenerationIdRef.current += 1;
      controller.abort();
      if (connectionShareAbortRef.current === controller) {
        connectionShareAbortRef.current = null;
      }
    };
  }, [
    show,
    hasValidWalletAuth,
    hasWalletAddress,
    activeWalletAddress,
    pathname,
    searchParamsString,
  ]);

  useEffect(() => {
    setActiveTab(
      hasValidWalletAuth || hasWalletAddress ? Mode.SHARE : Mode.NAVIGATE
    );
    setActiveSubTab(SubMode.APP);
    if (show) return;
    const timer = setTimeout(() => {
      setNavigateBrowserSrc("");
      setNavigateAppSrc("");
      setShareConnectionSrc("");
    }, 150);
    return () => clearTimeout(timer);
  }, [show, hasValidWalletAuth, hasWalletAddress]);

  useEffect(() => {
    if (show) {
      setShouldRender(true);
      const raf = requestAnimationFrame(() => setIsVisible(true));
      return () => cancelAnimationFrame(raf);
    }

    setIsVisible(false);
    const timeout = setTimeout(() => {
      visibleDisplayContentRef.current = null;
      setShouldRender(false);
    }, 200);
    return () => clearTimeout(timeout);
  }, [show]);

  useEffect(() => {
    if (!shouldRender) {
      return;
    }

    bodyScrollLock.lock();
    globalThis.addEventListener("keydown", handleEscapeKeyDown);

    return () => {
      bodyScrollLock.unlock();
      globalThis.removeEventListener("keydown", handleEscapeKeyDown);
    };
  }, [shouldRender, handleEscapeKeyDown]);

  useEffect(() => {
    if (!shouldRender) {
      return;
    }

    const activeElement = document.activeElement;
    previouslyFocusedElementRef.current =
      activeElement instanceof HTMLElement ? activeElement : null;

    const raf = requestAnimationFrame(() => {
      const dialog = dialogRef.current;
      if (!dialog) {
        return;
      }

      const focusableElements = getFocusableElements(dialog);
      const firstFocusableElement = focusableElements[0];
      if (firstFocusableElement) {
        firstFocusableElement.focus();
        return;
      }

      dialog.focus();
    });

    return () => {
      cancelAnimationFrame(raf);
      previouslyFocusedElementRef.current?.focus();
    };
  }, [shouldRender]);

  const renderQRCodeImage = (src: string, alt: string) => {
    const normalizedSrc = src?.trim();

    return (
      <div className="tw-relative tw-h-full tw-w-full">
        {normalizedSrc ? (
          <Image
            unoptimized
            priority
            loading="eager"
            src={normalizedSrc}
            alt={alt}
            fill
            sizes="(max-width: 768px) 92vw, 28rem"
            className="unselectable tw-object-contain"
          />
        ) : (
          <div className="tw-h-full tw-w-full tw-animate-pulse tw-rounded-md tw-bg-iron-900/40" />
        )}
      </div>
    );
  };

  const renderCoreLink = (url: string) => {
    return (
      <div className="tw-flex tw-items-center tw-gap-2" style={squareStyle}>
        <a
          href={url}
          className="decoration-none tw-flex tw-flex-col tw-items-center tw-gap-8"
        >
          <Image
            unoptimized
            priority
            loading="eager"
            src="/6529Core.png"
            alt={t(HEADER_SHARE_LOCALE, "headerShare.core.alt")}
            width={150}
            height={150}
            className="unselectable"
          />
          <div className="tw-flex tw-w-full tw-items-center tw-justify-center tw-gap-2 tw-rounded-lg tw-bg-iron-200 tw-px-4 tw-py-3 tw-text-iron-900">
            <FontAwesomeIcon icon={faExternalLink} />
            <div className="no-wrap">
              {t(HEADER_SHARE_LOCALE, "headerShare.core.open")}
            </div>
          </div>
        </a>
      </div>
    );
  };

  const getNavigateContent = () => {
    if (activeSubTab === SubMode.BROWSER) {
      return {
        content: renderQRCodeImage(
          navigateBrowserSrc,
          t(HEADER_SHARE_LOCALE, "headerShare.qr.browserAlt")
        ),
        url: navigateBrowserUrl,
      };
    }

    if (activeSubTab === SubMode.CORE) {
      return {
        content: renderCoreLink(navigateCoreUrl),
        url: navigateCoreUrl,
      };
    }

    return {
      content: renderQRCodeImage(
        navigateAppSrc,
        t(HEADER_SHARE_LOCALE, "headerShare.qr.mobileAlt")
      ),
      url: navigateAppUrl,
    };
  };

  const getShareContent = () => {
    const activeConnectionShareStatus =
      activeSubTab === SubMode.CORE
        ? desktopConnectionShareStatus
        : mobileConnectionShareStatus;
    if (activeConnectionShareStatus !== "ready") {
      return {
        content: renderConnectionShareNotice(activeConnectionShareStatus),
        url: "",
      };
    }

    if (activeSubTab === SubMode.CORE) {
      return {
        content: renderCoreLink(shareConnectionCoreUrl),
        url: shareConnectionCoreUrl,
      };
    }

    if (activeSubTab === SubMode.APP) {
      return {
        content: renderQRCodeImage(
          shareConnectionSrc,
          t(HEADER_SHARE_LOCALE, "headerShare.qr.shareConnectionAlt")
        ),
        url: shareConnectionAppUrl,
      };
    }

    return {
      content: (
        <span>{t(HEADER_SHARE_LOCALE, "headerShare.invalidShareSubmode")}</span>
      ),
      url: "",
    };
  };

  const renderConnectionShareNotice = (status: ConnectionShareStatus) => {
    const isLegacyAuth = status === "legacy-auth";
    const title = (() => {
      if (isLegacyAuth) {
        return t(
          HEADER_SHARE_LOCALE,
          "headerShare.connectionNotice.legacyTitle"
        );
      }
      if (status === "loading") {
        return t(
          HEADER_SHARE_LOCALE,
          "headerShare.connectionNotice.loadingTitle"
        );
      }
      if (status === "error") {
        return t(
          HEADER_SHARE_LOCALE,
          "headerShare.connectionNotice.errorTitle"
        );
      }
      return t(
        HEADER_SHARE_LOCALE,
        "headerShare.connectionNotice.unauthenticatedTitle"
      );
    })();
    const message = (() => {
      if (isLegacyAuth) {
        return t(
          HEADER_SHARE_LOCALE,
          "headerShare.connectionNotice.legacyMessage"
        );
      }
      if (status === "loading") {
        return t(
          HEADER_SHARE_LOCALE,
          "headerShare.connectionNotice.loadingMessage"
        );
      }
      if (status === "error") {
        return t(
          HEADER_SHARE_LOCALE,
          "headerShare.connectionNotice.errorMessage"
        );
      }
      return t(
        HEADER_SHARE_LOCALE,
        "headerShare.connectionNotice.unauthenticatedMessage"
      );
    })();

    return (
      <div
        className="tw-flex tw-h-full tw-w-full tw-flex-col tw-items-center tw-justify-center tw-gap-5 tw-rounded-xl tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900/50 tw-p-8 tw-text-center"
        style={squareStyle}
      >
        <div className="tw-flex tw-flex-col tw-gap-2">
          <div className="tw-text-lg tw-font-semibold tw-text-iron-50">
            {title}
          </div>
          <div className="tw-text-sm tw-leading-6 tw-text-iron-300">
            {message}
          </div>
        </div>
        {isLegacyAuth && (
          <div className="tw-flex tw-w-full tw-gap-3">
            <button
              type="button"
              className="tw-h-10 tw-flex-1 tw-rounded-lg tw-border tw-border-solid tw-border-iron-600 tw-bg-transparent tw-px-4 tw-text-sm tw-font-semibold tw-text-iron-200 hover:tw-bg-iron-800"
              onClick={onClose}
            >
              {t(HEADER_SHARE_LOCALE, "headerShare.connectionNotice.cancel")}
            </button>
            <button
              type="button"
              className="tw-h-10 tw-flex-1 tw-rounded-lg tw-border-0 tw-bg-iron-100 tw-px-4 tw-text-sm tw-font-semibold tw-text-iron-950 hover:tw-bg-white"
              onClick={() => {
                onClose();
                terminalConnectionShareFailuresRef.current.clear();
                requestSessionUpgrade?.().catch((error: unknown) => {
                  console.error("Failed to request session upgrade", error);
                });
              }}
            >
              {t(HEADER_SHARE_LOCALE, "headerShare.connectionNotice.update")}
            </button>
          </div>
        )}
      </div>
    );
  };

  const getAppsContent = () => {
    if (activeSubTab === SubMode.CORE) {
      return { content: <CoreAppsDownload />, url: "" };
    }

    return {
      content: (
        <div
          className="tw-flex tw-flex-col tw-items-center tw-justify-center tw-gap-12 tw-p-10"
          style={squareStyle}
        >
          <ShareMobileApp platform="ios" />
          <ShareMobileApp platform="android" />
        </div>
      ),
      url: "",
    };
  };

  const getCurrentDisplayContent = (): DisplayContent => {
    if (activeTab === Mode.NAVIGATE) {
      return getNavigateContent();
    }

    if (activeTab === Mode.SHARE) {
      return getShareContent();
    }

    return getAppsContent();
  };

  const getDisplayContent = (): DisplayContent => {
    if (!show && visibleDisplayContentRef.current) {
      return visibleDisplayContentRef.current;
    }

    const displayContent = getCurrentDisplayContent();
    if (show) {
      visibleDisplayContentRef.current = displayContent;
    }
    return displayContent;
  };

  function printImage() {
    const { content, url } = getDisplayContent();

    return (
      <div className="tw-flex tw-flex-col tw-gap-2">
        <div className="tw-relative tw-aspect-square tw-w-full tw-overflow-hidden">
          <div className="tw-absolute tw-inset-0 tw-flex tw-items-center tw-justify-center">
            {content}
          </div>
        </div>
        {url ? (
          <div className="tw-flex tw-h-10 tw-items-center tw-gap-2 tw-rounded-lg tw-bg-iron-900 tw-px-3">
            <div
              className="tw-min-w-0 tw-flex-1 tw-overflow-hidden tw-text-ellipsis tw-whitespace-nowrap tw-text-sm tw-text-iron-400"
              title={url}
            >
              {url}
            </div>
            <button
              type="button"
              aria-label={t(HEADER_SHARE_LOCALE, "headerShare.copy.ariaLabel")}
              className="tw-inline-flex tw-h-8 tw-w-8 tw-items-center tw-justify-center tw-rounded-md tw-border-0 tw-bg-transparent tw-text-iron-400 tw-transition-colors hover:tw-bg-iron-800 hover:tw-text-iron-100"
              data-tooltip-id="copy-url-tooltip"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(url);
                  setUrlCopied(true);
                  if (copyTimeoutRef.current) {
                    clearTimeout(copyTimeoutRef.current);
                  }
                  copyTimeoutRef.current = setTimeout(() => {
                    setUrlCopied(false);
                    copyTimeoutRef.current = null;
                  }, 500);
                } catch (error) {
                  console.error("Failed to copy share URL to clipboard", error);
                }
              }}
            >
              <FontAwesomeIcon
                icon={faCopy}
                className={urlCopied ? "tw-text-green-500" : ""}
              />
            </button>
            <Tooltip
              id="copy-url-tooltip"
              place="top-end"
              content={
                urlCopied
                  ? t(HEADER_SHARE_LOCALE, "headerShare.copy.copied")
                  : t(HEADER_SHARE_LOCALE, "headerShare.copy.default")
              }
              openEvents={isMobile ? { click: true } : { mouseenter: true }}
              closeEvents={isMobile ? { click: true } : { mouseleave: true }}
              positionStrategy="fixed"
              style={{
                zIndex: 10000,
                backgroundColor: "#1F2937",
                color: "white",
                opacity: 1,
                padding: "4px 8px",
              }}
            />
          </div>
        ) : (
          <div className="tw-h-10" />
        )}
      </div>
    );
  }

  if (!shouldRender) {
    return null;
  }

  return (
    <div
      className={`tailwind-scope tw-fixed tw-inset-0 tw-z-50 tw-flex tw-items-center tw-justify-center tw-bg-black/70 tw-p-2 tw-transition-opacity tw-duration-200 sm:tw-p-4 ${
        isVisible ? "tw-opacity-100" : "tw-opacity-0"
      }`}
    >
      <button
        type="button"
        aria-label={t(HEADER_SHARE_LOCALE, "headerShare.modal.closeAriaLabel")}
        className="tw-absolute tw-inset-0 tw-border-0 tw-bg-transparent"
        onClick={onClose}
      />
      <dialog
        ref={dialogRef}
        open
        tabIndex={-1}
        aria-modal="true"
        aria-labelledby="header-share-title"
        data-testid="header-share-modal"
        className={`tw-relative tw-flex tw-w-full tw-max-w-md tw-flex-col tw-overflow-y-auto tw-rounded-xl tw-border tw-border-iron-700 tw-bg-iron-950 tw-text-left tw-shadow-xl tw-transition-all tw-duration-200 ${
          isVisible
            ? "tw-translate-y-0 tw-scale-100 tw-opacity-100"
            : "tw-translate-y-1 tw-scale-95 tw-opacity-0"
        }`}
      >
        <div className="tw-flex tw-flex-col tw-gap-2">
          <h2 id="header-share-title" className="tw-sr-only">
            {t(HEADER_SHARE_LOCALE, "headerShare.modal.title")}
          </h2>
          <ModalMenu
            activeTab={activeTab}
            activeSubTab={activeSubTab}
            onTabChange={(tab, subTab) => {
              setActiveTab(tab);
              setActiveSubTab(subTab);
            }}
          />
          {printImage()}
        </div>
      </dialog>
    </div>
  );
}

function ModalMenu({
  activeTab,
  activeSubTab,
  onTabChange,
}: {
  readonly activeTab: Mode;
  readonly activeSubTab: SubMode;
  readonly onTabChange: (tab: Mode, subTab: SubMode) => void;
}) {
  const isElectron = useElectron() ?? false;
  const topTabCount = 3;
  const subTabCount = getSubTabCount(activeTab, isElectron);
  const subTabLabel = getSubTabLabel(activeTab);
  const getMenuButtonClass = (active: boolean) => {
    const baseClassName =
      "tw-inline-flex tw-h-10 tw-w-full tw-min-w-0 tw-items-center tw-justify-center tw-overflow-hidden tw-text-ellipsis tw-whitespace-nowrap tw-rounded-xl tw-border-0 tw-px-2 tw-text-[15px] tw-font-medium tw-transition tw-duration-200";

    if (active) {
      return `${baseClassName} tw-bg-iron-700 tw-text-iron-50`;
    }

    return `${baseClassName} tw-bg-iron-900 tw-text-iron-400 hover:tw-bg-iron-800 hover:tw-text-iron-100`;
  };

  return (
    <div className="tw-flex tw-flex-col tw-gap-2">
      <div className="tw-flex tw-flex-col tw-gap-1">
        <div className="tw-px-1 tw-text-[11px] tw-font-bold tw-uppercase tw-tracking-[0.08em] tw-text-iron-500">
          {t(HEADER_SHARE_LOCALE, "headerShare.menu.shareType")}
        </div>
        <div
          className="tw-grid tw-gap-2"
          style={{
            gridTemplateColumns: `repeat(${topTabCount}, minmax(0, 1fr))`,
          }}
        >
          <button
            type="button"
            disabled={activeTab === Mode.SHARE}
            className={getMenuButtonClass(activeTab === Mode.SHARE)}
            onClick={() => onTabChange(Mode.SHARE, SubMode.APP)}
          >
            {t(HEADER_SHARE_LOCALE, "headerShare.menu.connection")}
          </button>
          <button
            type="button"
            disabled={activeTab === Mode.NAVIGATE}
            className={getMenuButtonClass(activeTab === Mode.NAVIGATE)}
            onClick={() => onTabChange(Mode.NAVIGATE, SubMode.APP)}
          >
            {t(HEADER_SHARE_LOCALE, "headerShare.menu.currentUrl")}
          </button>
          <button
            type="button"
            disabled={activeTab === Mode.APPS}
            className={getMenuButtonClass(activeTab === Mode.APPS)}
            onClick={() => onTabChange(Mode.APPS, SubMode.APP)}
          >
            {t(HEADER_SHARE_LOCALE, "headerShare.menu.apps")}
          </button>
        </div>
      </div>

      <div className="tw-flex tw-flex-col tw-gap-1">
        <div className="tw-px-1 tw-text-[11px] tw-font-bold tw-uppercase tw-tracking-[0.08em] tw-text-iron-500">
          {subTabLabel}
        </div>
        <div
          className="tw-grid tw-gap-2"
          style={{
            gridTemplateColumns: `repeat(${subTabCount}, minmax(0, 1fr))`,
          }}
        >
          <button
            type="button"
            disabled={activeSubTab === SubMode.APP}
            className={getMenuButtonClass(activeSubTab === SubMode.APP)}
            onClick={() => onTabChange(activeTab, SubMode.APP)}
          >
            <span>{t(HEADER_SHARE_LOCALE, "headerShare.menu.mobile")}</span>
          </button>
          {activeTab === Mode.NAVIGATE && (
            <button
              type="button"
              disabled={activeSubTab === SubMode.BROWSER}
              className={getMenuButtonClass(activeSubTab === SubMode.BROWSER)}
              onClick={() => onTabChange(activeTab, SubMode.BROWSER)}
            >
              <span>{t(HEADER_SHARE_LOCALE, "headerShare.menu.browser")}</span>
            </button>
          )}
          {!isElectron && (
            <button
              type="button"
              disabled={activeSubTab === SubMode.CORE}
              className={getMenuButtonClass(activeSubTab === SubMode.CORE)}
              onClick={() => onTabChange(activeTab, SubMode.CORE)}
            >
              <span>{t(HEADER_SHARE_LOCALE, "headerShare.menu.desktop")}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function CoreAppsDownload() {
  const { data: versions = [] } = useQuery({
    queryKey: ["core-apps-versions"],
    queryFn: fetchCoreAppsVersions,
    staleTime: 5 * 60 * 1000,
  });

  return (
    <div style={squareStyle}>
      <div className="tw-inline-flex tw-flex-col tw-gap-10">
        {versions.map((version) => (
          <CoreAppDownload
            key={version.name}
            platform={version.displayName}
            icon={version.image}
            title={version.displayName}
            downloadPath={version.downloadPath}
            version={version.version ?? ""}
          />
        ))}
      </div>
    </div>
  );
}

function CoreAppDownload({
  platform,
  icon,
  title,
  downloadPath,
  version,
}: {
  readonly platform: string;
  readonly icon: string;
  readonly title: string;
  readonly downloadPath: string;
  readonly version: string;
}) {
  if (!version) {
    return null;
  }

  const url = `https://d3lqz0a4bldqgf.cloudfront.net/${downloadPath}/${version}.html`;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="decoration-none tw-flex tw-w-full tw-items-center tw-gap-4 tw-rounded-lg tw-border tw-border-solid tw-border-white tw-bg-black tw-px-5 tw-py-3 tw-transition-all tw-duration-300 tw-ease-out hover:tw-scale-[1.03]"
    >
      <div className="tw-rounded-full tw-bg-white tw-p-4">
        <Image
          unoptimized
          priority
          loading="eager"
          src={icon}
          alt={title}
          width={40}
          height={40}
          className="unselectable"
        />
      </div>
      <div className="tw-flex tw-w-full tw-items-center tw-gap-2">
        <div className="no-wrap tw-text-lg tw-font-medium">
          {platform} v{version}
        </div>
      </div>
    </a>
  );
}

"use client";

import { publicEnv } from "@/config/env";
import { faCopy, faExternalLink } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { ShareIcon } from "@heroicons/react/24/outline";
import yaml from "js-yaml";
import Image from "next/image";
import { usePathname, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Tooltip } from "react-tooltip";
import { useAuth } from "@/components/auth/Auth";
import useIsMobileDevice from "@/hooks/isMobileDevice";
import useCapacitor from "@/hooks/useCapacitor";
import { DeepLinkScope } from "@/hooks/useDeepLinkNavigation";
import { useElectron } from "@/hooks/useElectron";
import { getWalletAddress } from "@/services/auth/auth.utils";
import { createConnectionShare } from "@/services/auth/session-v2.utils";
import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import { ShareMobileApp } from "./HeaderShareMobileApps";

const QRCode = require("qrcode");

type ConnectionShare = Awaited<ReturnType<typeof createConnectionShare>>;

type CachedConnectionShare = {
  readonly addressKey: string;
  readonly expiresAtMs: number;
  readonly share: ConnectionShare;
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
}: {
  readonly addressKey: string;
  readonly routerPath: string;
}): string {
  return `${addressKey}:${routerPath}`;
}

function getCachedConnectionShare(
  cachedShare: CachedConnectionShare | null,
  addressKey: string
): ConnectionShare | null {
  if (cachedShare?.addressKey === addressKey) {
    const isReusable = cachedShare.expiresAtMs > Date.now() + 30_000;
    if (isReusable) {
      return cachedShare.share;
    }
  }

  return null;
}

function buildConnectionShareUrls({
  share,
  appScheme,
  coreScheme,
}: {
  readonly share: ConnectionShare;
  readonly appScheme: string;
  readonly coreScheme: string;
}): {
  readonly appUrl: string;
  readonly coreUrl: string;
} {
  const shareParams = new URLSearchParams({
    connection_share_code: share.connection_share_code,
    address: share.address,
  });

  return {
    appUrl: `${appScheme}://${DeepLinkScope.SHARE_CONNECTION}?${shareParams.toString()}`,
    coreUrl: `${coreScheme}://${DeepLinkScope.NAVIGATE}${share.deep_link_path}`,
  };
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
    return "Select Platform";
  }
  if (activeTab === Mode.SHARE) {
    return "Open Link In";
  }
  return "Open URL In";
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
        aria-label="QR Code"
        title="QR Code"
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
            Share
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

  const { hasValidWalletAuth } = useSeizeConnectContext();
  const { requestSessionUpgrade } = useAuth();
  const activeWalletAddress = getWalletAddress();
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
  const [connectionShareStatus, setConnectionShareStatus] =
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

    const shareConnectionAppUrl = await generateConnectionShareUrls({
      appScheme,
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

  async function generateConnectionShareUrls({
    appScheme,
    coreScheme,
    isStaleGeneration,
    routerPath,
    signal,
    walletAddress,
  }: {
    readonly appScheme: string;
    readonly coreScheme: string;
    readonly isStaleGeneration: IsStaleGeneration;
    readonly signal?: AbortSignal | undefined;
    readonly walletAddress: string | null;
    readonly routerPath: string;
  }): Promise<string> {
    if (!walletAddress) {
      setUnavailableConnectionShare("unauthenticated");
      return "";
    }

    const addressKey = walletAddress.toLowerCase();
    const failureKey = buildConnectionShareFailureKey({
      addressKey,
      routerPath,
    });
    const terminalFailure =
      terminalConnectionShareFailuresRef.current.get(failureKey);
    if (terminalFailure) {
      setUnavailableConnectionShare(terminalFailure);
      return "";
    }

    try {
      setConnectionShareStatus("loading");
      const cachedShare = getCachedConnectionShare(
        cachedConnectionShareRef.current,
        addressKey
      );
      const share = cachedShare ?? (await createConnectionShare({ signal }));

      if (isStaleGeneration()) {
        return "";
      }

      cacheConnectionShare(addressKey, share);
      const shareUrls = buildConnectionShareUrls({
        share,
        appScheme,
        coreScheme,
      });

      terminalConnectionShareFailuresRef.current.delete(failureKey);
      setConnectionShareStatus("ready");
      setShareConnectionAppUrl(shareUrls.appUrl);
      setShareConnectionCoreUrl(shareUrls.coreUrl);
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
      setUnavailableConnectionShare(terminalStatus);
      return "";
    }
  }

  function cacheConnectionShare(
    addressKey: string,
    share: ConnectionShare
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

  function setUnavailableConnectionShare(status: ConnectionShareStatus): void {
    setConnectionShareStatus(status);
    setShareConnectionAppUrl("");
    setShareConnectionCoreUrl("");
    setShareConnectionSrc("");
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
      setConnectionShareStatus(
        hasValidWalletAuth || hasWalletAddress
          ? "legacy-auth"
          : "unauthenticated"
      );
      setShareConnectionAppUrl("");
      setShareConnectionCoreUrl("");
      setShareConnectionSrc("");
      return;
    }

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
    const timeout = setTimeout(() => setShouldRender(false), 200);
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
            alt="6529 Desktop"
            width={150}
            height={150}
            className="unselectable"
          />
          <div className="tw-flex tw-w-full tw-items-center tw-justify-center tw-gap-2 tw-rounded-lg tw-bg-iron-200 tw-px-4 tw-py-3 tw-text-iron-900">
            <FontAwesomeIcon icon={faExternalLink} />
            <div className="no-wrap">Open in 6529 Desktop</div>
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
          "Browser Link - QR Code"
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
      content: renderQRCodeImage(navigateAppSrc, "Mobile App Link - QR Code"),
      url: navigateAppUrl,
    };
  };

  const getShareContent = () => {
    if (connectionShareStatus !== "ready") {
      return {
        content: renderConnectionShareNotice(connectionShareStatus),
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
          "Share Connection - QR Code"
        ),
        url: shareConnectionAppUrl,
      };
    }

    return { content: <span>Invalid submode for SHARE</span>, url: "" };
  };

  const renderConnectionShareNotice = (status: ConnectionShareStatus) => {
    const isLegacyAuth = status === "legacy-auth";
    const title = (() => {
      if (isLegacyAuth) {
        return "Update Authentication";
      }
      if (status === "loading") {
        return "Preparing Connection";
      }
      if (status === "error") {
        return "Connection Sharing Unavailable";
      }
      return "Sign In Required";
    })();
    const message = (() => {
      if (isLegacyAuth) {
        return "You can't share a connection from your current authentication. Update to the new secure session first.";
      }
      if (status === "loading") {
        return "Creating a one-time connection code.";
      }
      if (status === "error") {
        return "We couldn't create a connection share. Close this dialog and try again.";
      }
      return "Connect and authenticate your wallet before sharing a connection.";
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
              Cancel
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
              Update
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

  const getDisplayContent = () => {
    if (activeTab === Mode.NAVIGATE) {
      return getNavigateContent();
    }

    if (activeTab === Mode.SHARE) {
      return getShareContent();
    }

    return getAppsContent();
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
              aria-label="Copy URL"
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
              content={urlCopied ? "Copied!" : "Copy URL"}
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
        aria-label="Close share modal"
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
            Share
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
          Share Type
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
            Connection
          </button>
          <button
            type="button"
            disabled={activeTab === Mode.NAVIGATE}
            className={getMenuButtonClass(activeTab === Mode.NAVIGATE)}
            onClick={() => onTabChange(Mode.NAVIGATE, SubMode.APP)}
          >
            Current URL
          </button>
          <button
            type="button"
            disabled={activeTab === Mode.APPS}
            className={getMenuButtonClass(activeTab === Mode.APPS)}
            onClick={() => onTabChange(Mode.APPS, SubMode.APP)}
          >
            6529 Apps
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
            <span>6529 Mobile</span>
          </button>
          {activeTab === Mode.NAVIGATE && (
            <button
              type="button"
              disabled={activeSubTab === SubMode.BROWSER}
              className={getMenuButtonClass(activeSubTab === SubMode.BROWSER)}
              onClick={() => onTabChange(activeTab, SubMode.BROWSER)}
            >
              <span>Browser</span>
            </button>
          )}
          {!isElectron && (
            <button
              type="button"
              disabled={activeSubTab === SubMode.CORE}
              className={getMenuButtonClass(activeSubTab === SubMode.CORE)}
              onClick={() => onTabChange(activeTab, SubMode.CORE)}
            >
              <span>6529 Desktop</span>
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

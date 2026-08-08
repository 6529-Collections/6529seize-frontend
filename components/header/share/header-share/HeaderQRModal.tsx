"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { publicEnv } from "@/config/env";
import { usePathname, useSearchParams } from "next/navigation";

import { useAuth } from "@/components/auth/Auth";
import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import { getWalletAddress } from "@/services/auth/auth.utils";
import useIsMobileDevice from "@/hooks/isMobileDevice";
import { useElectron } from "@/hooks/useElectron";
import {
  createConnectionShare,
  createLegacyDesktopConnectionShare,
} from "@/services/auth/session-v2.utils";
import {
  getAvailableConnectSubMode,
  getDefaultSubMode,
  Mode,
} from "./constants";
import type { PageShareTarget, SubMode } from "./constants";
import { HeaderShareModalView } from "./HeaderShareModalView";
import {
  getSavedPageShareTarget,
  savePageShareTarget,
} from "./pageShareTargetCookie";
import {
  bodyScrollLock,
  buildConnectionShareFailureKey,
  buildLegacyDesktopConnectionSharePath,
  buildLegacyDesktopConnectionShareUrl,
  buildNavigateDeepLinkUrl,
  buildNativeConnectionShareUrls,
  buildRouterPath,
  createReadyQrCodeSource,
  getCurrentPageLocation,
  type CachedConnectionShare,
  type ConnectionShareSessionVerificationStatus,
  type ConnectionShareStatus,
  generateQrCodeSource,
  getCachedConnectionShare,
  getFocusableElements,
  getLocalLegacyDesktopAuth,
  isAbortError,
  isSessionUpgradeRequiredError,
  type IsStaleGeneration,
  type NativeConnectionShare,
  type TerminalConnectionShareStatus,
} from "./shareUtils";

type ShareDisplayState = {
  readonly activeSubTab: SubMode;
  readonly navigateBrowserSrc: string;
  readonly navigateBrowserUrl: string;
  readonly navigateAppSrc: string;
  readonly navigateAppUrl: string;
  readonly navigateCoreUrl: string;
  readonly shareConnectionSrc: string;
  readonly shareConnectionAppUrl: string;
  readonly shareConnectionCoreUrl: string;
  readonly mobileConnectionShareStatus: ConnectionShareStatus;
  readonly desktopConnectionShareStatus: ConnectionShareStatus;
};

function HeaderQRModal({
  show,
  onClose,
  mode,
}: {
  readonly show: boolean;
  readonly onClose: () => void;
  readonly mode: Mode;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchParamsString = searchParams?.toString() ?? "";
  const isMobile = useIsMobileDevice();
  const isElectron = useElectron();

  const [shouldRender, setShouldRender] = useState(show);
  const [isVisible, setIsVisible] = useState(show);

  const { address: contextWalletAddress, hasValidWalletAuth } =
    useSeizeConnectContext();
  const { ensureActiveSessionV2WebSession, requestSessionUpgrade } = useAuth();
  const activeWalletAddress = contextWalletAddress ?? getWalletAddress();
  const hasWalletAddress = Boolean(activeWalletAddress);

  const [activeSubTab, setActiveSubTab] = useState<SubMode>(() =>
    getDefaultSubMode(mode)
  );
  const [pageShareTarget, setPageShareTarget] = useState<PageShareTarget>(
    getSavedPageShareTarget
  );

  const [navigateBrowserUrl, setNavigateBrowserUrl] = useState<string>("");
  const [navigateAppUrl, setNavigateAppUrl] = useState<string>("");
  const [navigateCoreUrl, setNavigateCoreUrl] = useState<string>("");
  const [shareConnectionAppUrl, setShareConnectionAppUrl] =
    useState<string>("");
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
  const [closingDisplayState, setClosingDisplayState] =
    useState<ShareDisplayState | null>(null);

  const closeModal = useCallback(() => {
    setClosingDisplayState({
      activeSubTab,
      navigateBrowserSrc,
      navigateBrowserUrl,
      navigateAppSrc,
      navigateAppUrl,
      navigateCoreUrl,
      shareConnectionSrc,
      shareConnectionAppUrl,
      shareConnectionCoreUrl,
      mobileConnectionShareStatus,
      desktopConnectionShareStatus,
    });
    setUrlCopied(false);
    setActiveSubTab(getDefaultSubMode(mode));
    onClose();
  }, [
    activeSubTab,
    desktopConnectionShareStatus,
    mobileConnectionShareStatus,
    mode,
    navigateBrowserSrc,
    navigateBrowserUrl,
    navigateAppSrc,
    navigateAppUrl,
    navigateCoreUrl,
    onClose,
    shareConnectionAppUrl,
    shareConnectionCoreUrl,
    shareConnectionSrc,
  ]);

  const onCloseRef = useRef(closeModal);
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
    onCloseRef.current = closeModal;
  }, [closeModal]);

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

    const appScheme = publicEnv.MOBILE_APP_SCHEME ?? "mobile6529";
    const coreScheme = publicEnv.CORE_SCHEME ?? "core6529";

    if (mode === Mode.PAGE_SHARE) {
      const { fullUrl: browserUrl, routerPath: pageRouterPath } =
        getCurrentPageLocation();
      const appUrl = buildNavigateDeepLinkUrl({
        scheme: appScheme,
        routerPath: pageRouterPath,
      });
      const coreUrl = buildNavigateDeepLinkUrl({
        scheme: coreScheme,
        routerPath: pageRouterPath,
      });

      setNavigateBrowserUrl(browserUrl);
      setNavigateAppUrl(appUrl);
      setNavigateCoreUrl(coreUrl);
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
      return;
    }

    const routerPath = buildRouterPath(pathname, searchParams);
    setShareConnectionAppUrl("");
    setShareConnectionCoreUrl("");
    setMobileConnectionShareStatus("loading");
    setDesktopConnectionShareStatus("loading");
    const generatedConnectionAppUrl = await generateNativeConnectionShareUrl({
      appScheme,
      isStaleGeneration,
      signal,
      walletAddress,
      routerPath,
    });
    await Promise.all([
      prepareMobileConnectionShare({
        connectionUrl: generatedConnectionAppUrl,
        isStaleGeneration,
        signal,
      }),
      generateLegacyDesktopConnectionShareUrl({
        coreScheme,
        isStaleGeneration,
        signal,
        walletAddress,
        routerPath,
      }),
    ]);
  }

  async function prepareMobileConnectionShare({
    connectionUrl,
    isStaleGeneration,
    signal,
  }: {
    readonly connectionUrl: string;
    readonly isStaleGeneration: IsStaleGeneration;
    readonly signal?: AbortSignal | undefined;
  }): Promise<void> {
    if (!connectionUrl || isStaleGeneration()) {
      return;
    }

    const qrSource = await createReadyQrCodeSource({
      url: connectionUrl,
      staleGeneration: isStaleGeneration,
      signal,
      errorMessage: "Failed to generate share connection QR code",
    });
    if (isStaleGeneration()) {
      return;
    }
    if (!qrSource) {
      setUnavailableMobileConnectionShare("error");
      return;
    }

    setShareConnectionAppUrl(connectionUrl);
    setShareConnectionSrc(qrSource);
    setMobileConnectionShareStatus("ready");
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
    mode,
  ]);

  useEffect(() => {
    if (show) return;
    const timer = setTimeout(() => {
      setNavigateBrowserSrc("");
      setNavigateAppSrc("");
      setShareConnectionSrc("");
    }, 150);
    return () => clearTimeout(timer);
  }, [show]);

  useEffect(() => {
    if (show) {
      setShouldRender(true);
      const raf = requestAnimationFrame(() => setIsVisible(true));
      return () => cancelAnimationFrame(raf);
    }

    setIsVisible(false);
    const timeout = setTimeout(() => {
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

  if (!shouldRender) {
    return null;
  }

  const currentDisplayState: ShareDisplayState = {
    activeSubTab,
    navigateBrowserSrc,
    navigateBrowserUrl,
    navigateAppSrc,
    navigateAppUrl,
    navigateCoreUrl,
    shareConnectionSrc,
    shareConnectionAppUrl,
    shareConnectionCoreUrl,
    mobileConnectionShareStatus,
    desktopConnectionShareStatus,
  };
  const displayState =
    !show && closingDisplayState ? closingDisplayState : currentDisplayState;
  const displayActiveSubTab = getAvailableConnectSubMode(
    displayState.activeSubTab,
    isElectron
  );

  return (
    <HeaderShareModalView
      key={show ? "open" : "closed"}
      shouldRender={shouldRender}
      isVisible={isVisible}
      onClose={closeModal}
      dialogRef={dialogRef}
      mode={mode}
      activeSubTab={displayActiveSubTab}
      setActiveSubTab={setActiveSubTab}
      navigateBrowserSrc={displayState.navigateBrowserSrc}
      navigateBrowserUrl={displayState.navigateBrowserUrl}
      navigateAppSrc={displayState.navigateAppSrc}
      navigateAppUrl={displayState.navigateAppUrl}
      navigateCoreUrl={displayState.navigateCoreUrl}
      pageShareTarget={pageShareTarget}
      setPageShareTarget={(target) => {
        setPageShareTarget(target);
        savePageShareTarget(target);
      }}
      shareConnectionSrc={displayState.shareConnectionSrc}
      shareConnectionAppUrl={displayState.shareConnectionAppUrl}
      shareConnectionCoreUrl={displayState.shareConnectionCoreUrl}
      mobileConnectionShareStatus={displayState.mobileConnectionShareStatus}
      desktopConnectionShareStatus={displayState.desktopConnectionShareStatus}
      terminalConnectionShareFailuresRef={terminalConnectionShareFailuresRef}
      requestSessionUpgrade={requestSessionUpgrade}
      urlCopied={urlCopied}
      setUrlCopied={setUrlCopied}
      isMobile={isMobile}
      isElectron={isElectron}
    />
  );
}

type HeaderModalProps = {
  readonly show: boolean;
  readonly onClose: () => void;
};

export function HeaderPageShareModal(props: HeaderModalProps) {
  return <HeaderQRModal {...props} mode={Mode.PAGE_SHARE} />;
}

export function HeaderConnectModal(props: HeaderModalProps) {
  return <HeaderQRModal {...props} mode={Mode.CONNECT} />;
}

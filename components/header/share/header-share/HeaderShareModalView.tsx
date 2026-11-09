"use client";

import { ConnectionShareNotice } from "./ConnectionShareNotice";
import {
  ConnectDeviceChoices,
  ConnectDeviceContent,
  ConnectDeviceFooter,
} from "./ConnectDeviceContent";
import { DesktopConnectionLink } from "./DesktopConnectionLink";
import DeviceConnectionShare from "./DeviceConnectionShare";
import { faCopy, faRotate } from "@fortawesome/free-solid-svg-icons";
import FontAwesomeSvgIcon from "@/components/common/icons/FontAwesomeSvgIcon";
import {
  ArrowDownTrayIcon,
  ComputerDesktopIcon,
  EllipsisHorizontalIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import Image from "next/image";
import Link from "next/link";
import {
  type CSSProperties,
  type ReactNode,
  useEffect,
  useRef,
  useState,
} from "react";
import { Tooltip } from "react-tooltip";

import { t } from "@/i18n/messages";
import {
  HEADER_SHARE_LOCALE,
  Mode,
  PageShareTarget,
  SubMode,
} from "./constants";
import type { HeaderShareModalViewProps } from "./HeaderShareModalView.types";
import { buildSocialShareUrls, type ConnectionShareStatus } from "./shareUtils";
import { FarcasterLogo, XLogo } from "./SocialShareIcons";
import { useSystemShare } from "./useSystemShare";

const SHARE_ACTION_CLASS_NAME =
  "tw-inline-flex tw-h-12 tw-w-full tw-items-center tw-gap-3 tw-rounded-lg tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900 tw-px-4 tw-text-left tw-text-sm tw-font-medium tw-text-iron-200 tw-no-underline tw-transition-colors hover:tw-border-iron-500 hover:tw-bg-iron-800 hover:tw-text-white focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400";
const SHARE_ACTION_ICON_CLASS_NAME = "tw-size-5 tw-flex-shrink-0";
const CONNECTION_SHARE_STATUS_KEYS = {
  loading: "headerShare.connectionRefresh.loading",
  ready: "headerShare.connectionRefresh.ready",
  error: "headerShare.connectionRefresh.unavailable",
  "legacy-auth": null,
  unauthenticated: null,
} as const;
const COPY_FEEDBACK_DURATION_MS = 1500;
const TOOLTIP_STYLE = {
  zIndex: 10000,
  backgroundColor: "#1F2937",
  color: "white",
  opacity: 1,
  padding: "4px 8px",
};

/** Show the share flow, including the secure Desktop link or Mobile QR code. */
export function HeaderShareModalView({
  open,
  shouldRender,
  isVisible,
  onClose,
  dialogRef,
  mode,
  account,
  activeSubTab,
  setActiveSubTab,
  navigateBrowserSrc,
  navigateBrowserUrl,
  navigateAppSrc,
  navigateAppUrl,
  navigateCoreUrl,
  pageShareTarget,
  setPageShareTarget,
  shareConnectionSrc,
  shareConnectionAppUrl,
  shareConnectionCoreUrl,
  mobileConnectionShareStatus,
  desktopConnectionShareStatus,
  terminalConnectionShareFailuresRef,
  updateAuthentication,
  refreshConnectionShare,
  isConnectionShareLoading,
  urlCopied,
  setUrlCopied,
  isMobile,
  isElectron,
}: HeaderShareModalViewProps) {
  const [connectionMode, setConnectionMode] = useState<
    "only" | "secure" | null
  >(null);
  const [previousOpen, setPreviousOpen] = useState(open);
  if (open !== previousOpen) {
    setPreviousOpen(open);
    if (open || connectionMode === "secure") setConnectionMode(null);
  }
  const isConnectMode = mode === Mode.CONNECT;
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const {
    isAvailable: isSystemShareAvailable,
    isPending: isSystemSharePending,
    isUnavailable: isSystemShareUnavailable,
    shareCurrentPage,
  } = useSystemShare({
    enabled:
      mode === Mode.PAGE_SHARE && isVisible && Boolean(navigateBrowserUrl),
    usePublicUrl: false,
  });

  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
        copyTimeoutRef.current = null;
      }
    };
  }, []);

  const modalTitle = t(
    HEADER_SHARE_LOCALE,
    isConnectMode
      ? "headerShare.connectModal.title"
      : "headerShare.shareModal.title"
  );
  const closeAriaLabel = t(
    HEADER_SHARE_LOCALE,
    isConnectMode
      ? "headerShare.connectModal.closeAriaLabel"
      : "headerShare.shareModal.closeAriaLabel"
  );
  const backdropAriaLabel = t(
    HEADER_SHARE_LOCALE,
    isConnectMode
      ? "headerShare.connectModal.backdropAriaLabel"
      : "headerShare.shareModal.backdropAriaLabel"
  );

  const renderQRCodeImage = (src: string, alt: string) => {
    const normalizedSrc = src.trim();

    return (
      <div className="tw-relative tw-h-full tw-w-full tw-bg-white">
        {normalizedSrc ? (
          <Image
            unoptimized
            priority
            loading="eager"
            src={normalizedSrc}
            alt={alt}
            fill
            sizes="(max-width: 768px) 92vw, 28rem"
            className="tw-unselectable tw-bg-white tw-object-contain"
            style={{ imageRendering: "pixelated" }}
          />
        ) : (
          <div className="tw-h-full tw-w-full tw-animate-pulse tw-rounded-md tw-bg-iron-900/40" />
        )}
      </div>
    );
  };

  const getNavigateContent = () => {
    if (pageShareTarget === PageShareTarget.APP) {
      return {
        content: renderQRCodeImage(
          navigateAppSrc,
          t(HEADER_SHARE_LOCALE, "headerShare.qr.mobileAlt")
        ),
        url: navigateAppUrl,
      };
    }

    return {
      content: renderQRCodeImage(
        navigateBrowserSrc,
        t(HEADER_SHARE_LOCALE, "headerShare.qr.browserAlt")
      ),
      url: navigateBrowserUrl,
    };
  };

  const getShareContent = () => {
    const activeConnectionShareStatus =
      activeSubTab === SubMode.DESKTOP
        ? desktopConnectionShareStatus
        : mobileConnectionShareStatus;
    if (activeConnectionShareStatus !== "ready") {
      return {
        content: renderConnectionShareNotice(activeConnectionShareStatus),
        url: "",
      };
    }

    if (activeSubTab === SubMode.DESKTOP) {
      return {
        content: <DesktopConnectionLink url={shareConnectionCoreUrl} />,
        url: shareConnectionCoreUrl,
      };
    }

    if (activeSubTab === SubMode.MOBILE) {
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
        <span>
          {t(HEADER_SHARE_LOCALE, "headerShare.invalidConnectTarget")}
        </span>
      ),
      url: "",
    };
  };

  const renderConnectionShareNotice = (status: ConnectionShareStatus) => (
    <ConnectionShareNotice
      status={status}
      onClose={onClose}
      onUpdate={() => {
        onClose();
        terminalConnectionShareFailuresRef.current.clear();
        updateAuthentication();
      }}
    />
  );

  const getDisplayContent = () => {
    if (mode === Mode.PAGE_SHARE) {
      return getNavigateContent();
    }

    return getShareContent();
  };

  const copyUrl = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setUrlCopied(true);
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
      }
      copyTimeoutRef.current = setTimeout(() => {
        setUrlCopied(false);
        copyTimeoutRef.current = null;
      }, COPY_FEEDBACK_DURATION_MS);
    } catch (error) {
      console.error("Failed to copy share URL to clipboard", error);
    }
  };

  const renderConnectionUrl = (
    url: string,
    refresh = refreshConnectionShare,
    loading = isConnectionShareLoading
  ) => {
    const refreshLabel = t(
      HEADER_SHARE_LOCALE,
      "headerShare.connectionRefresh.action"
    );
    const unavailableLabel = t(
      HEADER_SHARE_LOCALE,
      loading
        ? "headerShare.connectionRefresh.loading"
        : "headerShare.connectionRefresh.unavailable"
    );

    return (
      <div className="tw-flex tw-h-10 tw-w-full tw-items-center tw-gap-2">
        <div className="tw-flex tw-h-full tw-min-w-0 tw-flex-1 tw-items-center tw-gap-2 tw-rounded-lg tw-bg-iron-900 tw-px-3">
          <div
            className="tw-min-w-0 tw-flex-1 tw-truncate tw-text-sm tw-text-iron-400"
            title={url || undefined}
          >
            {url || unavailableLabel}
          </div>
          <button
            type="button"
            aria-label={t(HEADER_SHARE_LOCALE, "headerShare.copy.ariaLabel")}
            disabled={!url || loading}
            className="tw-inline-flex tw-h-8 tw-w-8 tw-flex-shrink-0 tw-items-center tw-justify-center tw-rounded-md tw-border-0 tw-bg-transparent tw-text-iron-400 tw-transition-colors focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400 enabled:hover:tw-bg-iron-800 enabled:hover:tw-text-iron-100 disabled:tw-opacity-50"
            data-tooltip-id="copy-url-tooltip"
            onClick={() => void copyUrl(url)}
          >
            <FontAwesomeSvgIcon
              icon={faCopy}
              aria-hidden="true"
              className={`tw-size-4 ${urlCopied ? "tw-text-green-500" : ""}`}
            />
          </button>
        </div>
        <button
          type="button"
          aria-label={refreshLabel}
          title={refreshLabel}
          aria-busy={loading}
          aria-disabled={loading}
          onClick={() => {
            if (!loading) {
              setUrlCopied(false);
              refresh();
            }
          }}
          className={`tw-inline-flex tw-size-10 tw-flex-shrink-0 tw-items-center tw-justify-center tw-rounded-lg tw-border-0 tw-bg-iron-900 tw-text-iron-400 tw-transition-colors focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:-tw-outline-offset-2 focus-visible:tw-outline-primary-400 ${
            loading
              ? "tw-cursor-wait tw-opacity-50"
              : "hover:tw-bg-iron-800 hover:tw-text-iron-100"
          }`}
        >
          <FontAwesomeSvgIcon
            icon={faRotate}
            aria-hidden="true"
            className={`tw-size-4 ${loading ? "tw-animate-spin motion-reduce:tw-animate-none" : ""}`}
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
          style={TOOLTIP_STYLE}
        />
      </div>
    );
  };

  const renderPageShareTargetMenu = () => {
    if (mode !== Mode.PAGE_SHARE) {
      return null;
    }

    const getTargetButtonClassName = (active: boolean) => {
      const baseClassName =
        "tw-inline-flex tw-h-9 tw-w-full tw-items-center tw-justify-center tw-rounded-lg tw-border-0 tw-px-3 tw-text-sm tw-font-medium tw-transition-colors focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400";
      return active
        ? `${baseClassName} tw-bg-iron-700 tw-text-iron-50`
        : `${baseClassName} tw-bg-iron-900 tw-text-iron-400 hover:tw-bg-iron-800 hover:tw-text-iron-100`;
    };

    return (
      <fieldset
        data-testid="page-share-target-menu"
        className="tw-m-0 tw-flex tw-w-48 tw-min-w-0 tw-flex-col tw-gap-1 tw-border-0 tw-p-0 sm:tw-w-full"
      >
        <legend className="tw-sr-only">
          {t(HEADER_SHARE_LOCALE, "headerShare.menu.qrTarget")}
        </legend>
        <div className="tw-grid tw-grid-cols-2 tw-gap-2">
          <button
            type="button"
            aria-pressed={pageShareTarget === PageShareTarget.BROWSER}
            className={getTargetButtonClassName(
              pageShareTarget === PageShareTarget.BROWSER
            )}
            onClick={() => setPageShareTarget(PageShareTarget.BROWSER)}
          >
            {t(HEADER_SHARE_LOCALE, "headerShare.menu.browser")}
          </button>
          <button
            type="button"
            aria-pressed={pageShareTarget === PageShareTarget.APP}
            className={getTargetButtonClassName(
              pageShareTarget === PageShareTarget.APP
            )}
            onClick={() => setPageShareTarget(PageShareTarget.APP)}
          >
            {t(HEADER_SHARE_LOCALE, "headerShare.menu.app")}
          </button>
        </div>
      </fieldset>
    );
  };

  const renderPageShareActions = (url: string, desktopUrl: string) => {
    if (mode !== Mode.PAGE_SHARE || !url) {
      return null;
    }

    const shareTitle =
      typeof document === "undefined"
        ? "6529"
        : document.title.trim() || "6529";
    const socialShareUrls = buildSocialShareUrls({
      url,
      title: shareTitle,
    });
    const copyLabel = t(
      HEADER_SHARE_LOCALE,
      urlCopied ? "headerShare.copy.copied" : "headerShare.copy.default"
    );
    let liveStatus = "";
    if (isSystemShareUnavailable) {
      liveStatus = t(
        HEADER_SHARE_LOCALE,
        "headerShare.social.systemShareUnavailable"
      );
    } else if (urlCopied) {
      liveStatus = t(HEADER_SHARE_LOCALE, "headerShare.copy.copied");
    }
    return (
      <div
        data-testid="page-share-actions"
        className="tw-flex tw-w-full tw-flex-col tw-gap-2"
      >
        <button
          type="button"
          onClick={() => void copyUrl(url)}
          className={`${SHARE_ACTION_CLASS_NAME} ${
            urlCopied
              ? "tw-border-green-500 tw-bg-green-500/15 !tw-text-success"
              : ""
          }`}
        >
          <FontAwesomeSvgIcon
            icon={faCopy}
            className={`${SHARE_ACTION_ICON_CLASS_NAME} ${
              urlCopied ? "!tw-text-success" : ""
            }`}
            aria-hidden="true"
          />
          <span className={urlCopied ? "!tw-text-success" : undefined}>
            {copyLabel}
          </span>
        </button>
        {desktopUrl && (
          <a href={desktopUrl} className={SHARE_ACTION_CLASS_NAME}>
            <ComputerDesktopIcon
              className={SHARE_ACTION_ICON_CLASS_NAME}
              aria-hidden="true"
            />
            <span>{t(HEADER_SHARE_LOCALE, "headerShare.social.desktop")}</span>
          </a>
        )}
        <a
          href={socialShareUrls.x}
          target="_blank"
          rel="noopener noreferrer"
          className={SHARE_ACTION_CLASS_NAME}
        >
          <XLogo className={SHARE_ACTION_ICON_CLASS_NAME} />
          <span>{t(HEADER_SHARE_LOCALE, "headerShare.social.x")}</span>
        </a>
        <a
          href={socialShareUrls.farcaster}
          target="_blank"
          rel="noopener noreferrer"
          className={SHARE_ACTION_CLASS_NAME}
        >
          <FarcasterLogo className={SHARE_ACTION_ICON_CLASS_NAME} />
          <span>{t(HEADER_SHARE_LOCALE, "headerShare.social.farcaster")}</span>
        </a>
        {isSystemShareAvailable && (
          <button
            type="button"
            aria-label={t(
              HEADER_SHARE_LOCALE,
              "headerShare.social.systemShare"
            )}
            onClick={() => void shareCurrentPage()}
            disabled={isSystemSharePending}
            aria-busy={isSystemSharePending ? "true" : undefined}
            className={`${SHARE_ACTION_CLASS_NAME} disabled:tw-cursor-wait disabled:tw-opacity-70`}
          >
            <EllipsisHorizontalIcon
              className={SHARE_ACTION_ICON_CLASS_NAME}
              aria-hidden="true"
            />
            <span>{t(HEADER_SHARE_LOCALE, "headerShare.social.more")}</span>
          </button>
        )}
        <span
          className={
            isSystemShareUnavailable
              ? "tw-w-full tw-text-sm tw-text-iron-400"
              : "tw-sr-only"
          }
          role="status"
          aria-live="polite"
        >
          {liveStatus}
        </span>
      </div>
    );
  };

  function renderActiveContent() {
    const { content, url } = getDisplayContent();
    const activeConnectionShareStatus =
      activeSubTab === SubMode.DESKTOP
        ? desktopConnectionShareStatus
        : mobileConnectionShareStatus;
    const pageShareQrSize = isSystemShareAvailable ? "14.25rem" : "10.75rem";
    const qrContent = (
      <div
        id="header-share-content"
        className={`tw-relative tw-max-w-full tw-self-center tw-overflow-hidden tw-rounded-lg ${
          isConnectMode
            ? "tw-w-full"
            : "tw-w-48 sm:tw-w-[var(--page-share-qr-size)]"
        } ${isConnectMode && activeSubTab === SubMode.DESKTOP ? "tw-h-56" : "tw-aspect-square"} ${
          isConnectMode && activeConnectionShareStatus === "ready"
            ? "tw-animate-fadeIn motion-reduce:tw-animate-none"
            : ""
        }`}
      >
        <div className="tw-absolute tw-inset-0 tw-flex tw-items-center tw-justify-center">
          {content}
        </div>
      </div>
    );

    if (mode === Mode.PAGE_SHARE) {
      return (
        <div
          data-testid="page-share-layout"
          className="tw-grid tw-w-full tw-gap-4 sm:tw-grid-cols-[var(--page-share-qr-size)_1px_minmax(0,1fr)] sm:tw-items-stretch"
          style={
            {
              "--page-share-qr-size": pageShareQrSize,
            } as CSSProperties
          }
        >
          <div
            data-testid="page-share-qr-column"
            className="tw-flex tw-min-w-0 tw-flex-col tw-items-center tw-justify-center tw-gap-2"
          >
            {renderPageShareTargetMenu()}
            {qrContent}
          </div>
          <div
            data-testid="page-share-divider"
            aria-hidden="true"
            className="tw-h-px tw-w-full tw-bg-iron-700 sm:tw-h-full sm:tw-w-px"
          />
          <div
            data-testid="page-share-actions-column"
            className="tw-flex tw-items-center"
          >
            {renderPageShareActions(navigateBrowserUrl, navigateCoreUrl)}
          </div>
        </div>
      );
    }

    return renderConnectContent(
      qrContent,
      activeConnectionShareStatus,
      content,
      url
    );
  }

  function renderConnectContent(
    qrContent: ReactNode,
    activeConnectionShareStatus: ConnectionShareStatus,
    content: ReactNode,
    url: string
  ) {
    const goBack = () => {
      setUrlCopied(false);
      setConnectionMode(null);
    };
    const footer = <ConnectDeviceFooter onBack={goBack} />;
    const name = account.handle ?? account.address;
    if (connectionMode === "secure") {
      return (
        <DeviceConnectionShare
          key={activeSubTab}
          target={activeSubTab === SubMode.DESKTOP ? "desktop" : "native"}
          renderLink={(link, refresh, loading) => (
            <>
              <h3 className="tw-m-0 tw-break-words tw-text-sm tw-font-semibold tw-text-iron-50">
                {t(HEADER_SHARE_LOCALE, "headerShare.connectModal.asSecure", {
                  name,
                })}
              </h3>
              {activeSubTab === SubMode.DESKTOP ? (
                <div className="tw-flex tw-flex-col tw-gap-2">
                  <div className="tw-h-56">
                    <DesktopConnectionLink url={link.url} />
                  </div>
                  <p className="tw-m-0 tw-text-center tw-text-sm tw-text-iron-300">
                    {t(
                      HEADER_SHARE_LOCALE,
                      "headerShare.connectModal.desktopMinimumVersion"
                    )}
                  </p>
                </div>
              ) : (
                <div className="tw-aspect-square tw-w-full tw-overflow-hidden tw-rounded-lg">
                  {renderQRCodeImage(
                    link.qr,
                    t(HEADER_SHARE_LOCALE, "e2ee.connectionSetup.qr")
                  )}
                </div>
              )}
              {renderConnectionUrl(link.url, refresh, loading)}
            </>
          )}
          footer={footer}
        />
      );
    }

    if (!connectionMode) {
      return (
        <ConnectDeviceChoices
          activeSubTab={activeSubTab}
          isElectron={isElectron}
          setActiveSubTab={setActiveSubTab}
          canSetUp={account.canSetUp}
          setConnectionMode={setConnectionMode}
        />
      );
    }

    const connectionStatusKey =
      CONNECTION_SHARE_STATUS_KEYS[activeConnectionShareStatus];
    const showConnectionControls =
      activeConnectionShareStatus === "ready" ||
      activeConnectionShareStatus === "loading" ||
      activeConnectionShareStatus === "error";

    return (
      <>
        <h3 className="tw-m-0 tw-break-words tw-text-sm tw-font-semibold tw-text-iron-50">
          {t(HEADER_SHARE_LOCALE, "headerShare.connectModal.as", { name })}
        </h3>
        <div
          data-testid="connection-share-content"
          className="tw-relative tw-w-full"
        >
          <span
            className="tw-sr-only"
            role="status"
            aria-live="polite"
            aria-atomic="true"
          >
            {connectionStatusKey
              ? t(HEADER_SHARE_LOCALE, connectionStatusKey)
              : ""}
          </span>
          <div
            data-testid="connection-share-reserved-space"
            aria-hidden="true"
            className="tw-invisible tw-flex tw-w-full tw-flex-col tw-gap-2"
          >
            <div
              className={
                activeSubTab === SubMode.DESKTOP
                  ? "tw-h-56 tw-w-full"
                  : "tw-aspect-square tw-w-full"
              }
            />
            <div className="tw-h-10 tw-w-full" />
          </div>
          <div className="tw-absolute tw-inset-0">
            {showConnectionControls ? (
              <div className="tw-flex tw-h-full tw-w-full tw-flex-col tw-gap-2">
                {qrContent}
                {renderConnectionUrl(url)}
              </div>
            ) : (
              content
            )}
          </div>
        </div>
        {footer}
      </>
    );
  }

  if (!shouldRender) {
    return null;
  }

  let modalMaxWidthClassName = "tw-max-w-sm sm:tw-max-w-2xl";
  if (isConnectMode) {
    modalMaxWidthClassName = "tw-max-w-md";
  }

  return (
    <div
      className={`tailwind-scope tw-fixed tw-inset-0 tw-z-50 tw-flex tw-items-center tw-justify-center tw-bg-black/70 tw-p-2 tw-transition-opacity tw-duration-200 sm:tw-p-4 ${
        isVisible ? "tw-opacity-100" : "tw-opacity-0"
      }`}
    >
      <button
        type="button"
        aria-label={backdropAriaLabel}
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
        className={`tw-relative tw-flex tw-max-h-full tw-w-full tw-flex-col tw-overflow-hidden tw-rounded-xl tw-border tw-border-iron-700 tw-bg-iron-950 tw-p-0 tw-text-left tw-shadow-xl tw-transition-all tw-duration-200 ${modalMaxWidthClassName} ${
          isVisible
            ? "tw-translate-y-0 tw-scale-100 tw-opacity-100"
            : "tw-translate-y-1 tw-scale-95 tw-opacity-0"
        }`}
      >
        <div className="tw-flex tw-shrink-0 tw-items-start tw-justify-between tw-gap-3 tw-px-5 tw-pt-5">
          <div className="tw-flex tw-min-w-0 tw-flex-1 tw-flex-wrap tw-items-center tw-gap-2">
            <h2
              id="header-share-title"
              className="tw-m-0 tw-text-lg tw-font-semibold tw-text-iron-50"
            >
              {modalTitle}
            </h2>
            {isConnectMode && (
              <Link
                href="/about/6529-apps"
                onClick={onClose}
                aria-label={t(
                  HEADER_SHARE_LOCALE,
                  "headerShare.connectModal.downloadAppsAriaLabel"
                )}
                className="tw-inline-flex tw-items-center tw-gap-1.5 tw-rounded-sm tw-py-1 tw-text-xs tw-font-medium tw-text-iron-400 tw-no-underline tw-transition-colors hover:tw-text-primary-300 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400"
              >
                <ArrowDownTrayIcon
                  aria-hidden="true"
                  className="tw-size-4 tw-flex-shrink-0"
                />
                {t(
                  HEADER_SHARE_LOCALE,
                  "headerShare.connectModal.downloadApps"
                )}
              </Link>
            )}
          </div>
          <button
            type="button"
            aria-label={closeAriaLabel}
            title={closeAriaLabel}
            onClick={onClose}
            className="tw-inline-flex tw-size-9 tw-flex-shrink-0 tw-items-center tw-justify-center tw-rounded-lg tw-border-0 tw-bg-transparent tw-text-iron-400 tw-transition-colors hover:tw-bg-iron-800 hover:tw-text-iron-50 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400"
          >
            <XMarkIcon className="tw-size-5" aria-hidden="true" />
          </button>
        </div>
        <div
          data-testid="header-share-modal-content"
          className="tw-flex tw-min-h-0 tw-flex-col tw-gap-3 tw-overflow-y-auto tw-px-5 tw-pb-5 tw-pt-2"
        >
          {isConnectMode ? (
            <ConnectDeviceContent account={account}>
              {renderActiveContent()}
            </ConnectDeviceContent>
          ) : (
            renderActiveContent()
          )}
        </div>
      </dialog>
    </div>
  );
}

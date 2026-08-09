import { faCopy, faExternalLink } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  ArrowDownTrayIcon,
  ComputerDesktopIcon,
  EllipsisHorizontalIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import Image from "next/image";
import Link from "next/link";
import { type CSSProperties, useEffect, useRef } from "react";
import { Tooltip } from "react-tooltip";

import Button from "@/components/utils/button/Button";
import { t } from "@/i18n/messages";
import {
  HEADER_SHARE_LOCALE,
  Mode,
  PageShareTarget,
  squareStyle,
  SubMode,
} from "./constants";
import { ModalMenu } from "./HeaderShareMenu";
import type { HeaderShareModalViewProps } from "./HeaderShareModalView.types";
import { buildSocialShareUrls, type ConnectionShareStatus } from "./shareUtils";
import { FarcasterLogo, XLogo } from "./SocialShareIcons";
import { useSystemShare } from "./useSystemShare";

const SHARE_ACTION_CLASS_NAME =
  "tw-inline-flex tw-h-12 tw-w-full tw-items-center tw-gap-3 tw-rounded-lg tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900 tw-px-4 tw-text-left tw-text-sm tw-font-medium tw-text-iron-200 tw-no-underline tw-transition-colors hover:tw-border-iron-500 hover:tw-bg-iron-800 hover:tw-text-white focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400";
const SHARE_ACTION_ICON_CLASS_NAME = "tw-size-5 tw-flex-shrink-0";
const COPY_FEEDBACK_DURATION_MS = 1500;
const TOOLTIP_STYLE = {
  zIndex: 10000,
  backgroundColor: "#1F2937",
  color: "white",
  opacity: 1,
  padding: "4px 8px",
};

export function HeaderShareModalView({
  shouldRender,
  isVisible,
  onClose,
  dialogRef,
  mode,
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
  requestSessionUpgrade,
  urlCopied,
  setUrlCopied,
  isMobile,
  isElectron,
}: HeaderShareModalViewProps) {
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

  const renderCoreLink = (url: string) => {
    return (
      <a
        data-testid="desktop-connection-panel"
        href={url}
        className="tw-group tw-flex tw-h-full tw-w-full tw-flex-col tw-items-center tw-justify-center tw-gap-6 tw-rounded-lg tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900/50 tw-p-8 tw-text-center tw-no-underline tw-transition-colors hover:tw-border-iron-500 hover:tw-bg-iron-900 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-300"
        style={squareStyle}
      >
        <Image
          unoptimized
          priority
          loading="eager"
          src="/6529Core.png"
          alt={t(HEADER_SHARE_LOCALE, "headerShare.core.alt")}
          width={150}
          height={150}
          className="tw-unselectable"
        />
        <span className="tw-inline-flex tw-items-center tw-justify-center tw-gap-2 tw-rounded-md tw-border tw-border-solid tw-border-iron-200 tw-bg-iron-50 tw-px-4 tw-py-2 tw-text-sm tw-font-medium tw-text-iron-900 tw-transition-colors group-hover:tw-border-white group-hover:tw-bg-white group-hover:tw-text-black">
          <FontAwesomeIcon icon={faExternalLink} aria-hidden="true" />
          <span className="tw-whitespace-nowrap">
            {t(HEADER_SHARE_LOCALE, "headerShare.core.open")}
          </span>
        </span>
      </a>
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
        content: renderCoreLink(shareConnectionCoreUrl),
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

  const requestAuthenticationUpgrade = async () => {
    try {
      await requestSessionUpgrade?.();
    } catch (error) {
      console.error("Failed to request session upgrade", error);
    }
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
        data-testid="connection-share-notice"
        data-status={status}
        className={`tw-flex tw-h-full tw-w-full tw-flex-col tw-items-center tw-justify-center tw-gap-5 tw-p-8 tw-text-center ${
          status === "loading"
            ? ""
            : "tw-rounded-xl tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900/50"
        }`}
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
            <Button
              type="button"
              variant="secondary"
              size="md"
              className="tw-flex-1"
              onClick={onClose}
            >
              {t(HEADER_SHARE_LOCALE, "headerShare.connectionNotice.cancel")}
            </Button>
            <Button
              type="button"
              variant="primary"
              size="md"
              className="tw-flex-1"
              onClick={() => {
                onClose();
                terminalConnectionShareFailuresRef.current.clear();
                void requestAuthenticationUpgrade();
              }}
            >
              {t(HEADER_SHARE_LOCALE, "headerShare.connectionNotice.update")}
            </Button>
          </div>
        )}
      </div>
    );
  };

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

  const renderConnectionUrl = (url: string) => {
    if (!isConnectMode) {
      return null;
    }

    if (!url) {
      return null;
    }

    return (
      <div className="tw-flex tw-h-10 tw-items-center tw-gap-2 tw-rounded-lg tw-bg-iron-900 tw-px-3">
        <div
          className="tw-min-w-0 tw-flex-1 tw-truncate tw-text-sm tw-text-iron-400"
          title={url}
        >
          {url}
        </div>
        <button
          type="button"
          aria-label={t(HEADER_SHARE_LOCALE, "headerShare.copy.ariaLabel")}
          className="tw-inline-flex tw-h-8 tw-w-8 tw-items-center tw-justify-center tw-rounded-md tw-border-0 tw-bg-transparent tw-text-iron-400 tw-transition-colors hover:tw-bg-iron-800 hover:tw-text-iron-100"
          data-tooltip-id="copy-url-tooltip"
          onClick={() => void copyUrl(url)}
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
            ...TOOLTIP_STYLE,
          }}
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
          <FontAwesomeIcon
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
    const pageShareQrSize = isSystemShareAvailable ? "14.25rem" : "10.75rem";
    const qrContent = (
      <div
        id="header-share-content"
        className={`tw-relative tw-aspect-square tw-max-w-full tw-self-center tw-overflow-hidden tw-rounded-lg ${
          isConnectMode
            ? "tw-w-full"
            : "tw-w-48 sm:tw-w-[var(--page-share-qr-size)]"
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

    return (
      <div
        data-testid="connection-share-content"
        className="tw-relative tw-w-full"
      >
        <div
          data-testid="connection-share-reserved-space"
          aria-hidden="true"
          className="tw-invisible tw-flex tw-w-full tw-flex-col tw-gap-2"
        >
          <div className="tw-aspect-square tw-w-full" />
          <div className="tw-h-10 tw-w-full" />
        </div>
        <div className="tw-absolute tw-inset-0">
          {url ? (
            <div className="tw-animate-in tw-fade-in tw-flex tw-h-full tw-w-full tw-flex-col tw-gap-2 tw-duration-200 motion-reduce:tw-animate-none">
              {qrContent}
              {renderConnectionUrl(url)}
            </div>
          ) : (
            content
          )}
        </div>
      </div>
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
        className={`tw-relative tw-flex tw-w-full tw-flex-col tw-overflow-y-auto tw-rounded-xl tw-border tw-border-iron-700 tw-bg-iron-950 tw-p-0 tw-text-left tw-shadow-xl tw-transition-all tw-duration-200 ${modalMaxWidthClassName} ${
          isVisible
            ? "tw-translate-y-0 tw-scale-100 tw-opacity-100"
            : "tw-translate-y-1 tw-scale-95 tw-opacity-0"
        }`}
      >
        <div
          data-testid="header-share-modal-content"
          className="tw-flex tw-flex-col tw-gap-3 tw-p-5"
        >
          <div className="tw-flex tw-items-start tw-justify-between tw-gap-3">
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
          {isConnectMode && (
            <ModalMenu
              activeSubTab={activeSubTab}
              isElectron={isElectron}
              onSubTabChange={setActiveSubTab}
            />
          )}
          {renderActiveContent()}
        </div>
      </dialog>
    </div>
  );
}

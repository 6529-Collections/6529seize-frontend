import { faCopy, faExternalLink } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  ComputerDesktopIcon,
  EllipsisHorizontalIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import Image from "next/image";
import { useEffect, useRef } from "react";
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
import type {
  ConnectionShareStatus,
  TerminalConnectionShareStatus,
} from "./shareUtils";
import { buildSocialShareUrls, isExpectedSystemShareError } from "./shareUtils";
import { FarcasterLogo, XLogo } from "./SocialShareIcons";

type MutableRef<T> = { current: T };

const SHARE_ACTION_CLASS_NAME =
  "tw-inline-flex tw-size-12 tw-items-center tw-justify-center tw-rounded-lg tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900 tw-text-iron-200 tw-no-underline tw-transition-colors hover:tw-border-iron-500 hover:tw-bg-iron-800 hover:tw-text-white focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400";
const PAGE_SHARE_ACTIONS_TOOLTIP_ID = "page-share-actions-tooltip";
const COPY_FEEDBACK_DURATION_MS = 2000;
const TOOLTIP_STYLE = {
  zIndex: 10000,
  backgroundColor: "#1F2937",
  color: "white",
  opacity: 1,
  padding: "4px 8px",
};

interface HeaderShareModalViewProps {
  readonly shouldRender: boolean;
  readonly isVisible: boolean;
  readonly onClose: () => void;
  readonly dialogRef: MutableRef<HTMLDialogElement | null>;
  readonly mode: Mode;
  readonly activeSubTab: SubMode;
  readonly setActiveSubTab: (subTab: SubMode) => void;
  readonly navigateBrowserSrc: string;
  readonly navigateBrowserUrl: string;
  readonly navigateAppSrc: string;
  readonly navigateAppUrl: string;
  readonly navigateCoreUrl: string;
  readonly pageShareTarget: PageShareTarget;
  readonly setPageShareTarget: (target: PageShareTarget) => void;
  readonly shareConnectionSrc: string;
  readonly shareConnectionAppUrl: string;
  readonly shareConnectionCoreUrl: string;
  readonly mobileConnectionShareStatus: ConnectionShareStatus;
  readonly desktopConnectionShareStatus: ConnectionShareStatus;
  readonly terminalConnectionShareFailuresRef: MutableRef<
    Map<string, TerminalConnectionShareStatus>
  >;
  readonly requestSessionUpgrade: (() => Promise<unknown>) | undefined;
  readonly urlCopied: boolean;
  readonly setUrlCopied: (copied: boolean) => void;
  readonly isMobile: boolean;
  readonly isElectron: boolean;
}

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
      <div className="tw-flex tw-items-center tw-gap-2" style={squareStyle}>
        <a
          href={url}
          className="tw-flex tw-flex-col tw-items-center tw-gap-8 tw-no-underline"
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
          <div className="tw-flex tw-w-full tw-items-center tw-justify-center tw-gap-2 tw-rounded-lg tw-bg-iron-200 tw-px-4 tw-py-3 tw-text-iron-900">
            <FontAwesomeIcon icon={faExternalLink} />
            <div className="tw-min-w-fit tw-whitespace-nowrap">
              {t(HEADER_SHARE_LOCALE, "headerShare.core.open")}
            </div>
          </div>
        </a>
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

  const shareCurrentPage = async (title: string, url: string) => {
    try {
      await navigator.share({ title, url });
    } catch (error) {
      if (!isExpectedSystemShareError(error)) {
        console.error("Failed to share current page", error);
      }
    }
  };

  const renderConnectionUrl = (url: string) => {
    if (!isConnectMode) {
      return null;
    }

    if (!url) {
      return <div className="tw-h-10" />;
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
      <fieldset className="tw-m-0 tw-flex tw-min-w-0 tw-flex-col tw-gap-1 tw-border-0 tw-p-0">
        <legend className="tw-px-1 tw-text-[11px] tw-font-bold tw-uppercase tw-tracking-[0.08em] tw-text-iron-500">
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
    if (mode !== Mode.PAGE_SHARE || !url || !desktopUrl) {
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
    const canUseSystemShare =
      typeof navigator !== "undefined" && typeof navigator.share === "function";

    return (
      <div className="tw-flex tw-flex-wrap tw-items-center tw-justify-center tw-gap-2">
        <button
          type="button"
          aria-label={t(HEADER_SHARE_LOCALE, "headerShare.copy.ariaLabel")}
          data-tooltip-id={PAGE_SHARE_ACTIONS_TOOLTIP_ID}
          data-tooltip-content={
            urlCopied
              ? t(HEADER_SHARE_LOCALE, "headerShare.copy.copied")
              : t(HEADER_SHARE_LOCALE, "headerShare.copy.default")
          }
          onClick={() => void copyUrl(url)}
          className={`${SHARE_ACTION_CLASS_NAME} ${
            urlCopied
              ? "tw-border-green-500 tw-bg-green-500/15 tw-text-green-300"
              : ""
          }`}
        >
          <FontAwesomeIcon icon={faCopy} className="tw-size-5" />
        </button>
        <a
          href={desktopUrl}
          aria-label={t(HEADER_SHARE_LOCALE, "headerShare.social.desktop")}
          data-tooltip-id={PAGE_SHARE_ACTIONS_TOOLTIP_ID}
          data-tooltip-content={t(
            HEADER_SHARE_LOCALE,
            "headerShare.social.desktop"
          )}
          className={SHARE_ACTION_CLASS_NAME}
        >
          <ComputerDesktopIcon className="tw-size-5" aria-hidden="true" />
        </a>
        <a
          href={socialShareUrls.x}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={t(HEADER_SHARE_LOCALE, "headerShare.social.x")}
          data-tooltip-id={PAGE_SHARE_ACTIONS_TOOLTIP_ID}
          data-tooltip-content={t(HEADER_SHARE_LOCALE, "headerShare.social.x")}
          className={SHARE_ACTION_CLASS_NAME}
        >
          <XLogo className="tw-size-5" />
        </a>
        <a
          href={socialShareUrls.farcaster}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={t(HEADER_SHARE_LOCALE, "headerShare.social.farcaster")}
          data-tooltip-id={PAGE_SHARE_ACTIONS_TOOLTIP_ID}
          data-tooltip-content={t(
            HEADER_SHARE_LOCALE,
            "headerShare.social.farcaster"
          )}
          className={SHARE_ACTION_CLASS_NAME}
        >
          <FarcasterLogo className="tw-size-5" />
        </a>
        {canUseSystemShare && (
          <button
            type="button"
            aria-label={t(HEADER_SHARE_LOCALE, "headerShare.social.more")}
            data-tooltip-id={PAGE_SHARE_ACTIONS_TOOLTIP_ID}
            data-tooltip-content={t(
              HEADER_SHARE_LOCALE,
              "headerShare.social.more"
            )}
            onClick={() => void shareCurrentPage(shareTitle, url)}
            className={SHARE_ACTION_CLASS_NAME}
          >
            <EllipsisHorizontalIcon className="tw-size-6" />
          </button>
        )}
        <Tooltip
          id={PAGE_SHARE_ACTIONS_TOOLTIP_ID}
          place="top"
          positionStrategy="fixed"
          style={TOOLTIP_STYLE}
        />
        <span className="tw-sr-only" role="status" aria-live="polite">
          {urlCopied ? t(HEADER_SHARE_LOCALE, "headerShare.copy.copied") : ""}
        </span>
      </div>
    );
  };

  function renderActiveContent() {
    const { content, url } = getDisplayContent();

    return (
      <div className="tw-flex tw-flex-col tw-gap-2">
        {renderPageShareTargetMenu()}
        <div
          id="header-share-content"
          className={`tw-relative tw-aspect-square tw-max-w-full tw-self-center tw-overflow-hidden tw-rounded-lg ${
            isConnectMode ? "tw-w-full" : "tw-w-64"
          }`}
        >
          <div className="tw-absolute tw-inset-0 tw-flex tw-items-center tw-justify-center">
            {content}
          </div>
        </div>
        {renderConnectionUrl(url)}
        {renderPageShareActions(navigateBrowserUrl, navigateCoreUrl)}
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
        className={`tw-relative tw-flex tw-w-full tw-flex-col tw-overflow-y-auto tw-rounded-xl tw-border tw-border-iron-700 tw-bg-iron-950 tw-text-left tw-shadow-xl tw-transition-all tw-duration-200 ${
          isConnectMode ? "tw-max-w-md" : "tw-max-w-sm"
        } ${
          isVisible
            ? "tw-translate-y-0 tw-scale-100 tw-opacity-100"
            : "tw-translate-y-1 tw-scale-95 tw-opacity-0"
        }`}
      >
        <div className="tw-flex tw-flex-col tw-gap-3 tw-p-4">
          <div className="tw-flex tw-items-center tw-justify-between tw-gap-3">
            <h2
              id="header-share-title"
              className="tw-m-0 tw-text-lg tw-font-semibold tw-text-iron-50"
            >
              {modalTitle}
            </h2>
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

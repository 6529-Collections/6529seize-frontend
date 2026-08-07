import {
  faCopy,
  faExternalLink,
  faQrcode,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { EllipsisHorizontalIcon, XMarkIcon } from "@heroicons/react/24/outline";
import Image from "next/image";
import { useState } from "react";
import { Tooltip } from "react-tooltip";

import Button from "@/components/utils/button/Button";
import { t } from "@/i18n/messages";
import { HEADER_SHARE_LOCALE, Mode, squareStyle, SubMode } from "./constants";
import { ModalMenu } from "./HeaderShareMenu";
import type {
  ConnectionShareStatus,
  DisplayContent,
  TerminalConnectionShareStatus,
} from "./shareUtils";
import { buildSocialShareUrls } from "./shareUtils";
import { FarcasterLogo, XLogo } from "./SocialShareIcons";

type MutableRef<T> = { current: T };

const SHARE_ACTION_CLASS_NAME =
  "tw-inline-flex tw-size-12 tw-items-center tw-justify-center tw-rounded-lg tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900 tw-text-iron-200 tw-no-underline tw-transition-colors hover:tw-border-iron-500 hover:tw-bg-iron-800 hover:tw-text-white focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400";

interface HeaderShareModalViewProps {
  readonly show: boolean;
  readonly shouldRender: boolean;
  readonly isVisible: boolean;
  readonly onClose: () => void;
  readonly dialogRef: MutableRef<HTMLDialogElement | null>;
  readonly mode: Mode;
  readonly activeSubTab: SubMode;
  readonly setActiveSubTab: (subTab: SubMode) => void;
  readonly navigateBrowserSrc: string;
  readonly navigateBrowserUrl: string;
  readonly shareConnectionSrc: string;
  readonly shareConnectionAppUrl: string;
  readonly shareConnectionCoreUrl: string;
  readonly mobileConnectionShareStatus: ConnectionShareStatus;
  readonly desktopConnectionShareStatus: ConnectionShareStatus;
  readonly visibleDisplayContentRef: MutableRef<DisplayContent | null>;
  readonly terminalConnectionShareFailuresRef: MutableRef<
    Map<string, TerminalConnectionShareStatus>
  >;
  readonly requestSessionUpgrade: (() => Promise<unknown>) | undefined;
  readonly urlCopied: boolean;
  readonly setUrlCopied: (copied: boolean) => void;
  readonly copyTimeoutRef: MutableRef<ReturnType<typeof setTimeout> | null>;
  readonly isMobile: boolean;
}

export function HeaderShareModalView({
  show,
  shouldRender,
  isVisible,
  onClose,
  dialogRef,
  mode,
  activeSubTab,
  setActiveSubTab,
  navigateBrowserSrc,
  navigateBrowserUrl,
  shareConnectionSrc,
  shareConnectionAppUrl,
  shareConnectionCoreUrl,
  mobileConnectionShareStatus,
  desktopConnectionShareStatus,
  visibleDisplayContentRef,
  terminalConnectionShareFailuresRef,
  requestSessionUpgrade,
  urlCopied,
  setUrlCopied,
  copyTimeoutRef,
  isMobile,
}: HeaderShareModalViewProps) {
  const isConnectMode = mode === Mode.CONNECT;
  const [isShareQrVisible, setIsShareQrVisible] = useState(false);
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
    const normalizedSrc = src?.trim();

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

  const getCurrentDisplayContent = (): DisplayContent => {
    if (mode === Mode.PAGE_SHARE) {
      return getNavigateContent();
    }

    return getShareContent();
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
      }, 500);
    } catch (error) {
      console.error("Failed to copy share URL to clipboard", error);
    }
  };

  const shareCurrentPage = async (title: string, url: string) => {
    try {
      await navigator.share({ title, url });
    } catch (error) {
      if (!(error instanceof DOMException) || error.name !== "AbortError") {
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
            zIndex: 10000,
            backgroundColor: "#1F2937",
            color: "white",
            opacity: 1,
            padding: "4px 8px",
          }}
        />
      </div>
    );
  };

  const renderPageShareActions = (url: string) => {
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
    const canUseSystemShare =
      typeof navigator !== "undefined" && typeof navigator.share === "function";

    return (
      <div className="tw-flex tw-flex-wrap tw-items-center tw-justify-center tw-gap-2">
        <button
          type="button"
          aria-label={t(HEADER_SHARE_LOCALE, "headerShare.copy.ariaLabel")}
          title={
            urlCopied
              ? t(HEADER_SHARE_LOCALE, "headerShare.copy.copied")
              : t(HEADER_SHARE_LOCALE, "headerShare.copy.default")
          }
          onClick={() => void copyUrl(url)}
          className={SHARE_ACTION_CLASS_NAME}
        >
          <FontAwesomeIcon
            icon={faCopy}
            className={`tw-size-5 ${urlCopied ? "tw-text-green-500" : ""}`}
          />
        </button>
        <button
          type="button"
          aria-label={t(HEADER_SHARE_LOCALE, "headerShare.qr.createAriaLabel")}
          title={t(HEADER_SHARE_LOCALE, "headerShare.qr.createAriaLabel")}
          aria-pressed={isShareQrVisible}
          onClick={() => setIsShareQrVisible((current) => !current)}
          className={`${SHARE_ACTION_CLASS_NAME} ${
            isShareQrVisible ? "tw-border-primary-400 tw-text-primary-300" : ""
          }`}
        >
          <FontAwesomeIcon icon={faQrcode} className="tw-size-5" />
        </button>
        <a
          href={socialShareUrls.x}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={t(HEADER_SHARE_LOCALE, "headerShare.social.x")}
          title={t(HEADER_SHARE_LOCALE, "headerShare.social.x")}
          className={SHARE_ACTION_CLASS_NAME}
        >
          <XLogo className="tw-size-5" />
        </a>
        <a
          href={socialShareUrls.farcaster}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={t(HEADER_SHARE_LOCALE, "headerShare.social.farcaster")}
          title={t(HEADER_SHARE_LOCALE, "headerShare.social.farcaster")}
          className={SHARE_ACTION_CLASS_NAME}
        >
          <FarcasterLogo className="tw-size-5" />
        </a>
        {canUseSystemShare && (
          <button
            type="button"
            aria-label={t(HEADER_SHARE_LOCALE, "headerShare.social.more")}
            title={t(HEADER_SHARE_LOCALE, "headerShare.social.more")}
            onClick={() => void shareCurrentPage(shareTitle, url)}
            className={SHARE_ACTION_CLASS_NAME}
          >
            <EllipsisHorizontalIcon className="tw-size-6" />
          </button>
        )}
      </div>
    );
  };

  function renderActiveContent() {
    const { content, url } = getDisplayContent();

    return (
      <div className="tw-flex tw-flex-col tw-gap-2">
        {(isConnectMode || isShareQrVisible) && (
          <div
            id="header-share-content"
            className="tw-relative tw-aspect-square tw-w-full tw-overflow-hidden tw-rounded-lg"
          >
            <div className="tw-absolute tw-inset-0 tw-flex tw-items-center tw-justify-center">
              {content}
            </div>
          </div>
        )}
        {renderConnectionUrl(url)}
        {renderPageShareActions(url)}
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
        className={`tw-relative tw-flex tw-w-full tw-max-w-md tw-flex-col tw-overflow-y-auto tw-rounded-xl tw-border tw-border-iron-700 tw-bg-iron-950 tw-text-left tw-shadow-xl tw-transition-all tw-duration-200 ${
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
              onSubTabChange={setActiveSubTab}
            />
          )}
          {renderActiveContent()}
        </div>
      </dialog>
    </div>
  );
}

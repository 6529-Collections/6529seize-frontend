import { faCopy, faExternalLink } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Image from "next/image";
import { Tooltip } from "react-tooltip";

import { t } from "@/i18n/messages";
import { ShareMobileApp } from "../HeaderShareMobileApps";
import { CoreAppsDownload } from "./CoreAppsDownload";
import { HEADER_SHARE_LOCALE, Mode, squareStyle, SubMode } from "./constants";
import { ModalMenu } from "./HeaderShareMenu";
import type {
  ConnectionShareStatus,
  DisplayContent,
  TerminalConnectionShareStatus,
} from "./shareUtils";

type MutableRef<T> = { current: T };

interface HeaderShareModalViewProps {
  readonly show: boolean;
  readonly shouldRender: boolean;
  readonly isVisible: boolean;
  readonly onClose: () => void;
  readonly dialogRef: MutableRef<HTMLDialogElement | null>;
  readonly activeTab: Mode;
  readonly activeSubTab: SubMode;
  readonly setActiveTab: (tab: Mode) => void;
  readonly setActiveSubTab: (subTab: SubMode) => void;
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
  activeTab,
  activeSubTab,
  setActiveTab,
  setActiveSubTab,
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
  visibleDisplayContentRef,
  terminalConnectionShareFailuresRef,
  requestSessionUpgrade,
  urlCopied,
  setUrlCopied,
  copyTimeoutRef,
  isMobile,
}: HeaderShareModalViewProps) {
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
            className="tw-unselectable tw-object-contain"
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

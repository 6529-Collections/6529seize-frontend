"use client";

import { publicEnv } from "@/config/env";
import { faCopy, faExternalLink } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { ShareIcon } from "@heroicons/react/24/outline";
import yaml from "js-yaml";
import Image from "next/image";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Tooltip } from "react-tooltip";
import useIsMobileDevice from "@/hooks/isMobileDevice";
import useCapacitor from "@/hooks/useCapacitor";
import { DeepLinkScope } from "@/hooks/useDeepLinkNavigation";
import { useElectron } from "@/hooks/useElectron";
import {
  getRefreshToken,
  getWalletAddress,
  getWalletRole,
} from "@/services/auth/auth.utils";
import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import { ShareMobileApp } from "./HeaderShareMobileApps";

const QRCode = require("qrcode");

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
  const isMobile = useIsMobileDevice();

  const [shouldRender, setShouldRender] = useState(show);
  const [isVisible, setIsVisible] = useState(show);

  const { isAuthenticated } = useSeizeConnectContext();

  const [activeTab, setActiveTab] = useState<Mode>(
    isAuthenticated ? Mode.SHARE : Mode.NAVIGATE
  );
  const [activeSubTab, setActiveSubTab] = useState<SubMode>(SubMode.APP);

  const [navigateBrowserUrl, setNavigateBrowserUrl] = useState<string>("");
  const [navigateAppUrl, setNavigateAppUrl] = useState<string>("");
  const [shareConnectionAppUrl, setShareConnectionAppUrl] =
    useState<string>("");
  const [navigateCoreUrl, setNavigateCoreUrl] = useState<string>("");
  const [shareConnectionCoreUrl, setShareConnectionCoreUrl] =
    useState<string>("");

  const [navigateBrowserSrc, setNavigateBrowserSrc] = useState<string>("");
  const [navigateAppSrc, setNavigateAppSrc] = useState<string>("");
  const [shareConnectionSrc, setShareConnectionSrc] = useState<string>("");

  const [urlCopied, setUrlCopied] = useState<boolean>(false);

  function generateSources(
    refreshToken: string | null,
    walletAddress: string | null,
    role: string | null
  ) {
    let routerPath = pathname ?? "";
    if (routerPath.endsWith("/")) {
      routerPath = routerPath.slice(0, -1);
    }

    const searchParamsString = searchParams?.toString() ?? "";
    if (searchParamsString) {
      routerPath += `?${searchParamsString}`;
    }

    const appScheme = publicEnv.MOBILE_APP_SCHEME ?? "mobile6529";
    const coreScheme = publicEnv.CORE_SCHEME ?? "core6529";

    const browserUrl = `${window.location.origin}${routerPath}`;
    const appUrl = `${appScheme}://${DeepLinkScope.NAVIGATE}${routerPath}`;
    const coreUrl = `${coreScheme}://${DeepLinkScope.NAVIGATE}${routerPath}`;

    setNavigateBrowserUrl(browserUrl);
    setNavigateAppUrl(appUrl);
    setNavigateCoreUrl(coreUrl);

    let shareConnectionAppUrl = "";
    let shareConnectionCoreUrl = "";

    if (refreshToken && walletAddress) {
      shareConnectionAppUrl = `${appScheme}://${DeepLinkScope.SHARE_CONNECTION}?token=${refreshToken}&address=${walletAddress}`;
      shareConnectionCoreUrl = `${coreScheme}://${DeepLinkScope.NAVIGATE}/accept-connection-sharing?token=${refreshToken}&address=${walletAddress}`;

      if (role) {
        shareConnectionAppUrl += `&role=${role}`;
        shareConnectionCoreUrl += `&role=${role}`;
      }
      setShareConnectionAppUrl(shareConnectionAppUrl);
      setShareConnectionCoreUrl(shareConnectionCoreUrl);
    } else {
      setShareConnectionSrc("");
    }

    QRCode.toDataURL(browserUrl, { width: 500, margin: 0 }).then(
      (dataUrl: string) => {
        setNavigateBrowserSrc(dataUrl);
      }
    );

    QRCode.toDataURL(appUrl, { width: 500, margin: 0 }).then(
      (dataUrl: string) => {
        setNavigateAppSrc(dataUrl);
      }
    );

    if (shareConnectionAppUrl) {
      QRCode.toDataURL(shareConnectionAppUrl, { width: 500, margin: 0 }).then(
        (dataUrl: string) => {
          setShareConnectionSrc(dataUrl);
        }
      );
    }
  }

  useEffect(() => {
    if (show) {
      generateSources(getRefreshToken(), getWalletAddress(), getWalletRole());
    }
  }, [show]);

  useEffect(() => {
    setActiveTab(isAuthenticated ? Mode.SHARE : Mode.NAVIGATE);
    setActiveSubTab(SubMode.APP);
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
    const timeout = setTimeout(() => setShouldRender(false), 200);
    return () => clearTimeout(timeout);
  }, [show]);

  useEffect(() => {
    if (!shouldRender) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [shouldRender, onClose]);

  function printImage() {
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

    let content = null;
    let url = "";

    if (activeTab === Mode.NAVIGATE) {
      switch (activeSubTab) {
        case SubMode.BROWSER:
          url = navigateBrowserUrl;
          content = renderQRCodeImage(
            navigateBrowserSrc,
            "Browser Link - QR Code"
          );
          break;
        case SubMode.APP:
          url = navigateAppUrl;
          content = renderQRCodeImage(
            navigateAppSrc,
            "Mobile App Link - QR Code"
          );
          break;
        case SubMode.CORE:
          url = navigateCoreUrl;
          content = renderCoreLink(navigateCoreUrl);
          break;
        default:
          break;
      }
    } else if (activeTab === Mode.SHARE) {
      switch (activeSubTab) {
        case SubMode.APP:
          url = shareConnectionAppUrl;
          content = renderQRCodeImage(
            shareConnectionSrc,
            "Share Connection - QR Code"
          );
          break;
        case SubMode.CORE:
          content = renderCoreLink(shareConnectionCoreUrl);
          url = shareConnectionCoreUrl;
          break;
        default:
          content = <span>Invalid submode for SHARE</span>;
          break;
      }
    } else if (activeTab === Mode.APPS) {
      switch (activeSubTab) {
        case SubMode.APP:
          content = (
            <div
              className="tw-flex tw-flex-col tw-items-center tw-justify-center tw-gap-12 tw-p-10"
              style={squareStyle}
            >
              <ShareMobileApp platform="ios" />
              <ShareMobileApp platform="android" />
            </div>
          );
          break;
        case SubMode.CORE:
          content = <CoreAppsDownload />;
          break;
      }
    }

    return (
      <div className="tw-flex tw-flex-col tw-gap-2">
        <div className="tw-relative tw-w-full tw-aspect-square tw-overflow-hidden">
          <div className="tw-absolute tw-inset-0 tw-flex tw-items-center tw-justify-center">
            {content}
          </div>
        </div>
        {url ? (
          <div className="tw-flex tw-h-10 tw-items-center tw-gap-2 tw-rounded-lg tw-bg-iron-900 tw-px-3">
            <div
              className="tw-flex-1 tw-min-w-0 tw-overflow-hidden tw-text-ellipsis tw-whitespace-nowrap tw-text-sm tw-text-iron-400"
              title={url}
            >
              {url}
            </div>
            <button
              type="button"
              aria-label="Copy URL"
              className="tw-inline-flex tw-h-8 tw-w-8 tw-items-center tw-justify-center tw-rounded-md tw-border-0 tw-bg-transparent tw-text-iron-400 tw-transition-colors hover:tw-bg-iron-800 hover:tw-text-iron-100"
              data-tooltip-id="copy-url-tooltip"
              onClick={() => {
                navigator.clipboard.writeText(url);
                setUrlCopied(true);
                setTimeout(() => setUrlCopied(false), 500);
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
      <div
        role="dialog"
        aria-modal="true"
        data-testid="header-share-modal"
        className={`tw-relative tw-flex tw-w-full tw-max-w-md tw-flex-col tw-overflow-y-auto tw-rounded-xl tw-border tw-border-iron-700 tw-bg-iron-950 tw-text-left tw-shadow-xl tw-transition-all tw-duration-200 ${
          isVisible
            ? "tw-translate-y-0 tw-scale-100 tw-opacity-100"
            : "tw-translate-y-1 tw-scale-95 tw-opacity-0"
        }`}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="tw-flex tw-flex-col tw-gap-2 tw-p-3">
          <ModalMenu
            isShareConnection={!!getRefreshToken()}
            activeTab={activeTab}
            activeSubTab={activeSubTab}
            onTabChange={(tab, subTab) => {
              setActiveTab(tab);
              setActiveSubTab(subTab);
            }}
          />
          {printImage()}
        </div>
      </div>
    </div>
  );
}

function ModalMenu({
  isShareConnection,
  activeTab,
  activeSubTab,
  onTabChange,
}: {
  readonly isShareConnection?: boolean | undefined;
  readonly activeTab: Mode;
  readonly activeSubTab: SubMode;
  readonly onTabChange: (tab: Mode, subTab: SubMode) => void;
}) {
  const isElectron = useElectron();
  const topTabCount = isShareConnection ? 3 : 2;
  const subTabCount =
    activeTab === Mode.NAVIGATE ? (!isElectron ? 3 : 2) : !isElectron ? 2 : 1;
  const subTabLabel =
    activeTab === Mode.APPS
      ? "Select Platform"
      : activeTab === Mode.SHARE
        ? "Open Link In"
        : "Open URL In";
  const getMenuButtonClass = (active: boolean) =>
    `tw-inline-flex tw-h-10 tw-w-full tw-min-w-0 tw-items-center tw-justify-center tw-overflow-hidden tw-text-ellipsis tw-whitespace-nowrap tw-rounded-xl tw-border-0 tw-px-2 tw-text-[15px] tw-font-medium tw-transition tw-duration-200 ${
      active
        ? "tw-bg-iron-700 tw-text-iron-50"
        : "tw-bg-iron-900 tw-text-iron-400 hover:tw-bg-iron-800 hover:tw-text-iron-100"
    }`;

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
          {isShareConnection && (
            <button
              type="button"
              disabled={activeTab === Mode.SHARE}
              className={getMenuButtonClass(activeTab === Mode.SHARE)}
              onClick={() => onTabChange(Mode.SHARE, SubMode.APP)}
            >
              Connection
            </button>
          )}
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
            className={getMenuButtonClass(activeSubTab === SubMode.APP)}
            onClick={() => onTabChange(activeTab, SubMode.APP)}
          >
            <span>6529 Mobile</span>
          </button>
          {activeTab === Mode.NAVIGATE && (
            <button
              type="button"
              className={getMenuButtonClass(activeSubTab === SubMode.BROWSER)}
              onClick={() => onTabChange(activeTab, SubMode.BROWSER)}
            >
              <span>Browser</span>
            </button>
          )}
          {!isElectron && (
            <button
              type="button"
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

  const osConfigs: OSInfo[] = [
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

  const [versions, setVersions] = useState<OSInfo[]>([]);

  useEffect(() => {
    const fetchYml = async (url: string): Promise<LatestYml> => {
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Failed to fetch ${url}`);
      }

      const text = await response.text();
      return yaml.load(text) as LatestYml;
    };

    const loadVersions = async () => {
      const versions: OSInfo[] = [];
      for (const osConfig of osConfigs.filter((config) => config.enabled)) {
        try {
          const ymlData = await fetchYml(osConfig.url);
          versions.push({ ...osConfig, version: ymlData.version });
        } catch (error) {
          console.error(
            `Failed to fetch or process ${osConfig.displayName}:`,
            error
          );
        }
      }
      setVersions(versions);
    };

    loadVersions();
  }, []);

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

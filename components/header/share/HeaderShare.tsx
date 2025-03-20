import styles from "./HeaderShare.module.scss";
import {
  faCopy,
  faExternalLink,
  faShareNodes,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Image from "next/image";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { Button, Modal } from "react-bootstrap";
import useCapacitor from "../../../hooks/useCapacitor";
import { DeepLinkScope } from "../capacitor/CapacitorWidget";
import {
  getRefreshToken,
  getWalletAddress,
  getWalletRole,
} from "../../../services/auth/auth.utils";
import useIsMobileDevice from "../../../hooks/isMobileDevice";
import Tippy from "@tippyjs/react";
import { useElectron } from "../../../hooks/useElectron";
import { useSeizeConnectContext } from "../../auth/SeizeConnectContext";
import yaml from "js-yaml";

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
  maxWidth: "1000px",
  aspectRatio: "1 / 1",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

export default function HeaderQR() {
  const capacitor = useCapacitor();
  const isMobileDevice = useIsMobileDevice();
  const [showQRModal, setShowQRModal] = useState<boolean>(false);

  if (capacitor.isCapacitor || isMobileDevice) {
    return <></>;
  }

  return (
    <div className="tailwind-scope tw-relative min-[1200px]:tw-mr-3 tw-self-center">
      <button
        type="button"
        aria-label="QR Code"
        title="QR Code"
        onClick={() => setShowQRModal(true)}
        className="tw-flex tw-items-center tw-justify-center tw-rounded-lg tw-bg-iron-800 tw-ring-1 tw-ring-inset tw-ring-iron-700 tw-h-10 tw-w-10 tw-border-0 tw-text-iron-300 hover:tw-text-iron-50 tw-shadow-sm hover:tw-bg-iron-700 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-light-400 tw-transition tw-duration-300 tw-ease-out">
        <FontAwesomeIcon icon={faShareNodes} height={18} />
      </button>
      <HeaderQRModal show={showQRModal} onClose={() => setShowQRModal(false)} />
    </div>
  );
}

function HeaderQRModal({
  show,
  onClose,
}: {
  readonly show: boolean;
  readonly onClose: () => void;
}) {
  const router = useRouter();

  const isMobile = useIsMobileDevice();

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
    let routerPath = router.asPath;
    if (routerPath.endsWith("/")) {
      routerPath = routerPath.slice(1);
    }

    const appScheme = process.env.MOBILE_APP_SCHEME ?? "mobile6529";
    const coreScheme = process.env.CORE_SCHEME ?? "core6529";

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

    if (!show) {
      const timer = setTimeout(() => {
        setNavigateBrowserSrc("");
        setNavigateAppSrc("");
        setShareConnectionSrc("");
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [show]);

  function printImage() {
    const renderQRCodeImage = (src: string, alt: string) => {
      const defaultStyle = {
        maxWidth: "100%",
        height: "auto",
        border: "5px solid #fff",
      };
      return (
        <Image
          priority
          loading="eager"
          src={src}
          alt={alt}
          width={1000}
          height={1000}
          className="unselectable"
          style={{ ...defaultStyle }}
        />
      );
    };

    const renderCoreLink = (url: string) => {
      return (
        <div className="tw-flex tw-items-center tw-gap-2" style={squareStyle}>
          <a
            href={url}
            className="decoration-none tw-flex tw-flex-col tw-items-center tw-gap-8">
            <Image
              priority
              loading="eager"
              src="/6529Core.png"
              alt="6529 Core"
              width={150}
              height={150}
              className="unselectable"
            />
            <Button
              variant="primary"
              className="tw-flex tw-items-center tw-gap-2 tw-w-full">
              <FontAwesomeIcon icon={faExternalLink} />
              <div className="no-wrap">Open in 6529 Core</div>
            </Button>
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
              className="tw-p-10 tw-flex tw-flex-col tw-gap-12 tw-items-center tw-justify-center"
              style={squareStyle}>
              <a
                href="https://apps.apple.com/us/app/6529-mobile/id6654923687"
                target="_blank"
                rel="noopener noreferrer"
                className="decoration-none tw-flex tw-flex-col tw-items-center tw-gap-8">
                <Image
                  priority
                  loading="eager"
                  src="/app-store.png"
                  alt="6529 Mobile iOS"
                  width={0}
                  height={0}
                  placeholder="empty"
                  className="tw-w-[200px] tw-h-auto hover:tw-scale-[1.03] tw-transition-all tw-duration-300 tw-ease-out"
                />
              </a>
              <a
                href="https://play.google.com/store/apps/details?id=com.core6529.app"
                target="_blank"
                rel="noopener noreferrer"
                className="decoration-none tw-flex tw-flex-col tw-items-center tw-gap-8">
                <Image
                  priority
                  loading="eager"
                  src="/play-store.png"
                  alt="6529 Mobile Android"
                  width={0}
                  height={0}
                  className="tw-w-[200px] tw-h-auto hover:tw-scale-[1.03] tw-transition-all tw-duration-300 tw-ease-out"
                />
              </a>
            </div>
          );
          break;
        case SubMode.CORE:
          content = <CoreAppsDownload />;
          break;
      }
    }

    return (
      <>
        {content}
        {url && (
          <div className="d-flex align-items-center gap-2 mt-2">
            <div className={styles.url}>{url}</div>
            <Tippy
              placement="top"
              content={urlCopied ? "Copied!" : "Copy URL"}
              hideOnClick={isMobile}>
              <FontAwesomeIcon
                icon={faCopy}
                className={`${styles.urlCopy} ${
                  urlCopied ? styles.copied : ""
                }`}
                onClick={() => {
                  navigator.clipboard.writeText(url);
                  setUrlCopied(true);
                  setTimeout(() => setUrlCopied(false), 500);
                }}
              />
            </Tippy>
          </div>
        )}
      </>
    );
  }

  return (
    <Modal show={show} onHide={onClose} keyboard centered>
      <Modal.Body className={styles.modalBody}>
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
      </Modal.Body>
    </Modal>
  );
}

function ModalMenu({
  isShareConnection,
  activeTab,
  activeSubTab,
  onTabChange,
}: {
  readonly isShareConnection?: boolean;
  readonly activeTab: Mode;
  readonly activeSubTab: SubMode;
  readonly onTabChange: (tab: Mode, subTab: SubMode) => void;
}) {
  const isElectron = useElectron();

  return (
    <div className="pt-2 pb-3 d-flex flex-column">
      <div className="d-flex gap-2">
        {isShareConnection && (
          <Button
            className={activeTab === Mode.SHARE ? styles.disabledMenuBtn : ""}
            variant={activeTab === Mode.SHARE ? "light" : "outline-light"}
            onClick={() => onTabChange(Mode.SHARE, SubMode.APP)}>
            Share Connection
          </Button>
        )}
        <Button
          className={activeTab === Mode.NAVIGATE ? styles.disabledMenuBtn : ""}
          variant={activeTab === Mode.NAVIGATE ? "light" : "outline-light"}
          onClick={() => onTabChange(Mode.NAVIGATE, SubMode.APP)}>
          Current URL
        </Button>
        <Button
          className={activeTab === Mode.APPS ? styles.disabledMenuBtn : ""}
          variant={activeTab === Mode.APPS ? "light" : "outline-light"}
          onClick={() => onTabChange(Mode.APPS, SubMode.APP)}>
          6529 Apps
        </Button>
      </div>

      <div className="mt-3 d-flex gap-2">
        <Button
          variant={activeSubTab === SubMode.APP ? "light" : "outline-light"}
          onClick={() => onTabChange(activeTab, SubMode.APP)}>
          <span className="font-smaller">6529 Mobile</span>
        </Button>
        {activeTab === Mode.NAVIGATE && (
          <Button
            variant={
              activeSubTab === SubMode.BROWSER ? "light" : "outline-light"
            }
            onClick={() => onTabChange(activeTab, SubMode.BROWSER)}>
            <span className="font-smaller">Browser</span>
          </Button>
        )}
        {!isElectron && (
          <Button
            variant={activeSubTab === SubMode.CORE ? "light" : "outline-light"}
            onClick={() => onTabChange(activeTab, SubMode.CORE)}>
            <span className="font-smaller">6529 Core</span>
          </Button>
        )}
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
    version?: string;
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
      className="tw-w-full tw-bg-black tw-px-5 tw-py-3 tw-border tw-border-solid tw-border-white tw-rounded-lg decoration-none tw-flex tw-items-center tw-gap-4 hover:tw-scale-[1.03] tw-transition-all tw-duration-300 tw-ease-out">
      <div className="tw-bg-white tw-rounded-full tw-p-4">
        <Image
          priority
          loading="eager"
          src={icon}
          alt={title}
          width={40}
          height={40}
          className="unselectable"
        />
      </div>
      <div className="tw-flex tw-items-center tw-gap-2 tw-w-full">
        <div className="no-wrap tw-text-lg tw-font-semibold">
          {platform} v{version}
        </div>
      </div>
    </a>
  );
}

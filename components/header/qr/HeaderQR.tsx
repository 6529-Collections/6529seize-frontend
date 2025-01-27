import styles from "./HeaderQR.module.scss";
import { faCopy, faQrcode } from "@fortawesome/free-solid-svg-icons";
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

const QRCode = require("qrcode");

enum Mode {
  NAVIGATE,
  SHARE,
}

enum SubMode {
  BROWSER,
  APP,
}

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
        <FontAwesomeIcon icon={faQrcode} height={18} />
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
  const router = useRouter();

  const isMobile = useIsMobileDevice();

  const [activeTab, setActiveTab] = useState<Mode>(Mode.SHARE);
  const [activeSubTab, setActiveSubTab] = useState<SubMode>(SubMode.BROWSER);

  const [navigateBrowserUrl, setNavigateBrowserUrl] = useState<string>("");
  const [navigateAppUrl, setNavigateAppUrl] = useState<string>("");
  const [shareConnectionUrl, setShareConnectionUrl] = useState<string>("");

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

    const browserUrl = `${window.location.origin}${routerPath}`;
    const appUrl = `${appScheme}://${DeepLinkScope.NAVIGATE}${routerPath}`;

    setNavigateBrowserUrl(browserUrl);
    setNavigateAppUrl(appUrl);

    let shareConnectionUrl = "";
    if (refreshToken && walletAddress) {
      shareConnectionUrl = `${appScheme}://${DeepLinkScope.SHARE_CONNECTION}?token=${refreshToken}&address=${walletAddress}`;
      if (role) {
        shareConnectionUrl += `&role=${role}`;
      }
      setShareConnectionUrl(shareConnectionUrl);
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

    if (shareConnectionUrl) {
      QRCode.toDataURL(shareConnectionUrl, { width: 500, margin: 0 }).then(
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
    if (!show) {
      const timer = setTimeout(() => {
        setNavigateBrowserSrc("");
        setNavigateAppSrc("");
        setShareConnectionSrc("");
        setActiveTab(Mode.NAVIGATE);
        setActiveSubTab(SubMode.BROWSER);
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [show]);

  function printImage() {
    let url = "";
    let src = "";
    let alt = "";
    if (activeTab === Mode.NAVIGATE) {
      if (activeSubTab === SubMode.BROWSER) {
        url = navigateBrowserUrl;
        src = navigateBrowserSrc;
        alt = "Browser Link - QR Code";
      } else {
        url = navigateAppUrl;
        src = navigateAppSrc;
        alt = "Mobile App Link - QR Code";
      }
    } else if (activeTab === Mode.SHARE) {
      url = shareConnectionUrl;
      src = shareConnectionSrc;
      alt = "Share Connection - QR Code";
    }

    return (
      <>
        <Image
          src={src}
          alt={alt}
          width={1000}
          height={1000}
          className="unselectable"
          style={{
            maxWidth: "100%",
            height: "auto",
            border: "20px solid #000",
          }}
        />
        <div className="d-flex align-items-center gap-2 mt-2">
          <div className={styles.url}>{url}</div>
          <Tippy
            placement="top"
            content={urlCopied ? "Copied!" : "Copy URL"}
            hideOnClick={isMobile}>
            <FontAwesomeIcon
              icon={faCopy}
              className={`${styles.urlCopy} ${urlCopied ? styles.copied : ""}`}
              onClick={() => {
                navigator.clipboard.writeText(url);
                setUrlCopied(true);
                setTimeout(() => setUrlCopied(false), 500);
              }}
            />
          </Tippy>
        </div>
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
  return (
    <div className="pt-2 pb-3 d-flex flex-column">
      <div className="d-flex gap-2">
        <Button
          className={activeTab === Mode.NAVIGATE ? styles.disabledMenuBtn : ""}
          variant={activeTab === Mode.NAVIGATE ? "light" : "outline-light"}
          onClick={() => onTabChange(Mode.NAVIGATE, activeSubTab)}>
          Current URL
        </Button>
        {isShareConnection && (
          <Button
            className={activeTab === Mode.SHARE ? styles.disabledMenuBtn : ""}
            variant={activeTab === Mode.SHARE ? "light" : "outline-light"}
            onClick={() => onTabChange(Mode.SHARE, activeSubTab)}>
            Share Connection
          </Button>
        )}
      </div>

      <div className="mt-3 d-flex gap-2">
        {activeTab === Mode.NAVIGATE ? (
          <>
            <Button
              variant={
                activeSubTab === SubMode.BROWSER ? "light" : "outline-light"
              }
              onClick={() => onTabChange(Mode.NAVIGATE, SubMode.BROWSER)}>
              <span className="font-smaller">Browser</span>
            </Button>
            <Button
              variant={activeSubTab === SubMode.APP ? "light" : "outline-light"}
              onClick={() => onTabChange(Mode.NAVIGATE, SubMode.APP)}>
              <span className="font-smaller">Mobile App</span>
            </Button>
          </>
        ) : (
          <Button variant="light" className="btn-block" disabled>
            <span className="font-smaller">
              Scan with a device that has the 6529 Mobile app installed
            </span>
          </Button>
        )}
      </div>
    </div>
  );
}

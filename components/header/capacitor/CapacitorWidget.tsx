import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import styles from "./CapacitorWidget.module.scss";
import {
  faAnglesUp,
  faArrowLeft,
  faArrowRight,
  faRefresh,
  faShare,
} from "@fortawesome/free-solid-svg-icons";
import { useNavigationHistory } from "../../../hooks/useNavigationHistory";
import { useState, useEffect } from "react";

export default function CapacitorWidget() {
  const { canGoBack, canGoForward, isLoading, goBack, goForward, refresh } =
    useNavigationHistory();

  const [enableScrollTop, setEnableScrollTop] = useState(false);

  const [isShareOpen, setIsShareOpen] = useState(false);

  const toggleShare = () => {
    setIsShareOpen(!isShareOpen);
  };

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 500) {
        setEnableScrollTop(true);
      } else {
        setEnableScrollTop(false);
      }
    };

    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const handleScrollTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <div className={styles.capacitorWidget}>
      <span className="d-flex align-items-center gap-3">
        <button
          className={styles.button}
          disabled={!canGoBack || isLoading}
          onClick={() => goBack()}>
          <FontAwesomeIcon icon={faArrowLeft} />
        </button>
        <button
          className={styles.button}
          disabled={!canGoForward || isLoading}
          onClick={() => goForward()}>
          <FontAwesomeIcon icon={faArrowRight} />
        </button>
      </span>

      <span className="d-flex align-items-center gap-3">
        <button className={styles.button} onClick={toggleShare}>
          <FontAwesomeIcon icon={faShare} />
        </button>
        <SharePopup show={isShareOpen} onHide={() => setIsShareOpen(false)} />
      </span>
      <span className="d-flex align-items-center gap-3">
        <button
          className={styles.button}
          onClick={() => refresh()}
          disabled={isLoading}>
          <FontAwesomeIcon
            icon={faRefresh}
            className={isLoading ? styles.refreshSpin : ""}
          />
        </button>
        <button
          className={styles.button}
          onClick={handleScrollTop}
          disabled={isLoading || !enableScrollTop}>
          <FontAwesomeIcon icon={faAnglesUp} />
        </button>
      </span>
    </div>
  );
}

function SharePopup(props: Readonly<{ show: boolean; onHide: () => void }>) {
  const [animationClass, setAnimationClass] = useState("");

  const enableMobileLink = false;

  const [isMobileLinkCopied, setIsMobileLinkCopied] = useState(false);
  const [isWebLinkCopied, setIsWebLinkCopied] = useState(false);

  useEffect(() => {
    if (props.show) {
      setAnimationClass(styles.show);
    } else {
      setAnimationClass(styles.hide);
    }
  }, [props.show]);

  const getLinkPath = () => {
    let path = window.location.pathname;
    if (path.startsWith("/")) {
      path = path.slice(1);
    }
    return path;
  };

  const copyAppLink = () => {
    const link = `//navigate/${getLinkPath()}`;
    navigator.clipboard.writeText(link).then(() => {
      setIsWebLinkCopied(false);
      setIsMobileLinkCopied(true);
      setTimeout(() => {
        setIsMobileLinkCopied(false);
      }, 1500);
    });
  };

  const copyWebLink = () => {
    const link = window.location.href;
    navigator.clipboard.writeText(link).then(() => {
      setIsMobileLinkCopied(false);
      setIsWebLinkCopied(true);
      setTimeout(() => {
        setIsWebLinkCopied(false);
      }, 1500);
    });
  };

  return (
    <>
      <div
        className={`${styles.sharePopup} ${animationClass}`}
        onAnimationEnd={() => {
          if (!props.show) {
            setAnimationClass("");
          }
        }}>
        {enableMobileLink && (
          <button className={styles.sharePopupBtn} onClick={copyAppLink}>
            {isMobileLinkCopied ? "Copied!" : "Copy Mobile App link"}
          </button>
        )}
        <button className={styles.sharePopupBtn} onClick={copyWebLink}>
          {isWebLinkCopied ? "Copied!" : "Copy link"}
        </button>
      </div>
      <div
        onClick={props.onHide}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            e.preventDefault();
            props.onHide();
          }
        }}
        className={styles.sharePopupOverlay}
        role="button"
        tabIndex={0}
        aria-label="Close overlay"
        style={{
          display: props.show ? "block" : "none",
        }}></div>
    </>
  );
}

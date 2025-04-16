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
import { useState, useEffect, useCallback } from "react";
import { Share } from "@capacitor/share";
import Hammer from "hammerjs";
import useCapacitor from "../../../hooks/useCapacitor";
import { App } from "@capacitor/app";
import { useRouter } from "next/router";

export enum DeepLinkScope {
  NAVIGATE = "navigate",
  SHARE_CONNECTION = "share-connection",
}

export default function CapacitorWidget() {
  const capacitor = useCapacitor();
  const { canGoBack, canGoForward, isLoading, goBack, goForward, refresh } =
    useNavigationHistory();

  const [enableScrollTop, setEnableScrollTop] = useState(false);

  const [isShareOpen, setIsShareOpen] = useState(false);

  const router = useRouter();

  const toggleShare = async () => {
    await Share.share({
      title: document.title,
      text: window.location.href,
    }).catch((error) => {
      console.log("Error sharing", error);
      if (error.message?.includes("not implemented")) {
        console.warn("Falling back to custom share popup");
        setIsShareOpen(!isShareOpen);
      } else {
        console.log("Error sharing", error);
      }
    });
  };

  useEffect(() => {
    const handleScroll = () => {
      setEnableScrollTop(window.scrollY > 0);
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

  useEffect(() => {
    const hammer = new Hammer(document.body);

    hammer.on("swiperight", goBack);
    hammer.on("swipeleft", goForward);

    return () => {
      hammer.off("swiperight", goBack);
      hammer.off("swipeleft", goForward);
    };
  }, [canGoBack, canGoForward]);

  const doNavigation = useCallback(
    (pathname: string, queryParams: Record<string, string | number>) => {
      console.log("deep link doNavigation", pathname, queryParams);

      const isSamePath = router.asPath.includes(pathname);
      const navigationMethod = isSamePath ? "replace" : "push";

      console.log("deep link doNavigation", isSamePath, navigationMethod);

      router[navigationMethod]({ pathname, query: queryParams }, undefined, {
        shallow: false,
      });
    },
    [router]
  );

  useEffect(() => {
    const listener = App.addListener("appUrlOpen", (data) => {
      console.log("deep link appUrlOpen", data);

      const urlString = data.url;

      const schemeEndIndex = urlString.indexOf("://") + 3;
      const urlWithoutScheme = urlString.slice(schemeEndIndex);

      const [scope, ...pathParts] = urlWithoutScheme.split("?")[0].split("/");

      const queryString = urlWithoutScheme.includes("?")
        ? urlWithoutScheme.split("?")[1]
        : "";

      const searchParams = new URLSearchParams(queryString);
      const queryParams: Record<string, string | number> = Object.fromEntries(
        searchParams.entries()
      );
      queryParams["_t"] = Date.now() / 1000;

      console.log("deep link queryParams", queryParams);

      switch (scope) {
        case DeepLinkScope.NAVIGATE:
          doNavigation(`/${pathParts.join("/")}`, queryParams);
          break;
        case DeepLinkScope.SHARE_CONNECTION:
          doNavigation("/accept-connection-sharing", queryParams);
          break;
        default:
          console.log("Unknown Deep Link Scope", scope);
          break;
      }
    });

    return () => {
      listener.then((handle) => handle.remove());
    };
  }, [doNavigation]);

  if (capacitor.keyboardVisible) {
    return <></>;
  }

  return (
    <div className={styles.capacitorWidget}>
      <span className="d-flex align-items-center gap-3">
        <button
          className={`${styles.button} ${
            !canGoBack || isLoading ? styles.disabled : ""
          }`}
          disabled={!canGoBack || isLoading}
          onClick={() => goBack()}>
          <FontAwesomeIcon icon={faArrowLeft} />
        </button>
        <button
          className={`${styles.button} ${
            !canGoForward || isLoading ? styles.disabled : ""
          }`}
          disabled={!canGoForward || isLoading}
          onClick={() => goForward()}>
          <FontAwesomeIcon icon={faArrowRight} />
        </button>
      </span>

      <span className="d-flex align-items-center gap-3">
        <button
          className={`${styles.button} ${isLoading ? styles.disabled : ""}`}
          disabled={isLoading}
          onClick={toggleShare}>
          <FontAwesomeIcon icon={faShare} />
        </button>
        <SharePopup show={isShareOpen} onHide={() => setIsShareOpen(false)} />
      </span>
      <span className="d-flex align-items-center gap-3">
        <button
          className={`${styles.button} ${isLoading ? styles.disabled : ""}`}
          onClick={() => refresh()}
          disabled={isLoading}>
          <FontAwesomeIcon
            icon={faRefresh}
            className={isLoading ? styles.refreshSpin : ""}
          />
        </button>
        <button
          className={`${styles.button} ${
            isLoading || !enableScrollTop ? styles.disabled : ""
          }`}
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

  useEffect(() => {
    if (props.show) {
      const handleScroll = () => {
        props.onHide();
      };

      window.addEventListener("scroll", handleScroll);
      window.addEventListener("touchmove", handleScroll);

      return () => {
        window.removeEventListener("scroll", handleScroll);
        window.removeEventListener("touchmove", handleScroll);
      };
    }
  }, [props.show, props.onHide]);

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
          <span className="font-larger">
            {isWebLinkCopied ? "Copied!" : "Copy link"}
          </span>
        </button>
      </div>
      <button
        onClick={() => {
          props.onHide();
        }}
        className={styles.sharePopupOverlay}
        aria-label="Close overlay"
        style={{
          display: props.show ? "block" : "none",
        }}></button>
    </>
  );
}

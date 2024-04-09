import styles from "./DownloadUrlWidget.module.scss";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import useDownloader from "react-use-downloader";
import { API_AUTH_COOKIE, WALLET_AUTH_COOKIE } from "../../constants";
import Cookies from "js-cookie";
import { Spinner } from "../dotLoader/DotLoader";
import { useContext } from "react";
import { AuthContext } from "../auth/Auth";

interface Props {
  preview: string;
  url: string;
  name: string;
  use_custom_downloader?: boolean;
}

export default function DownloadUrlWidget(props: Readonly<Props>) {
  const { setToast } = useContext(AuthContext);

  const apiAuth = Cookies.get(API_AUTH_COOKIE);
  let headers: any = {};
  if (apiAuth) {
    headers["x-6529-auth"] = apiAuth;
  }

  const allowlistAuth = Cookies.get(WALLET_AUTH_COOKIE);
  if (allowlistAuth) {
    headers["Authorization"] = `Bearer ${allowlistAuth}`;
  }
  const { download, isInProgress } = useDownloader({ headers });

  async function startDownload() {
    if (!isInProgress) {
      if (props.use_custom_downloader) {
        await customDownload(props.url, `${props.name}`);
      } else {
        await download(props.url, `${props.name}`);
      }
    }
  }

  const customDownload = async (url: string, name: string) => {
    try {
      const response = await fetch(url, {
        headers,
      });
      if (!response.ok) {
        const json = await response.json();
        setToast({
          type: "error",
          message: json.message ?? json.error,
        });
        return;
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = name;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (error: any) {
      console.error("Download failed", error);
      setToast({
        type: "error",
        message: "Something went wrong.",
      });
    }
  };

  return (
    <button
      className={styles.downloadUrlWidget}
      onClick={() => startDownload()}
      disabled={isInProgress}>
      {isInProgress ? <Spinner /> : <FontAwesomeIcon icon="download" />}
      {isInProgress ? `Downloading` : `Download`} {props.preview}
    </button>
  );
}

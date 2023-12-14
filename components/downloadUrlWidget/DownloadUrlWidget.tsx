import styles from "./DownloadUrlWidget.module.scss";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import useDownloader from "react-use-downloader";
import { API_AUTH_COOKIE } from "../../constants";
import Cookies from "js-cookie";
import DotLoader from "../dotLoader/DotLoader";

interface Props {
  preview: string;
  url: string;
  name: string;
}

export default function DownloadUrlWidget(props: Readonly<Props>) {
  const apiAuth = Cookies.get(API_AUTH_COOKIE);
  let headers = {};
  if (apiAuth) {
    headers = { "x-6529-auth": apiAuth };
  }
  const { size, elapsed, percentage, download, cancel, error, isInProgress } =
    useDownloader({ headers });

  function startDownload() {
    if (!isInProgress) {
      download(props.url, `${props.name}`);
    }
  }

  return (
    <span
      className={styles.downloadUrlWidget}
      onClick={() => startDownload()}
      aria-disabled={isInProgress}>
      <FontAwesomeIcon icon="download" />
      {isInProgress ? `Downloading` : `Download`} {props.preview}
      {isInProgress && <DotLoader />}
    </span>
  );
}

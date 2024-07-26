import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import useDownloader from "react-use-downloader";
import styles from "./Download.module.scss";

interface Props {
  href: string;
  name: string;
  extension: string;
}

export default function Download(props: Readonly<Props>) {
  const { size, elapsed, percentage, download, cancel, error, isInProgress } =
    useDownloader();

  async function startDownload() {
    download(props.href, `${props.name}.${props.extension}`);
  }

  return (
    <span className={styles.download}>
      {!isInProgress ? (
        <FontAwesomeIcon icon="download" onClick={startDownload} />
      ) : (
        <>
          Downloading {percentage} %{" "}
          <span className={styles.cancelDownload} onClick={() => cancel()}>
            Cancel
          </span>
        </>
      )}
    </span>
  );
}

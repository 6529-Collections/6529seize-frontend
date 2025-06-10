import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import useDownloader from "react-use-downloader";
import styles from "./Download.module.scss";
import { faDownload } from "@fortawesome/free-solid-svg-icons";

interface Props {
  href: string;
  name: string;
  extension: string;
  showProgress?: boolean;
}

export default function Download(props: Readonly<Props>) {
  const { size, elapsed, percentage, download, cancel, error, isInProgress } =
    useDownloader();
  
  const showProgress = props.showProgress ?? true;

  async function startDownload() {
    download(props.href, `${props.name}.${props.extension}`);
  }

  return (
    <span className={`${styles.download} `}>
      {!isInProgress || !showProgress ? (
        <div
          onClick={startDownload}
          className="tw-bg-iron-900 desktop-hover:hover:tw-bg-iron-800 tw-rounded-full tw-size-9 tw-flex-shrink-0 tw-inline-flex tw-items-center tw-justify-center tw-cursor-pointer tw-transition tw-duration-300 tw-ease-out"
        >
          <FontAwesomeIcon
            icon={faDownload}
            className="tw-text-white tw-w-4 tw-h-4 tw-flex-shrink-0"
          />
        </div>
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

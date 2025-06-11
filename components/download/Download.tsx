import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import useDownloader from "react-use-downloader";
import styles from "./Download.module.scss";
import { faDownload } from "@fortawesome/free-solid-svg-icons";

interface Props {
  href: string;
  name: string;
  extension: string;
  showProgress?: boolean;
  className?: string;
}

export default function Download(props: Readonly<Props>) {
  const { percentage, download, cancel, isInProgress } = useDownloader();
  
  const showProgress = props.showProgress ?? true;

  async function startDownload() {
    const filename = props.extension ? `${props.name}.${props.extension}` : props.name;
    download(props.href, filename);
  }

  return (
    <span className={`${styles.download} ${props.className ?? ''}`}>
      {!isInProgress || !showProgress ? (
        <button
          onClick={(e) => {
            e.stopPropagation();
            startDownload();
          }}
          className="tw-bg-iron-900 desktop-hover:hover:tw-bg-iron-800 tw-rounded-full tw-size-9 tw-flex-shrink-0 tw-inline-flex tw-items-center tw-justify-center tw-cursor-pointer tw-transition tw-duration-300 tw-ease-out tw-border-0"
          aria-label="Download file"
          type="button"
        >
          <FontAwesomeIcon
            icon={faDownload}
            className="tw-text-white tw-w-4 tw-h-4 tw-flex-shrink-0"
          />
        </button>
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

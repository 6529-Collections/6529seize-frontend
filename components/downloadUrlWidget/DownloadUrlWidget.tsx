import styles from "./DownloadUrlWidget.module.scss";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import useDownloader from "react-use-downloader";
import { Spinner } from "../dotLoader/DotLoader";
import { Button, Modal } from "react-bootstrap";
import { getAuthJwt, getStagingAuth } from "@/services/auth/auth.utils";
import { faDownload } from "@fortawesome/free-solid-svg-icons";

interface Props {
  preview: string;
  url: string;
  name: string;
}

export default function DownloadUrlWidget(props: Readonly<Props>) {
  const apiAuth = getStagingAuth();
  let headers: any = {};
  if (apiAuth) {
    headers["x-6529-auth"] = apiAuth;
  }

  const allowlistAuth = getAuthJwt();
  if (allowlistAuth) {
    headers["Authorization"] = `Bearer ${allowlistAuth}`;
  }
  const { download, isInProgress } = useDownloader({ headers });

  async function startDownload() {
    if (!isInProgress) {
      await download(props.url, `${props.name}`);
    }
  }

  return (
    <button
      className={styles.downloadUrlWidget}
      onClick={() => {
        startDownload();
      }}
      disabled={isInProgress}>
      {isInProgress ? <Spinner /> : <FontAwesomeIcon icon={faDownload} />}
      {isInProgress ? `Downloading` : props.preview}
    </button>
  );
}

function DownloadUrlWidgetConfirm(
  props: Readonly<{
    show: boolean;
    confirm_info: string;
    handleClose(): void;
    download(): void;
  }>
) {
  return (
    <Modal show={props.show} onHide={props.handleClose}>
      <Modal.Header closeButton>
        <Modal.Title>Confirm Download Info</Modal.Title>
      </Modal.Header>
      <hr className="mb-0 mt-0" />
      <Modal.Body>{props.confirm_info}</Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={props.handleClose}>
          Close
        </Button>
        <Button variant="primary" onClick={props.download}>
          Looks good
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

import styles from "./DownloadUrlWidget.module.scss";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import useDownloader from "react-use-downloader";
import { API_AUTH_COOKIE, WALLET_AUTH_COOKIE } from "../../constants";
import Cookies from "js-cookie";
import { Spinner } from "../dotLoader/DotLoader";
import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../auth/Auth";
import { Button, Modal } from "react-bootstrap";

interface Props {
  preview: string;
  url: string;
  name: string;
  use_custom_downloader?: boolean;
  confirm_info?: string;
}

export default function DownloadUrlWidget(props: Readonly<Props>) {
  const { setToast } = useContext(AuthContext);

  const [showConfirm, setShowConfirm] = useState(false);

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
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    setDownloading(isInProgress);
  }, [isInProgress]);

  async function startDownload() {
    setShowConfirm(false);
    if (!isInProgress) {
      if (props.use_custom_downloader) {
        setDownloading(true);
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
    } finally {
      setDownloading(false);
    }
  };

  return (
    <>
      <button
        className={styles.downloadUrlWidget}
        onClick={() => {
          if (props.confirm_info) {
            setShowConfirm(true);
          } else {
            startDownload();
          }
        }}
        disabled={downloading}>
        {downloading ? <Spinner /> : <FontAwesomeIcon icon="download" />}
        {downloading ? `Downloading` : `Download`} {props.preview}
      </button>
      {props.confirm_info && (
        <DownloadUrlWidgetConfirm
          show={showConfirm}
          confirm_info={props.confirm_info}
          handleClose={() => setShowConfirm(false)}
          download={startDownload}
        />
      )}
    </>
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

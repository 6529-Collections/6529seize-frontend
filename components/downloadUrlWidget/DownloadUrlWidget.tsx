import styles from "./DownloadUrlWidget.module.scss";
import { Container, Row, Col, Nav, Navbar, NavDropdown } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useEffect, useState } from "react";
import useDownloader from "react-use-downloader";

interface Props {
  preview: string;
  url: string;
  name: string;
}

export default function DownloadUrlWidget(props: Props) {
  const { size, elapsed, percentage, download, cancel, error, isInProgress } =
    useDownloader();

  function startDownload() {
    if (!isInProgress) {
      download(props.url, `${props.name}.csv`);
    }
  }

  return (
    <span
      className={styles.downloadUrlWidget}
      onClick={() => startDownload()}
      aria-disabled={isInProgress}>
      <FontAwesomeIcon icon="download" />
      {isInProgress ? `Downloading` : `Download`} {props.preview}
    </span>
  );
}

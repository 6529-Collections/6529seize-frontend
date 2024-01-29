import { Container, Row, Col } from "react-bootstrap";
import { NextGenToken } from "../../../../entities/INextgen";
import DownloadUrlWidget from "../../../downloadUrlWidget/DownloadUrlWidget";
import useDownloader from "react-use-downloader";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import DotLoader, { Spinner } from "../../../dotLoader/DotLoader";
import Tippy from "@tippyjs/react";

export enum Quality {
  "HD" = "HD",
  "4K" = "4K",
  "8K" = "8K",
  "16K" = "16K",
}

export function getUrl(token: NextGenToken, quality: Quality) {
  let u = token.generator_url.replace("/metadata/", "/png/");
  if (quality !== Quality.HD) {
    u = `${u}/${quality.toLowerCase()}`;
  }
  return u;
}

export default function NextGenTokenDownloads(
  props: Readonly<{
    token: NextGenToken;
  }>
) {
  function printQuality(quality: Quality) {
    return (
      <div className="d-flex gap-3 align-items-center">
        <span>
          <b>{quality.toUpperCase()}</b>
        </span>
        <span className="d-flex gap-2 align-items-center">
          <Tippy
            content={"Open in new tab"}
            placement={"top"}
            theme={"light"}
            delay={100}
            hideOnClick={true}>
            <FontAwesomeIcon
              style={{ cursor: "pointer", height: "24px", width: "24px" }}
              onClick={() => {
                const h = getUrl(props.token, quality);
                window.open(h, "_blank");
              }}
              icon="external-link"
            />
          </Tippy>
          <NextGenTokenDownloadButton token={props.token} quality={quality} />
        </span>
      </div>
    );
  }

  return (
    <Container className="no-padding">
      <Row>
        <Col>
          <span className="font-color-h">Links</span>
        </Col>
      </Row>
      <Row className="pt-2">
        <Col className="d-flex flex-wrap align-items-center gap-5">
          {printQuality(Quality.HD)}
          {printQuality(Quality["4K"])}
          {printQuality(Quality["8K"])}
          {printQuality(Quality["16K"])}
        </Col>
      </Row>
    </Container>
  );
}

export function NextGenTokenDownloadButton(
  props: Readonly<{
    token: NextGenToken;
    quality: Quality;
    class?: string;
  }>
) {
  const downloader = useDownloader();

  if (downloader.isInProgress) {
    return <Spinner />;
  }

  return (
    <Tippy
      content={"Download"}
      placement={"top"}
      theme={"light"}
      delay={100}
      hideOnClick={true}>
      <FontAwesomeIcon
        icon="download"
        className={props.class}
        style={{ cursor: "pointer", height: "24px", width: "24px" }}
        onClick={() => {
          downloader.download(
            getUrl(props.token, props.quality),
            `${props.token.id}_${props.quality.toUpperCase()}`
          );
        }}
      />
    </Tippy>
  );
}

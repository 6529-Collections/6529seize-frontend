import { Container, Row, Col } from "react-bootstrap";
import { NextGenToken } from "../../../../entities/INextgen";
import useDownloader from "react-use-downloader";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Spinner } from "../../../dotLoader/DotLoader";
import Tippy from "@tippyjs/react";
import { useEffect, useState } from "react";
import { parse } from "querystring";
import { numberWithCommas } from "../../../../helpers/Helpers";

export enum Quality {
  "2K" = "2K",
  "4K" = "4K",
  "8K" = "8K",
  "16K" = "16K",
}

export function getUrl(token: NextGenToken, quality: Quality) {
  let u = token.image_url;
  if (quality !== Quality["2K"]) {
    // u = u.replace("/png/", `/png${quality.toLowerCase()}/`);
    u = `${u}_${quality.toLowerCase()}`;
  }
  return u;
}

export default function NextGenTokenDownload(
  props: Readonly<{
    token: NextGenToken;
    quality: Quality;
  }>
) {
  const [imageExists, setImageExists] = useState(false);
  const [imageSize, setImageSize] = useState(0);

  function checkImage() {
    const url = getUrl(props.token, props.quality);
    fetch(url, {
      method: "HEAD",
    })
      .then((response) => {
        if (response.ok) {
          setImageExists(true);
          const contentLength = response.headers.get("content-length");
          if (contentLength) {
            const sizeBytes = parseInt(contentLength);
            const sizeMb = sizeBytes / (1024 * 1024);
            setImageSize(Math.round(sizeMb * 100) / 100);
          }
        } else {
          setImageExists(false);
        }
      })
      .catch(() => {
        setImageExists(false);
      });
  }

  useEffect(() => {
    checkImage();
  }, []);

  function printQuality(quality: Quality) {
    return (
      <span className="d-flex gap-3 align-items-center">
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
    );
  }

  return (
    <Container className="no-padding">
      <Row>
        <Col className="d-flex flex-wrap align-items-center gap-5">
          <span>
            <span>{props.quality}</span>
            {imageExists && imageSize > 0
              ? ` (${numberWithCommas(imageSize)} MB)`
              : " Coming Soon"}
          </span>
          {imageExists && printQuality(props.quality)}
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

import { Container, Row, Col, Dropdown } from "react-bootstrap";
import { NextGenToken } from "../../../../entities/INextgen";
import useDownloader from "react-use-downloader";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import DotLoader, { Spinner } from "../../../dotLoader/DotLoader";
import Tippy from "@tippyjs/react";
import { useEffect, useState } from "react";
import { numberWithCommas } from "../../../../helpers/Helpers";

export enum Resolution {
  "Thumbnail" = "Thumbnail",
  "0.5K" = "0.5K",
  "1K" = "1K",
  "2K" = "2K",
  "4K" = "4K",
  "8K" = "8K",
  "16K" = "16K",
}

export function getUrl(token: NextGenToken, resolution: Resolution) {
  let u = token.image_url;
  if (
    (resolution == Resolution["1K"] && token.collection_id !== 1) ||
    (resolution == Resolution["2K"] && token.collection_id == 1)
  ) {
    return u;
  }
  if (resolution === Resolution["Thumbnail"]) {
    u = u.replace("/png/", `/thumbnail/`);
  } else {
    u = u.replace("/png/", `/png${resolution.toLowerCase()}/`);
  }
  return u;
}

type NextGenTokenProps = Readonly<{
  token: NextGenToken;
  resolution: Resolution;
}>;

function useImageChecker(token: NextGenToken, resolution: Resolution) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageExists, setImageExists] = useState(false);
  const [imageSize, setImageSize] = useState(0);

  useEffect(() => {
    const url = getUrl(token, resolution);
    fetch(url, { method: "HEAD" })
      .then((response) => {
        if (response.ok) {
          setImageExists(true);
          const contentLength = response.headers.get("content-length");
          if (contentLength) {
            const sizeBytes = parseInt(contentLength, 10);
            setImageSize(Math.round((sizeBytes / (1000 * 1000)) * 100) / 100);
          }
        } else {
          setImageExists(false);
        }
        setImageLoaded(true);
      })
      .catch(() => setImageExists(false));
  }, [token, resolution]);

  return { imageLoaded, imageExists, imageSize };
}

export function NextGenTokenDownloadDropdownItem(props: NextGenTokenProps) {
  const { imageExists, imageSize } = useImageChecker(
    props.token,
    props.resolution
  );
  const downloader = useDownloader();

  return (
    <Dropdown.Item
      key={props.resolution}
      disabled={!imageExists}
      onClick={() => {
        if (imageExists) {
          downloader.download(
            getUrl(props.token, props.resolution),
            `${props.token.id}_${props.resolution.toUpperCase()}.png`
          );
        }
      }}>
      {props.resolution}
      {imageExists && imageSize > 0
        ? ` (${numberWithCommas(imageSize)} MB)`
        : " Coming Soon"}
    </Dropdown.Item>
  );
}

export default function NextGenTokenDownload(
  props: Readonly<{
    token: NextGenToken;
    resolution: Resolution;
  }>
) {
  const { imageLoaded, imageExists, imageSize } = useImageChecker(
    props.token,
    props.resolution
  );

  function printResolution(quality: Resolution) {
    return (
      <span className="d-flex gap-3 align-items-center no-wrap">
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

  function getDisplay() {
    if (!imageLoaded) {
      return <DotLoader />;
    }
    if (!imageExists) {
      return "Coming Soon";
    }
    return printResolution(props.resolution);
  }

  return (
    <Container className="no-padding pt-1 pb-1 ">
      <Row className="d-flex flex-wrap align-items-center">
        <Col xs={4}>
          <span className="no-wrap">
            <span>{props.resolution}</span>
            {imageExists &&
              imageSize > 0 &&
              ` (${numberWithCommas(imageSize)} MB)`}
          </span>
        </Col>
        <Col>{getDisplay()}</Col>
      </Row>
    </Container>
  );
}

export function NextGenTokenDownloadButton(
  props: Readonly<{
    token: NextGenToken;
    quality: Resolution;
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
            `${props.token.id}_${props.quality.toUpperCase()}.png`
          );
        }}
      />
    </Tippy>
  );
}

import styles from "./NextGenToken.module.scss";
import { useEffect, useRef, useState } from "react";
import { NextGenCollection, NextGenToken } from "../../../../entities/INextgen";
import { Container, Row, Col, Dropdown } from "react-bootstrap";
import { NextGenTokenImage, ZoomAction } from "./NextGenTokenImage";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import useDownloader from "react-use-downloader";
import Tippy from "@tippyjs/react";
import Lightbulb from "./Lightbulb";
import {
  NextGenTokenDownloadDropdownItem,
  Resolution,
  getUrl,
} from "./NextGenTokenDownload";
import { Spinner } from "../../../dotLoader/DotLoader";

interface Props {
  collection: NextGenCollection;
  token: NextGenToken;
}

enum Mode {
  LIVE = "Live",
  IMAGE = "Image",
}

export default function NextGenToken(props: Readonly<Props>) {
  const [mode, setMode] = useState<Mode>(Mode.IMAGE);
  const [isFullScreen, setIsFullScreen] = useState<boolean>(false);
  const [showBlackbox, setShowBlackbox] = useState<boolean>(false);
  const [showLightbox, setShowLightbox] = useState<boolean>(false);

  const [resolutionLoading, setResolutionLoading] = useState<boolean>(true);

  const tokenImageRef = useRef(null);

  const [imageZoomAction, setImageZoomAction] = useState<ZoomAction>();

  const [resolution, setResolution] = useState<Resolution>(Resolution["2K"]);

  const downloader = useDownloader({});

  const [isMobile, setIsMobile] = useState(false);

  function checkMobile() {
    const screenSize = window.innerWidth;
    if (screenSize <= 800) {
      setIsMobile(true);
    } else {
      setIsMobile(false);
    }
  }

  useEffect(() => {
    checkMobile();
  }, []);

  useEffect(() => {
    const handleResize = () => checkMobile();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    setResolutionLoading(true);
  }, [resolution]);

  useEffect(() => {
    const handleKeyDown = (event: any) => {
      if (event.key === "Escape") {
        setShowLightbox(false);
        setShowBlackbox(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    const handleClick = () => {
      setShowLightbox(false);
      setShowBlackbox(false);
    };
    window.addEventListener("mousedown", handleClick);

    const handleFullscreenChange = () => {
      if (document.fullscreenElement === tokenImageRef.current) {
        setIsFullScreen(true);
      } else {
        setIsFullScreen(false);
      }
    };
    window.addEventListener("fullscreenchange", handleFullscreenChange);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("fullscreenchange", handleFullscreenChange);
      window.removeEventListener("mousedown", handleClick);
    };
  }, []);

  function getModeStyle(m: Mode) {
    let s = `${styles.modeIcon}`;
    if (m === mode) {
      s += ` ${styles.modeIconSelected}`;
    }
    return s;
  }

  function getCurrentHref() {
    if (mode === Mode.LIVE) {
      return props.token.animation_url ?? props.token.generator?.html;
    }
    return props.token.image_url.replaceAll(
      "/png/",
      `/png${resolution.toLowerCase()}/`
    );
  }

  function printModeIcons() {
    return (
      <>
        <span className="d-flex gap-3">
          <span className="d-flex gap-1">
            <Dropdown drop={"down-centered"} className="d-flex">
              <Dropdown.Toggle
                className={styles.resolutionBtn}
                disabled={mode !== Mode.IMAGE || resolutionLoading}>
                <Tippy
                  content="Select Resolution"
                  hideOnClick={true}
                  placement="bottom"
                  theme="light"
                  delay={100}>
                  <span
                    className={
                      mode === Mode.IMAGE ? "font-color" : "font-color-h"
                    }>
                    {resolutionLoading ? "Rendering" : "Resolution"}:{" "}
                    {resolution}
                  </span>
                </Tippy>
              </Dropdown.Toggle>
              <Dropdown.Menu>
                {Object.values(Resolution).map((resolution) => (
                  <NextGenTokenDownloadDropdownItem
                    resolution={resolution}
                    setResolution={setResolution}
                    token={props.token}
                    key={resolution}
                  />
                ))}
              </Dropdown.Menu>
            </Dropdown>
          </span>
          <Tippy
            content="Image"
            hideOnClick={true}
            placement="bottom"
            theme="light"
            delay={100}>
            <FontAwesomeIcon
              className={getModeStyle(Mode.IMAGE)}
              onClick={() => setMode(Mode.IMAGE)}
              icon="image"
            />
          </Tippy>
          <Tippy
            content="Live"
            hideOnClick={true}
            placement="bottom"
            theme="light"
            delay={100}>
            <FontAwesomeIcon
              className={getModeStyle(Mode.LIVE)}
              onClick={() => setMode(Mode.LIVE)}
              icon="play-circle"
            />
          </Tippy>
        </span>
        <span className="d-flex gap-3">
          <Tippy
            content="Zoom In"
            hideOnClick={true}
            placement="bottom"
            theme="light"
            delay={100}>
            <FontAwesomeIcon
              className={getModeStyle(Mode.IMAGE)}
              onClick={() => {
                setImageZoomAction(ZoomAction.IN);
              }}
              icon="magnifying-glass-plus"
            />
          </Tippy>
          <Tippy
            content="Zoom Out"
            hideOnClick={true}
            placement="bottom"
            theme="light"
            delay={100}>
            <FontAwesomeIcon
              className={getModeStyle(Mode.IMAGE)}
              onClick={() => {
                setImageZoomAction(ZoomAction.OUT);
              }}
              icon="magnifying-glass-minus"
            />
          </Tippy>
          <Tippy
            content="Reset"
            hideOnClick={true}
            placement="bottom"
            theme="light"
            delay={100}>
            <FontAwesomeIcon
              className={getModeStyle(Mode.IMAGE)}
              onClick={() => {
                setImageZoomAction(ZoomAction.RESET);
              }}
              icon="refresh"
            />
          </Tippy>
          <Lightbulb
            mode="black"
            className={styles.modeIcon}
            onClick={() => setShowBlackbox(true)}
          />
          <Lightbulb
            mode="light"
            className={styles.modeIcon}
            onClick={() => setShowLightbox(true)}
          />
          {downloader.isInProgress ? (
            <Spinner />
          ) : (
            <Tippy
              content="Download"
              hideOnClick={true}
              placement="bottom"
              theme="light"
              delay={100}>
              <FontAwesomeIcon
                className={styles.modeIcon}
                icon="download"
                onClick={() => {
                  downloader.download(
                    getUrl(props.token, resolution),
                    `${props.token.id}_${resolution.toUpperCase()}.png`
                  );
                }}
              />
            </Tippy>
          )}
          <Tippy
            content="Open in new tab"
            hideOnClick={true}
            placement="bottom"
            theme="light"
            delay={100}>
            <FontAwesomeIcon
              className={styles.modeIcon}
              onClick={() => {
                const href = getCurrentHref();
                window.open(href, "_blank");
              }}
              icon="external-link"
            />
          </Tippy>
          <Tippy
            content="Fullscreen"
            hideOnClick={true}
            placement="bottom"
            theme="light"
            delay={100}>
            <FontAwesomeIcon
              className={styles.modeIcon}
              icon="maximize"
              onClick={toggleFullScreen}
            />
          </Tippy>
        </span>
      </>
    );
  }

  const toggleFullScreen = () => {
    if (tokenImageRef.current) {
      if (!document.fullscreenElement) {
        (tokenImageRef.current as any).requestFullscreen().catch((err: any) => {
          alert(
            `Error attempting to enable full-screen mode: ${err.message} (${err.name})`
          );
        });
      } else {
        document.exitFullscreen?.();
      }
    }
  };

  function getBoxStyle() {
    if (showLightbox) {
      return styles.lightBox;
    }
    if (showBlackbox) {
      return styles.blackBox;
    }
    return `row ${styles.modeRow}`;
  }

  return (
    <Container>
      <Row>
        <Col>
          <Container>
            <Row>
              <Col>
                <div className={getBoxStyle()}>
                  <div
                    className={
                      showLightbox || showBlackbox
                        ? styles.lightBoxContent
                        : "col pt-3"
                    }
                    ref={tokenImageRef}>
                    <NextGenTokenImage
                      token={props.token}
                      hide_info={true}
                      hide_link={true}
                      show_animation={mode !== Mode.IMAGE}
                      is_fullscreen={isFullScreen}
                      resolution={resolution}
                      isLoading={setResolutionLoading}
                      zoom={imageZoomAction}
                      onZoomActionEnd={() => setImageZoomAction(undefined)}
                    />
                  </div>
                </div>
              </Col>
            </Row>
          </Container>
        </Col>
      </Row>
      <Row>
        <Col>
          <Container className={styles.modeRow}>
            <Row>
              <Col
                className={`pt-4 pb-3 d-flex align-items-center justify-content-between ${
                  isMobile ? "flex-column gap-3" : ""
                }`}>
                {printModeIcons()}
              </Col>
            </Row>
          </Container>
        </Col>
      </Row>
      {mode === Mode.LIVE && (
        <Row className="pt-2 font-color-h font-smaller">
          <Col>
            * Live view generates the image dynamically from scratch in your
            browser. Pebbles have a computationally expensive script and the
            live view may take several minutes to render on your computer or
            phone. &quot;Image view&quot; will download faster.
          </Col>
        </Row>
      )}
    </Container>
  );
}

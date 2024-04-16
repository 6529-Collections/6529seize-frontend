import styles from "./NextGenToken.module.scss";
import { useEffect, useRef, useState } from "react";
import { NextGenCollection, NextGenToken } from "../../../../entities/INextgen";
import { Container, Row, Col, Dropdown } from "react-bootstrap";
import { NextGenTokenImage, get16KUrl, get8KUrl } from "./NextGenTokenImage";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Tippy from "@tippyjs/react";
import Lightbulb from "./Lightbulb";
import {
  NextGenTokenDownloadDropdownItem,
  Resolution,
} from "./NextGenTokenDownload";
import { NextGenTokenImageMode } from "../../nextgen_helpers";
import {
  NextGenTokenArtImageCanvas,
  getNextGenTokenScene,
} from "./NextGenTokenScene";
import useDownloader from "react-use-downloader";
import useIsMobileDevice from "../../../../hooks/isMobileDevice";
import NextGenZoomableImage, {
  MAX_ZOOM_SCALE,
  MIN_ZOOM_SCALE,
} from "./NextGenZoomableImage";
import useIsMobileScreen from "../../../../hooks/isMobileScreen";

interface Props {
  collection: NextGenCollection;
  token: NextGenToken;
  mode: NextGenTokenImageMode;
  setMode: (mode: NextGenTokenImageMode) => void;
}

export function NextGenTokenArtImage(
  props: Readonly<{
    token: NextGenToken;
    mode: NextGenTokenImageMode;
    is_fullscreen: boolean;
    setCanvasUrl: (url: string) => void;
    is_zoom: boolean;
    zoom_scale: number;
    setZoomScale: (scale: number) => void;
    onImageLoaded: () => void;
  }>
) {
  const scene = getNextGenTokenScene(props.mode);
  if (scene) {
    return (
      <NextGenTokenArtImageCanvas
        scene={scene}
        token={props.token}
        is_fullscreen={props.is_fullscreen}
        setCanvasUrl={props.setCanvasUrl}
      />
    );
  }

  if (props.mode === NextGenTokenImageMode.HIGH_RES) {
    return (
      <NextGenZoomableImage
        token={props.token}
        is_fullscreen={props.is_fullscreen}
        zoom_scale={props.zoom_scale}
        setZoomScale={props.setZoomScale}
        maintain_aspect_ratio={false}
        onImageLoaded={props.onImageLoaded}
      />
    );
  }

  return (
    <NextGenTokenImage
      token={props.token}
      show_original
      hide_info={true}
      hide_link={true}
      show_animation={props.mode === NextGenTokenImageMode.LIVE}
      is_fullscreen={props.is_fullscreen}
      token_art={true}
    />
  );
}

export default function NextGenTokenArt(props: Readonly<Props>) {
  const downloader = useDownloader();
  const mode = props.mode;
  const isMobileDevice = useIsMobileDevice();
  const isMobileScreen = useIsMobileScreen();
  const [isFullScreen, setIsFullScreen] = useState<boolean>(false);
  const [showBlackbox, setShowBlackbox] = useState<boolean>(false);
  const [showLightbox, setShowLightbox] = useState<boolean>(false);

  const [zoomScale, setZoomScale] = useState(1);
  const [showZoomControls, setShowZoomControls] = useState(false);

  const tokenImageRef = useRef(null);

  const [canvasUrl, setCanvasUrl] = useState<string>("");

  useEffect(() => {
    setCanvasUrl("");
  }, [mode]);

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

  function getModeStyle(m: NextGenTokenImageMode) {
    let s = `${styles.modeIcon}`;
    if (m === mode) {
      s += ` ${styles.modeIconSelected}`;
    }
    return s;
  }

  function getCurrentHref() {
    if (mode === NextGenTokenImageMode.LIVE) {
      return props.token.animation_url ?? props.token.generator?.html;
    }
    if (canvasUrl) {
      return canvasUrl;
    }

    if (mode === NextGenTokenImageMode.HIGH_RES) {
      if (isMobileDevice) {
        return get8KUrl(props.token.id);
      }
      return get16KUrl(props.token.id);
    }
    return props.token.image_url;
  }

  const handleScaleDown = () => {
    setZoomScale(Math.max(zoomScale - 1, MIN_ZOOM_SCALE));
  };

  const handleScaleUp = () => {
    setZoomScale(Math.min(zoomScale + 1, MAX_ZOOM_SCALE));
  };

  function printModeIcons() {
    return (
      <>
        <Col
          xs={12}
          sm={
            mode === NextGenTokenImageMode.HIGH_RES ||
            (props.mode !== NextGenTokenImageMode.IMAGE &&
              props.mode !== NextGenTokenImageMode.LIVE &&
              props.mode !== NextGenTokenImageMode.HIGH_RES)
              ? 4
              : 6
          }
          className={`pt-2 pb-2 d-flex gap-3 ${
            isMobileScreen ? "justify-content-center" : "justify-content-start"
          }`}>
          <button
            className={`unselectable ${styles.imageResolutionBtn} ${
              mode === NextGenTokenImageMode.IMAGE
                ? styles.imageResolutionBtnSelected
                : ""
            }`}
            onClick={() => props.setMode(NextGenTokenImageMode.IMAGE)}>
            2K
          </button>
          <button
            className={`unselectable ${styles.imageResolutionBtn} ${
              mode === NextGenTokenImageMode.HIGH_RES
                ? styles.imageResolutionBtnSelected
                : ""
            }`}
            onClick={() => props.setMode(NextGenTokenImageMode.HIGH_RES)}>
            {isMobileDevice ? "8K" : "16K"}
          </button>
          <Tippy
            content="Live"
            hideOnClick={true}
            placement="bottom"
            theme="light"
            delay={100}>
            <FontAwesomeIcon
              className={getModeStyle(NextGenTokenImageMode.LIVE)}
              onClick={() => props.setMode(NextGenTokenImageMode.LIVE)}
              icon="play-circle"
            />
          </Tippy>
        </Col>
        {mode === NextGenTokenImageMode.HIGH_RES && (
          <Col
            xs={6}
            sm={4}
            className="pt-2 pb-2 d-flex align-items-center gap-1 justify-content-center">
            {showZoomControls && (
              <>
                <FontAwesomeIcon
                  className={styles.modeIcon}
                  icon="minus-square"
                  onClick={handleScaleDown}
                  style={{
                    color: zoomScale === MIN_ZOOM_SCALE ? "#9a9a9a" : "white",
                  }}
                />
                <span className="unselectable">Scale: {zoomScale}</span>
                <FontAwesomeIcon
                  className={styles.modeIcon}
                  icon="plus-square"
                  onClick={handleScaleUp}
                  style={{
                    color: zoomScale === MAX_ZOOM_SCALE ? "#9a9a9a" : "white",
                  }}
                />
                <FontAwesomeIcon
                  className={styles.modeIcon}
                  icon="refresh"
                  onClick={() => setZoomScale(MIN_ZOOM_SCALE)}
                  style={{
                    paddingLeft: "5px",
                    color: zoomScale === MIN_ZOOM_SCALE ? "#9a9a9a" : "white",
                  }}
                />
              </>
            )}
          </Col>
        )}
        {props.mode !== NextGenTokenImageMode.IMAGE &&
          props.mode !== NextGenTokenImageMode.LIVE &&
          props.mode !== NextGenTokenImageMode.HIGH_RES && (
            <Col
              xs={12}
              sm={4}
              className="pt-2 pb-2 d-flex align-items-center gap-1 justify-content-center">
              Scene: {props.mode}
            </Col>
          )}
        <Col
          xs={mode === NextGenTokenImageMode.HIGH_RES ? 6 : 12}
          sm={
            mode === NextGenTokenImageMode.HIGH_RES ||
            (props.mode !== NextGenTokenImageMode.IMAGE &&
              props.mode !== NextGenTokenImageMode.LIVE &&
              props.mode !== NextGenTokenImageMode.HIGH_RES)
              ? 4
              : 6
          }
          className={`pt-2 pb-2 d-flex gap-3 ${
            isMobileScreen ? "justify-content-center" : "justify-content-end"
          }`}>
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
          <Dropdown drop={"down-centered"} className="d-flex">
            <Dropdown.Toggle className={styles.downloadBtn}>
              <Tippy
                content="Download"
                hideOnClick={true}
                placement="bottom"
                theme="light"
                delay={100}>
                <FontAwesomeIcon className={styles.modeIcon} icon="download" />
              </Tippy>
            </Dropdown.Toggle>
            <Dropdown.Menu>
              {canvasUrl && (
                <Dropdown.Item
                  onClick={() => {
                    downloader.download(
                      canvasUrl,
                      `${props.token.name} - ${mode}.jpeg`
                    );
                  }}>
                  Scene
                </Dropdown.Item>
              )}
              {Object.values(Resolution)
                .filter(
                  (r) => ![Resolution["0.5K"], Resolution.Thumbnail].includes(r)
                )
                .map((resolution) => (
                  <NextGenTokenDownloadDropdownItem
                    resolution={resolution}
                    token={props.token}
                    key={resolution}
                  />
                ))}
            </Dropdown.Menu>
          </Dropdown>
          <Tippy
            content={`Open in new tab${
              canvasUrl ? " (Not Supported for Scenes)" : ""
            }`}
            hideOnClick={true}
            placement="bottom"
            theme="light"
            delay={100}>
            <FontAwesomeIcon
              className={styles.modeIcon}
              onClick={() => {
                if (canvasUrl) return;
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
        </Col>
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

  useEffect(() => {
    setShowZoomControls(false);
  }, [mode]);

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
                        : "col pt-3 text-center"
                    }
                    ref={tokenImageRef}>
                    <NextGenTokenArtImage
                      token={props.token}
                      mode={mode}
                      is_fullscreen={isFullScreen}
                      setCanvasUrl={setCanvasUrl}
                      is_zoom={mode === NextGenTokenImageMode.HIGH_RES}
                      zoom_scale={zoomScale}
                      setZoomScale={setZoomScale}
                      onImageLoaded={() => {
                        setShowZoomControls(true);
                      }}
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
            <Row className="pt-2 pb-1">{printModeIcons()}</Row>
          </Container>
        </Col>
      </Row>
      {mode === NextGenTokenImageMode.LIVE && (
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

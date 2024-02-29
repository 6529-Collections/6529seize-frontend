import styles from "./NextGenToken.module.scss";
import { useEffect, useRef, useState } from "react";
import { NextGenCollection, NextGenToken } from "../../../../entities/INextgen";
import { Container, Row, Col, Dropdown } from "react-bootstrap";
import { NextGenTokenImage, get16KUrl } from "./NextGenTokenImage";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Tippy from "@tippyjs/react";
import Lightbulb from "./Lightbulb";
import {
  NextGenTokenDownloadDropdownItem,
  Resolution,
} from "./NextGenTokenDownload";

interface Props {
  collection: NextGenCollection;
  token: NextGenToken;
}

enum Mode {
  LIVE = "Live",
  IMAGE = "Image",
  S16K = "16K",
}

export function NextGenTokenArtImage(
  props: Readonly<{
    token: NextGenToken;
    mode: Mode;
    is_fullscreen: boolean;
    is_zoom: boolean;
  }>
) {
  return (
    <NextGenTokenImage
      token={props.token}
      show_original
      hide_info={true}
      hide_link={true}
      show_animation={props.mode === Mode.LIVE}
      is_fullscreen={props.is_fullscreen}
      is_zoom={props.is_zoom}
    />
  );
}

export default function NextGenToken(props: Readonly<Props>) {
  const [mode, setMode] = useState<Mode>(Mode.IMAGE);
  const [isFullScreen, setIsFullScreen] = useState<boolean>(false);
  const [showBlackbox, setShowBlackbox] = useState<boolean>(false);
  const [showLightbox, setShowLightbox] = useState<boolean>(false);

  const tokenImageRef = useRef(null);

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
    if (mode === Mode.S16K) {
      return get16KUrl(props.token.id);
    }
    return props.token.image_url;
  }

  function printModeIcons() {
    return (
      <>
        <span className="d-flex gap-3">
          <button
            className={`${styles.imageResolutionBtn} ${
              mode === Mode.IMAGE ? styles.imageResolutionBtnSelected : ""
            }`}
            onClick={() => setMode(Mode.IMAGE)}>
            2K
          </button>
          <button
            className={`${styles.imageResolutionBtn} ${
              mode === Mode.S16K ? styles.imageResolutionBtnSelected : ""
            }`}
            onClick={() => setMode(Mode.S16K)}>
            16K
          </button>
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
              {Object.values(Resolution).map((resolution) => (
                <NextGenTokenDownloadDropdownItem
                  resolution={resolution}
                  token={props.token}
                  key={resolution}
                />
              ))}
            </Dropdown.Menu>
          </Dropdown>
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
                    <NextGenTokenArtImage
                      token={props.token}
                      mode={mode}
                      is_fullscreen={isFullScreen}
                      is_zoom={mode === Mode.S16K}
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
              <Col className="pt-4 pb-3 d-flex align-items-center justify-content-between">
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

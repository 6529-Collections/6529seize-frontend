import styles from "./NextGenToken.module.scss";
import { useEffect, useRef, useState } from "react";
import { NextGenCollection, NextGenToken } from "../../../../entities/INextgen";
import { Container, Row, Col, Dropdown } from "react-bootstrap";
import { NextGenTokenImage } from "./NextGenTokenImage";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import useDownloader from "react-use-downloader";
import Tippy from "@tippyjs/react";
import Lightbulb from "./Lightbulb";
import { Quality, getUrl } from "./NextGenTokenDownloads";

interface Props {
  collection: NextGenCollection;
  token: NextGenToken;
}

enum Mode {
  HTML = "HTML",
  IMAGE = "Image",
}

export function NextGenTokenArtImage(
  props: Readonly<{
    token: NextGenToken;
    mode: Mode;
    is_fullscreen: boolean;
  }>
) {
  return (
    <NextGenTokenImage
      token={props.token}
      hide_info={true}
      hide_link={true}
      show_animation={props.mode !== Mode.IMAGE}
      is_fullscreen={props.is_fullscreen}
    />
  );
}

export default function NextGenToken(props: Readonly<Props>) {
  const [mode, setMode] = useState<Mode>(Mode.HTML);
  const [isFullScreen, setIsFullScreen] = useState<boolean>(false);
  const [showBlackbox, setShowBlackbox] = useState<boolean>(false);
  const [showLightbox, setShowLightbox] = useState<boolean>(false);
  const [showDownloadDropdown, setShowDownloadDropdown] = useState(false);

  const tokenImageRef = useRef(null);

  const downloader = useDownloader({});

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
    switch (mode) {
      case Mode.HTML:
        return {
          href: props.token.animation_url,
          extension: "html",
        };
      case Mode.IMAGE:
        return {
          href: props.token.generator_url.replace("metadata", "html"),
          extension: "html",
        };
    }
    return {
      href: props.token.image_url,
      extension: "png",
    };
  }

  function printModeIcons() {
    return (
      <>
        <span className="d-flex gap-3">
          <Tippy
            content="HTML"
            hideOnClick={true}
            placement="bottom"
            theme="light"
            delay={100}>
            <FontAwesomeIcon
              className={getModeStyle(Mode.HTML)}
              onClick={() => setMode(Mode.HTML)}
              icon="play-circle"
            />
          </Tippy>
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
          {/* <NextGenTokenDownloadButton
            class={styles.modeIcon}
            token={props.token}
            quality={Quality.HD}
          /> */}
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
            <Dropdown.Menu show={showDownloadDropdown}>
              {Object.values(Quality).map((quality) => (
                <Dropdown.Item
                  key={quality}
                  onClick={() => {
                    downloader.download(
                      getUrl(props.token, quality),
                      `${props.token.id}_${quality.toUpperCase()}`
                    );
                  }}>
                  {quality}
                </Dropdown.Item>
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
                window.open(href.href, "_blank");
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
        if (document.exitFullscreen) {
          document.exitFullscreen();
        }
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
    </Container>
  );
}

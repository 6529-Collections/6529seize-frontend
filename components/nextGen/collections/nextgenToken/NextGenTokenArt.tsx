import styles from "./NextGenToken.module.scss";
import { useEffect, useRef, useState } from "react";
import { NextGenCollection, NextGenToken } from "../../../../entities/INextgen";
import { Container, Row, Col } from "react-bootstrap";
import { NextGenTokenImage } from "./NextGenTokenImage";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import useDownloader from "react-use-downloader";
import Tippy from "@tippyjs/react";
import Lightbulb from "./Lightbulb";

interface Props {
  collection: NextGenCollection;
  token: NextGenToken;
}

enum Mode {
  DEFAULT = "Default",
  IMAGE = "Image",
  LIVE = "Live",
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
      live={props.mode === Mode.LIVE}
      is_fullscreen={props.is_fullscreen}
    />
  );
}

export default function NextGenToken(props: Readonly<Props>) {
  const [mode, setMode] = useState<Mode>(Mode.DEFAULT);
  const [isFullScreen, setIsFullScreen] = useState<boolean>(false);
  const [showBlackbox, setShowBlackbox] = useState<boolean>(false);
  const [showLightbox, setShowLightbox] = useState<boolean>(false);

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
      case Mode.DEFAULT:
        return {
          href: props.token.animation_url,
          extension: "html",
        };
      case Mode.LIVE:
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
            content="Default"
            hideOnClick={true}
            placement="bottom"
            theme="light"
            delay={350}>
            <FontAwesomeIcon
              className={getModeStyle(Mode.DEFAULT)}
              onClick={() => setMode(Mode.DEFAULT)}
              icon="play-circle"
            />
          </Tippy>
          <Tippy
            content="Image"
            hideOnClick={true}
            placement="bottom"
            theme="light"
            delay={350}>
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
            delay={350}>
            <FontAwesomeIcon
              className={getModeStyle(Mode.LIVE)}
              onClick={() => setMode(Mode.LIVE)}
              icon="tower-broadcast"
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
          <Tippy
            content="Download"
            hideOnClick={true}
            placement="bottom"
            theme="light"
            delay={350}>
            <FontAwesomeIcon
              className={styles.modeIcon}
              onClick={() => {
                const href = getCurrentHref();
                downloader.download(
                  href.href,
                  `${props.token.name} - ${mode}.${href.extension}`
                );
              }}
              icon="download"
            />
          </Tippy>
          <Tippy
            content="Open in new tab"
            hideOnClick={true}
            placement="bottom"
            theme="light"
            delay={350}>
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
            delay={350}>
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

  return (
    <Container>
      <Row>
        <Col>
          <Container>
            <div
              className={
                showLightbox
                  ? styles.lightBox
                  : showBlackbox
                  ? styles.blackBox
                  : `row ${styles.modeRow}`
              }>
              <div
                className={
                  showLightbox || showBlackbox
                    ? styles.lightBoxContent
                    : "col pt-3"
                }
                ref={tokenImageRef}>
                <>
                  {(showLightbox || showBlackbox) && (
                    <div>
                      <FontAwesomeIcon
                        onClick={() => {
                          setShowLightbox(false);
                          setShowBlackbox(false);
                        }}
                        className={
                          showBlackbox
                            ? styles.blackBoxCloseIcon
                            : styles.lightBoxCloseIcon
                        }
                        icon="times-circle"></FontAwesomeIcon>
                    </div>
                  )}
                  <NextGenTokenArtImage
                    token={props.token}
                    mode={mode}
                    is_fullscreen={isFullScreen}
                  />
                </>
              </div>
            </div>
          </Container>
        </Col>
      </Row>
      <Row>
        <Col>
          <Container className={styles.modeRow}>
            <Row>
              <Col className="pt-4 pb-3 d-flex gap-2 align-items-center justify-content-center gap-5">
                {printModeIcons()}
              </Col>
            </Row>
          </Container>
        </Col>
      </Row>
    </Container>
  );
}

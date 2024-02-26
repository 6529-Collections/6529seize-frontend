import styles from "./NextGenToken.module.scss";
import { useEffect, useRef, useState } from "react";
import { NextGenCollection, NextGenToken } from "../../../../entities/INextgen";
import { Container, Row, Col, Dropdown } from "react-bootstrap";
import { NextGenTokenImage } from "./NextGenTokenImage";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Tippy from "@tippyjs/react";
import Lightbulb from "./Lightbulb";
import {
  NextGenTokenDownloadDropdownItem,
  Resolution,
} from "./NextGenTokenDownload";
import { NextGenTokenImageMode } from "../../nextgen_helpers";

interface Props {
  collection: NextGenCollection;
  token: NextGenToken;
  mode: NextGenTokenImageMode;
  setMode: (mode: NextGenTokenImageMode) => void;
}

export function NextGenTokenArtImageCanvas1(
  props: Readonly<{ token: NextGenToken }>
) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageSrc = props.token.image_url;
  const settingImageSrc = "/nextgen/settings/pebble-museum.jpeg";

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");

    if (canvas && context) {
      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = "high";

      const settingImage = new Image();
      settingImage.src = settingImageSrc;
      settingImage.onload = () => {
        canvas.width = settingImage.width;
        canvas.height = settingImage.height;

        context.drawImage(settingImage, 0, 0);

        const tokenImage = new Image();
        tokenImage.src = imageSrc;
        tokenImage.onload = () => {
          const imageWidth = canvas.width * 0.2377;
          const aspectRatio = tokenImage.width / tokenImage.height;
          const imageHeight = imageWidth / aspectRatio;

          const xPosition = canvas.width * 0.4163;
          const yPosition = canvas.height * 0.176;

          context.imageSmoothingEnabled = true;
          context.imageSmoothingQuality = "high";
          context.drawImage(
            tokenImage,
            xPosition,
            yPosition,
            imageWidth,
            imageHeight
          );
        };
      };
    }
  }, [imageSrc, settingImageSrc]);

  return <canvas ref={canvasRef} style={{ width: "100%" }} />;
}

export function NextGenTokenArtImageCanvas2(
  props: Readonly<{ token: NextGenToken }>
) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageSrc = props.token.image_url;
  const settingImageSrc = "/nextgen/settings/grand-lobby.jpeg";

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");

    if (canvas && context) {
      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = "high";

      const settingImage = new Image();
      settingImage.src = settingImageSrc;
      settingImage.onload = () => {
        canvas.width = settingImage.width;
        canvas.height = settingImage.height;

        context.drawImage(settingImage, 0, 0);

        const tokenImage = new Image();
        tokenImage.src = imageSrc;
        tokenImage.onload = () => {
          const imageWidth = canvas.width * 0.2004;
          const aspectRatio = tokenImage.width / tokenImage.height;
          const imageHeight = imageWidth / aspectRatio;

          const xPosition = canvas.width * 0.4065;
          const yPosition = canvas.height * 0.211;

          context.imageSmoothingEnabled = true;
          context.imageSmoothingQuality = "high";

          // const borderWidth = 1.5;
          // context.strokeStyle = "black";
          // context.lineWidth = borderWidth;
          // context.strokeRect(
          //   xPosition - borderWidth / 2,
          //   yPosition - borderWidth / 2,
          //   imageWidth + borderWidth,
          //   imageHeight + borderWidth
          // );
          context.drawImage(
            tokenImage,
            xPosition,
            yPosition,
            imageWidth,
            imageHeight
          );
        };
      };
    }
  }, [imageSrc, settingImageSrc]);

  return <canvas ref={canvasRef} style={{ width: "100%" }} />;
}

export function NextGenTokenArtImageCanvas3(
  props: Readonly<{ token: NextGenToken }>
) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageSrc = props.token.image_url;
  const settingImageSrc = "/nextgen/settings/nyc-loft.jpeg";

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");

    if (canvas && context) {
      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = "high";

      const settingImage = new Image();
      settingImage.src = settingImageSrc;
      settingImage.onload = () => {
        canvas.width = settingImage.width;
        canvas.height = settingImage.height;

        context.drawImage(settingImage, 0, 0);

        const tokenImage = new Image();
        tokenImage.src = imageSrc;
        tokenImage.onload = () => {
          const imageWidth = canvas.width * 0.1345;
          const aspectRatio = tokenImage.width / tokenImage.height;
          const imageHeight = imageWidth / aspectRatio;

          const xPosition = canvas.width * 0.589;
          const yPosition = canvas.height * 0.295;

          context.imageSmoothingEnabled = true;
          context.imageSmoothingQuality = "high";

          const borderWidth = 1.5;
          context.strokeStyle = "black";
          context.lineWidth = borderWidth;
          context.strokeRect(
            xPosition - borderWidth / 2,
            yPosition - borderWidth / 2,
            imageWidth + borderWidth,
            imageHeight + borderWidth
          );

          context.drawImage(
            tokenImage,
            xPosition,
            yPosition,
            imageWidth,
            imageHeight
          );
        };
      };
    }
  }, [imageSrc, settingImageSrc]);

  return <canvas ref={canvasRef} style={{ width: "100%" }} />;
}

export function NextGenTokenArtImageCanvas4(
  props: Readonly<{ token: NextGenToken }>
) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageSrc = props.token.image_url;
  const settingImageSrc = "/nextgen/settings/ghetto-alley.jpeg";

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");

    if (canvas && context) {
      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = "high";

      const settingImage = new Image();
      settingImage.src = settingImageSrc;
      settingImage.onload = () => {
        canvas.width = settingImage.width;
        canvas.height = settingImage.height;

        context.drawImage(settingImage, 0, 0);

        const tokenImage = new Image();
        tokenImage.src = imageSrc;
        tokenImage.onload = () => {
          const imageWidth = canvas.width * 0.2621;
          const aspectRatio = tokenImage.width / tokenImage.height;
          const imageHeight = imageWidth / aspectRatio;

          const xPosition = canvas.width * 0.379;
          const yPosition = canvas.height * 0.11;

          context.imageSmoothingEnabled = true;
          context.imageSmoothingQuality = "high";

          // const borderWidth = 1.5;
          // context.strokeStyle = "black";
          // context.lineWidth = borderWidth;
          // context.strokeRect(
          //   xPosition - borderWidth / 2,
          //   yPosition - borderWidth / 2,
          //   imageWidth + borderWidth,
          //   imageHeight + borderWidth
          // );

          context.drawImage(
            tokenImage,
            xPosition,
            yPosition,
            imageWidth,
            imageHeight
          );
        };
      };
    }
  }, [imageSrc, settingImageSrc]);

  return <canvas ref={canvasRef} style={{ width: "100%" }} />;
}

export function NextGenTokenArtImage(
  props: Readonly<{
    token: NextGenToken;
    mode: NextGenTokenImageMode;
    is_fullscreen: boolean;
  }>
) {
  if (props.mode === NextGenTokenImageMode.PEBBLE_MUSEUM) {
    return <NextGenTokenArtImageCanvas1 token={props.token} />;
  } else if (props.mode === NextGenTokenImageMode.GRAND_LOBBY) {
    return <NextGenTokenArtImageCanvas2 token={props.token} />;
  } else if (props.mode === NextGenTokenImageMode.NYC_LOFT) {
    return <NextGenTokenArtImageCanvas3 token={props.token} />;
  } else if (props.mode === NextGenTokenImageMode.URBAN_ALLEY) {
    return <NextGenTokenArtImageCanvas4 token={props.token} />;
  }

  return (
    <NextGenTokenImage
      token={props.token}
      hide_info={true}
      hide_link={true}
      show_animation={props.mode !== NextGenTokenImageMode.IMAGE}
      is_fullscreen={props.is_fullscreen}
    />
  );
}

export default function NextGenToken(props: Readonly<Props>) {
  const mode = props.mode;
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
    return props.token.image_url;
  }

  function printModeIcons() {
    return (
      <>
        <span className="d-flex gap-3">
          <Tippy
            content="Image"
            hideOnClick={true}
            placement="bottom"
            theme="light"
            delay={100}>
            <FontAwesomeIcon
              className={getModeStyle(NextGenTokenImageMode.IMAGE)}
              onClick={() => props.setMode(NextGenTokenImageMode.IMAGE)}
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
              className={getModeStyle(NextGenTokenImageMode.LIVE)}
              onClick={() => props.setMode(NextGenTokenImageMode.LIVE)}
              icon="play-circle"
            />
          </Tippy>
          {props.mode !== NextGenTokenImageMode.IMAGE &&
            props.mode !== NextGenTokenImageMode.LIVE && (
              <span>Scene: {props.mode}</span>
            )}
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
                        : "col pt-3 text-center"
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

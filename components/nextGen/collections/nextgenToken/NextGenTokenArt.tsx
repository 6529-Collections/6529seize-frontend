"use client";

import {
  faDownload,
  faExternalLink,
  faMaximize,
  faMinusSquare,
  faPlayCircle,
  faPlusSquare,
  faRefresh,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useEffect, useRef, useState } from "react";
import { Dropdown } from "react-bootstrap";
import { Tooltip } from "react-tooltip";
import type { NextGenCollection, NextGenToken } from "@/entities/INextgen";
import useIsMobileDevice from "@/hooks/isMobileDevice";
import useIsMobileScreen from "@/hooks/isMobileScreen";
import Lightbulb from "./Lightbulb";
import styles from "./NextGenToken.module.scss";
import {
  NextGenTokenDownloadDropdownItem,
  Resolution,
} from "./NextGenTokenDownload";
import { NextGenTokenImage, get16KUrl, get8KUrl } from "./NextGenTokenImage";
import NextGenZoomableImage, {
  MAX_ZOOM_SCALE,
  MIN_ZOOM_SCALE,
} from "./NextGenZoomableImage";

interface Props {
  collection: NextGenCollection;
  token: NextGenToken;
}

enum Mode {
  LIVE = "Live",
  IMAGE = "Image",
  HIGH_RES = "High Res",
}

function NextGenTokenArtImage(
  props: Readonly<{
    token: NextGenToken;
    mode: Mode;
    is_fullscreen: boolean;
    zoom_scale: number;
    setZoomScale: (scale: number) => void;
    onImageLoaded: () => void;
  }>
) {
  if (props.mode === Mode.HIGH_RES) {
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
      show_animation={props.mode === Mode.LIVE}
      is_fullscreen={props.is_fullscreen}
      token_art={true}
    />
  );
}

export default function NextGenTokenArt(props: Readonly<Props>) {
  const isMobileDevice = useIsMobileDevice();
  const isMobileScreen = useIsMobileScreen();
  const [mode, setMode] = useState<Mode>(Mode.IMAGE);
  const [isFullScreen, setIsFullScreen] = useState<boolean>(false);
  const [showBlackbox, setShowBlackbox] = useState<boolean>(false);
  const [showLightbox, setShowLightbox] = useState<boolean>(false);

  const [zoomScale, setZoomScale] = useState(1);
  const [showZoomControls, setShowZoomControls] = useState(false);

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
    let s = `${styles["modeIcon"]}`;
    if (m === mode) {
      s += ` ${styles["modeIconSelected"]}`;
    }
    return s;
  }

  function getCurrentHref() {
    if (mode === Mode.LIVE) {
      return props.token.animation_url ?? props.token.generator?.html;
    }
    if (mode === Mode.HIGH_RES) {
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
        <div
          className={`tw-relative tw-w-full tw-shrink-0 tw-grow-0 tw-basis-auto tw-px-3 min-[576px]:tw-shrink-0 min-[576px]:tw-grow-0 min-[576px]:tw-basis-auto ${mode === Mode.HIGH_RES ? "min-[576px]:tw-w-1/3" : "min-[576px]:tw-w-1/2"} pt-2 pb-2 d-flex gap-3 align-items-center ${
            isMobileScreen ? "justify-content-center" : "justify-content-start"
          }`}
          style={{ maxWidth: "100%" }}
        >
          <button
            className={`unselectable ${styles["imageResolutionBtn"]} ${
              mode === Mode.IMAGE ? styles["imageResolutionBtnSelected"] : ""
            }`}
            onClick={() => setMode(Mode.IMAGE)}
          >
            2K
          </button>
          <button
            className={`unselectable ${styles["imageResolutionBtn"]} ${
              mode === Mode.HIGH_RES ? styles["imageResolutionBtnSelected"] : ""
            }`}
            onClick={() => setMode(Mode.HIGH_RES)}
          >
            {isMobileDevice ? "8K" : "16K"}
          </button>
          <FontAwesomeIcon
            className={getModeStyle(Mode.LIVE)}
            onClick={() => setMode(Mode.LIVE)}
            icon={faPlayCircle}
            data-tooltip-id={`live-tooltip-${props.token.id}`}
          />
          <Tooltip
            id={`live-tooltip-${props.token.id}`}
            place="bottom"
            style={{
              backgroundColor: "#1F2937",
              color: "white",
              padding: "4px 8px",
            }}
          >
            Live
          </Tooltip>
        </div>
        {mode === Mode.HIGH_RES && (
          <div
            className="pt-2 pb-2 d-flex align-items-center gap-1 justify-content-center tw-relative tw-w-1/2 tw-shrink-0 tw-grow-0 tw-basis-auto tw-px-3 min-[576px]:tw-w-1/3 min-[576px]:tw-shrink-0 min-[576px]:tw-grow-0 min-[576px]:tw-basis-auto"
            style={{ maxWidth: "100%" }}
          >
            {showZoomControls && (
              <>
                <FontAwesomeIcon
                  className={styles["modeIcon"]}
                  icon={faMinusSquare}
                  onClick={handleScaleDown}
                  style={{
                    color: zoomScale === MIN_ZOOM_SCALE ? "#9a9a9a" : "white",
                  }}
                />
                <span className="unselectable">Scale: {zoomScale}</span>
                <FontAwesomeIcon
                  className={styles["modeIcon"]}
                  icon={faPlusSquare}
                  onClick={handleScaleUp}
                  style={{
                    color: zoomScale === MAX_ZOOM_SCALE ? "#9a9a9a" : "white",
                  }}
                />
                <FontAwesomeIcon
                  className={styles["modeIcon"]}
                  icon={faRefresh}
                  onClick={() => setZoomScale(MIN_ZOOM_SCALE)}
                  style={{
                    paddingLeft: "5px",
                    color: zoomScale === MIN_ZOOM_SCALE ? "#9a9a9a" : "white",
                  }}
                />
              </>
            )}
          </div>
        )}
        <div
          className={`tw-relative tw-shrink-0 tw-grow-0 tw-basis-auto tw-px-3 min-[576px]:tw-shrink-0 min-[576px]:tw-grow-0 min-[576px]:tw-basis-auto ${mode === Mode.HIGH_RES ? "tw-w-1/2" : "tw-w-full"} ${mode === Mode.HIGH_RES ? "min-[576px]:tw-w-1/3" : "min-[576px]:tw-w-1/2"} pt-2 pb-2 d-flex gap-3 align-items-center ${
            isMobileScreen ? "justify-content-center" : "justify-content-end"
          }`}
          style={{ maxWidth: "100%" }}
        >
          <Lightbulb
            mode="black"
            className={styles["modeIcon"]!}
            onClick={() => setShowBlackbox(true)}
          />
          <Lightbulb
            mode="light"
            className={styles["modeIcon"]!}
            onClick={() => setShowLightbox(true)}
          />
          <Dropdown drop={"down-centered"} className="d-flex">
            <Dropdown.Toggle className={styles["downloadBtn"]}>
              <FontAwesomeIcon
                className={styles["modeIcon"]}
                icon={faDownload}
                data-tooltip-id={`download-tooltip-${props.token.id}`}
              />
              <Tooltip
                id={`download-tooltip-${props.token.id}`}
                place="bottom"
                style={{
                  backgroundColor: "#1F2937",
                  color: "white",
                  padding: "4px 8px",
                }}
              >
                Download
              </Tooltip>
            </Dropdown.Toggle>
            <Dropdown.Menu>
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
          <FontAwesomeIcon
            className={styles["modeIcon"]}
            onClick={() => {
              const href = getCurrentHref();
              window.open(href, "_blank");
            }}
            icon={faExternalLink}
            data-tooltip-id={`external-tooltip-${props.token.id}`}
          />
          <Tooltip
            id={`external-tooltip-${props.token.id}`}
            place="bottom"
            style={{
              backgroundColor: "#1F2937",
              color: "white",
              padding: "4px 8px",
            }}
          >
            Open in new tab
          </Tooltip>
          <FontAwesomeIcon
            className={styles["modeIcon"]}
            icon={faMaximize}
            onClick={toggleFullScreen}
            data-tooltip-id={`fullscreen-tooltip-${props.token.id}`}
          />
          <Tooltip
            id={`fullscreen-tooltip-${props.token.id}`}
            place="bottom"
            style={{
              backgroundColor: "#1F2937",
              color: "white",
              padding: "4px 8px",
            }}
          >
            Fullscreen
          </Tooltip>
        </div>
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
      return styles["lightBox"];
    }
    if (showBlackbox) {
      return styles["blackBox"];
    }
    return `row ${styles["modeRow"]}`;
  }

  useEffect(() => {
    setShowZoomControls(false);
  }, [mode]);

  return (
    <div className="tw-mx-auto tw-w-full tw-px-3 max-[1100px]:tw-max-w-[950px] min-[1101px]:tw-max-w-[960px] min-[1200px]:tw-max-w-[1050px] min-[1300px]:tw-max-w-[1150px] min-[1400px]:tw-max-w-[1250px] min-[1500px]:tw-max-w-[1280px]">
      <div className="-tw-mx-3 tw-flex tw-flex-wrap">
        <div className="tw-relative tw-w-full tw-shrink-0 tw-grow tw-basis-0 tw-px-3">
          <div className="tw-mx-auto tw-w-full tw-px-3 max-[1100px]:tw-max-w-[950px] min-[1101px]:tw-max-w-[960px] min-[1200px]:tw-max-w-[1050px] min-[1300px]:tw-max-w-[1150px] min-[1400px]:tw-max-w-[1250px] min-[1500px]:tw-max-w-[1280px]">
            <div className="-tw-mx-3 tw-flex tw-flex-wrap">
              <div className="tw-relative tw-w-full tw-shrink-0 tw-grow tw-basis-0 tw-px-3">
                <div className={getBoxStyle()}>
                  <div
                    className={
                      showLightbox || showBlackbox
                        ? styles["lightBoxContent"]
                        : "col pt-3"
                    }
                    ref={tokenImageRef}
                  >
                    <NextGenTokenArtImage
                      token={props.token}
                      mode={mode}
                      is_fullscreen={isFullScreen}
                      zoom_scale={zoomScale}
                      setZoomScale={setZoomScale}
                      onImageLoaded={() => {
                        setShowZoomControls(true);
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="-tw-mx-3 tw-flex tw-flex-wrap">
        <div className="tw-relative tw-w-full tw-shrink-0 tw-grow tw-basis-0 tw-px-3">
          <div
            className={`tw-mx-auto tw-w-full tw-px-3 max-[1100px]:tw-max-w-[950px] min-[1101px]:tw-max-w-[960px] min-[1200px]:tw-max-w-[1050px] min-[1300px]:tw-max-w-[1150px] min-[1400px]:tw-max-w-[1250px] min-[1500px]:tw-max-w-[1280px] ${styles["modeRow"]}`}
          >
            <div className="pt-2 pb-1 -tw-mx-3 tw-flex tw-flex-wrap">
              {printModeIcons()}
            </div>
          </div>
        </div>
      </div>
      {mode === Mode.LIVE && (
        <div className="pt-2 font-color-h font-smaller -tw-mx-3 tw-flex tw-flex-wrap">
          <div className="tw-relative tw-w-full tw-shrink-0 tw-grow tw-basis-0 tw-px-3">
            * Live view generates the image dynamically from scratch in your
            browser. Pebbles have a computationally expensive script and the
            live view may take several minutes to render on your computer or
            phone. &quot;Image view&quot; will download faster.
          </div>
        </div>
      )}
    </div>
  );
}

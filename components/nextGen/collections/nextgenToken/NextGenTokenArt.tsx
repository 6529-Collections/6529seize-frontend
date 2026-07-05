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
import { Tooltip } from "react-tooltip";
import type { NextGenCollection, NextGenToken } from "@/entities/INextgen";
import useIsMobileDevice from "@/hooks/isMobileDevice";
import useIsMobileScreen from "@/hooks/isMobileScreen";
import Lightbulb from "./Lightbulb";
import styles from "./NextGenToken.module.css";
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
  const [isDownloadMenuOpen, setIsDownloadMenuOpen] = useState<boolean>(false);

  const [zoomScale, setZoomScale] = useState(1);
  const [showZoomControls, setShowZoomControls] = useState(false);

  const tokenImageRef = useRef<HTMLDivElement>(null);
  const downloadMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setShowLightbox(false);
        setShowBlackbox(false);
        setIsDownloadMenuOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    const handleClick = (event: MouseEvent) => {
      setShowLightbox(false);
      setShowBlackbox(false);
      if (
        downloadMenuRef.current &&
        event.target instanceof Node &&
        !downloadMenuRef.current.contains(event.target)
      ) {
        setIsDownloadMenuOpen(false);
      }
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

  const iconButtonClassName =
    "tw-rounded-md tw-border-0 tw-bg-transparent !tw-p-0 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-primary-400";

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
          className={`tw-relative tw-flex tw-w-full tw-shrink-0 tw-grow-0 tw-basis-auto tw-items-center tw-gap-4 tw-px-3 tw-py-2 min-[576px]:tw-shrink-0 min-[576px]:tw-grow-0 min-[576px]:tw-basis-auto ${mode === Mode.HIGH_RES ? "min-[576px]:tw-w-1/3" : "min-[576px]:tw-w-1/2"} ${
            isMobileScreen ? "tw-justify-center" : "tw-justify-start"
          }`}
          style={{ maxWidth: "100%" }}
        >
          <button
            type="button"
            className={`tw-select-none ${styles["imageResolutionBtn"]} ${
              mode === Mode.IMAGE ? styles["imageResolutionBtnSelected"] : ""
            }`}
            onClick={() => setMode(Mode.IMAGE)}
          >
            2K
          </button>
          <button
            type="button"
            className={`tw-select-none ${styles["imageResolutionBtn"]} ${
              mode === Mode.HIGH_RES ? styles["imageResolutionBtnSelected"] : ""
            }`}
            onClick={() => setMode(Mode.HIGH_RES)}
          >
            {isMobileDevice ? "8K" : "16K"}
          </button>
          <button
            type="button"
            aria-label="Live mode"
            aria-pressed={mode === Mode.LIVE}
            className={iconButtonClassName}
            onClick={() => setMode(Mode.LIVE)}
            data-tooltip-id={`live-tooltip-${props.token.id}`}
          >
            <FontAwesomeIcon
              className={getModeStyle(Mode.LIVE)}
              icon={faPlayCircle}
              aria-hidden
            />
          </button>
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
            className="tw-relative tw-flex tw-w-1/2 tw-shrink-0 tw-grow-0 tw-basis-auto tw-items-center tw-justify-center tw-gap-1 tw-px-3 tw-py-2 min-[576px]:tw-w-1/3 min-[576px]:tw-shrink-0 min-[576px]:tw-grow-0 min-[576px]:tw-basis-auto"
            style={{ maxWidth: "100%" }}
          >
            {showZoomControls && (
              <>
                <button
                  type="button"
                  aria-label="Zoom out"
                  className={iconButtonClassName}
                  onClick={handleScaleDown}
                >
                  <FontAwesomeIcon
                    className={styles["modeIcon"]}
                    icon={faMinusSquare}
                    aria-hidden
                    style={{
                      color: zoomScale === MIN_ZOOM_SCALE ? "#9a9a9a" : "white",
                    }}
                  />
                </button>
                <span className="tw-select-none">Scale: {zoomScale}</span>
                <button
                  type="button"
                  aria-label="Zoom in"
                  className={iconButtonClassName}
                  onClick={handleScaleUp}
                >
                  <FontAwesomeIcon
                    className={styles["modeIcon"]}
                    icon={faPlusSquare}
                    aria-hidden
                    style={{
                      color: zoomScale === MAX_ZOOM_SCALE ? "#9a9a9a" : "white",
                    }}
                  />
                </button>
                <button
                  type="button"
                  aria-label="Reset zoom"
                  className={iconButtonClassName}
                  onClick={() => setZoomScale(MIN_ZOOM_SCALE)}
                >
                  <FontAwesomeIcon
                    className={styles["modeIcon"]}
                    icon={faRefresh}
                    aria-hidden
                    style={{
                      paddingLeft: "5px",
                      color: zoomScale === MIN_ZOOM_SCALE ? "#9a9a9a" : "white",
                    }}
                  />
                </button>
              </>
            )}
          </div>
        )}
        <div
          className={`tw-relative tw-flex tw-shrink-0 tw-grow-0 tw-basis-auto tw-items-center tw-gap-4 tw-px-3 tw-py-2 min-[576px]:tw-shrink-0 min-[576px]:tw-grow-0 min-[576px]:tw-basis-auto ${mode === Mode.HIGH_RES ? "tw-w-1/2" : "tw-w-full"} ${mode === Mode.HIGH_RES ? "min-[576px]:tw-w-1/3" : "min-[576px]:tw-w-1/2"} ${
            isMobileScreen ? "tw-justify-center" : "tw-justify-end"
          }`}
          style={{ maxWidth: "100%" }}
        >
          <button
            type="button"
            aria-label="Open blackbox"
            className={iconButtonClassName}
            onClick={() => setShowBlackbox(true)}
          >
            <Lightbulb mode="black" className={styles["modeIcon"]!} />
          </button>
          <button
            type="button"
            aria-label="Open lightbox"
            className={iconButtonClassName}
            onClick={() => setShowLightbox(true)}
          >
            <Lightbulb mode="light" className={styles["modeIcon"]!} />
          </button>
          <div className="tw-relative tw-flex" ref={downloadMenuRef}>
            <button
              type="button"
              className={`${styles["downloadBtn"]} tw-rounded-md focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-primary-400`}
              aria-haspopup="true"
              aria-expanded={isDownloadMenuOpen}
              aria-label="Download token image"
              onClick={() => setIsDownloadMenuOpen((isOpen) => !isOpen)}
            >
              <FontAwesomeIcon
                className={styles["modeIcon"]}
                icon={faDownload}
                data-tooltip-id={`download-tooltip-${props.token.id}`}
              />
            </button>
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
            {isDownloadMenuOpen && (
              <ul
                aria-label="Download token image options"
                className="tw-[margin-top:0.5rem] tw-absolute tw-right-0 tw-top-full tw-z-50 tw-min-w-[180px] tw-list-none tw-rounded-md tw-bg-iron-900 tw-p-1 tw-shadow-lg tw-ring-1 tw-ring-white/10"
              >
                {Object.values(Resolution)
                  .filter(
                    (r) =>
                      ![Resolution["0.5K"], Resolution.Thumbnail].includes(r)
                  )
                  .map((resolution) => (
                    <NextGenTokenDownloadDropdownItem
                      resolution={resolution}
                      token={props.token}
                      key={resolution}
                      onSelect={() => setIsDownloadMenuOpen(false)}
                    />
                  ))}
              </ul>
            )}
          </div>
          <button
            type="button"
            aria-label="Open token image in new tab"
            className={iconButtonClassName}
            onClick={() => {
              const href = getCurrentHref();
              window.open(href, "_blank");
            }}
            data-tooltip-id={`external-tooltip-${props.token.id}`}
          >
            <FontAwesomeIcon
              className={styles["modeIcon"]}
              icon={faExternalLink}
              aria-hidden
            />
          </button>
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
          <button
            type="button"
            aria-label="Toggle fullscreen"
            className={iconButtonClassName}
            onClick={toggleFullScreen}
            data-tooltip-id={`fullscreen-tooltip-${props.token.id}`}
          >
            <FontAwesomeIcon
              className={styles["modeIcon"]}
              icon={faMaximize}
              aria-hidden
            />
          </button>
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
        tokenImageRef.current.requestFullscreen().catch((err: unknown) => {
          const error = err as { message?: unknown; name?: unknown };
          alert(
            `Error attempting to enable full-screen mode: ${error.message} (${error.name})`
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
    return `tw-flex tw-flex-wrap ${styles["modeRow"]}`;
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
                        : "tw-relative tw-w-full tw-shrink-0 tw-grow tw-basis-0 tw-px-3 tw-pt-4"
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
            <div className="-tw-mx-3 tw-flex tw-flex-wrap tw-pb-1 tw-pt-2">
              {printModeIcons()}
            </div>
          </div>
        </div>
      </div>
      {mode === Mode.LIVE && (
        <div className="-tw-mx-3 tw-flex tw-flex-wrap tw-pt-2 tw-text-sm tw-text-[#9a9a9a]">
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

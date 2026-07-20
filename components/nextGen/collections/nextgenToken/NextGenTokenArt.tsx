"use client";

import {
  faDownload,
  faExternalLink,
  faMaximize,
  faMinusSquare,
  faPlayCircle,
  faPlusSquare,
  faRefresh,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Tooltip } from "react-tooltip";
import type { NextGenCollection, NextGenToken } from "@/entities/INextgen";
import useIsMobileDevice from "@/hooks/isMobileDevice";
import Lightbulb from "./Lightbulb";
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

  useEffect(() => {
    if (!showLightbox && !showBlackbox) {
      return;
    }

    const previousBodyOverflow = document.body.style.overflow;
    const previousRootOverflow = document.documentElement.style.overflow;
    const previousOverscrollBehavior =
      document.documentElement.style.overscrollBehavior;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    document.documentElement.style.overscrollBehavior = "none";

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousRootOverflow;
      document.documentElement.style.overscrollBehavior =
        previousOverscrollBehavior;
    };
  }, [showLightbox, showBlackbox]);

  const iconButtonClassName =
    "tw-inline-flex tw-h-9 tw-w-9 tw-items-center tw-justify-center tw-rounded-md tw-border-0 tw-bg-transparent tw-text-iron-300 tw-transition hover:tw-bg-white/10 hover:tw-text-white focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 disabled:tw-cursor-not-allowed disabled:tw-opacity-40";

  const resolutionButtonClassName = (isSelected: boolean) =>
    `tw-inline-flex tw-min-h-9 tw-min-w-11 tw-items-center tw-justify-center tw-rounded-md tw-border tw-border-solid tw-px-2.5 tw-py-1.5 tw-text-sm tw-font-semibold tw-transition focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 ${
      isSelected
        ? "tw-border-white tw-bg-white tw-text-iron-950"
        : "tw-border-white/10 tw-bg-iron-900 tw-text-iron-200 hover:tw-bg-iron-800 hover:tw-text-white"
    }`;

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
      <div className="tw-flex tw-w-full tw-flex-wrap tw-items-center tw-justify-between tw-gap-3">
        <div className="tw-flex tw-items-center tw-gap-2">
          <button
            type="button"
            aria-pressed={mode === Mode.IMAGE}
            className={resolutionButtonClassName(mode === Mode.IMAGE)}
            onClick={() => setMode(Mode.IMAGE)}
          >
            2K
          </button>
          <button
            type="button"
            aria-pressed={mode === Mode.HIGH_RES}
            className={resolutionButtonClassName(mode === Mode.HIGH_RES)}
            onClick={() => setMode(Mode.HIGH_RES)}
          >
            {isMobileDevice ? "8K" : "16K"}
          </button>
          <button
            type="button"
            aria-label="Live mode"
            aria-pressed={mode === Mode.LIVE}
            className={`${iconButtonClassName} ${
              mode === Mode.LIVE ? "tw-bg-white tw-text-iron-950" : ""
            }`}
            onClick={() => setMode(Mode.LIVE)}
            data-tooltip-id={`live-tooltip-${props.token.id}`}
          >
            <FontAwesomeIcon
              className="tw-h-5 tw-w-5"
              icon={faPlayCircle}
              aria-hidden
            />
          </button>
          <Tooltip
            id={`live-tooltip-${props.token.id}`}
            place="bottom"
            className="!tw-bg-iron-900 !tw-px-2 !tw-py-1 !tw-text-white"
          >
            Live
          </Tooltip>
        </div>
        {mode === Mode.HIGH_RES && (
          <div className="tw-order-3 tw-flex tw-w-full tw-items-center tw-justify-center tw-gap-2 sm:tw-order-none sm:tw-w-auto">
            {showZoomControls && (
              <>
                <button
                  type="button"
                  aria-label="Zoom out"
                  className={iconButtonClassName}
                  disabled={zoomScale === MIN_ZOOM_SCALE}
                  onClick={handleScaleDown}
                >
                  <FontAwesomeIcon
                    className="tw-h-5 tw-w-5"
                    icon={faMinusSquare}
                    aria-hidden
                  />
                </button>
                <span className="tw-select-none tw-text-sm tw-text-iron-300">
                  Scale: {zoomScale}
                </span>
                <button
                  type="button"
                  aria-label="Zoom in"
                  className={iconButtonClassName}
                  disabled={zoomScale === MAX_ZOOM_SCALE}
                  onClick={handleScaleUp}
                >
                  <FontAwesomeIcon
                    className="tw-h-5 tw-w-5"
                    icon={faPlusSquare}
                    aria-hidden
                  />
                </button>
                <button
                  type="button"
                  aria-label="Reset zoom"
                  className={iconButtonClassName}
                  disabled={zoomScale === MIN_ZOOM_SCALE}
                  onClick={() => setZoomScale(MIN_ZOOM_SCALE)}
                >
                  <FontAwesomeIcon
                    className="tw-h-5 tw-w-5"
                    icon={faRefresh}
                    aria-hidden
                  />
                </button>
              </>
            )}
          </div>
        )}
        <div className="tw-ml-auto tw-flex tw-items-center tw-gap-0.5 tw-rounded-lg tw-bg-black/25 tw-p-1">
          <button
            type="button"
            aria-label="Open blackbox"
            className={iconButtonClassName}
            onClick={() => setShowBlackbox(true)}
          >
            <Lightbulb mode="black" className="tw-h-5 tw-w-5 tw-fill-current" />
          </button>
          <button
            type="button"
            aria-label="Open lightbox"
            className={iconButtonClassName}
            onClick={() => setShowLightbox(true)}
          >
            <Lightbulb mode="light" className="tw-h-5 tw-w-5 tw-fill-current" />
          </button>
          <div className="tw-relative tw-flex" ref={downloadMenuRef}>
            <button
              type="button"
              className={iconButtonClassName}
              aria-haspopup="true"
              aria-expanded={isDownloadMenuOpen}
              aria-label="Download token image"
              onClick={() => setIsDownloadMenuOpen((isOpen) => !isOpen)}
            >
              <FontAwesomeIcon
                className="tw-h-5 tw-w-5"
                icon={faDownload}
                data-tooltip-id={`download-tooltip-${props.token.id}`}
              />
            </button>
            <Tooltip
              id={`download-tooltip-${props.token.id}`}
              place="bottom"
              className="!tw-bg-iron-900 !tw-px-2 !tw-py-1 !tw-text-white"
            >
              Download
            </Tooltip>
            {isDownloadMenuOpen && (
              <ul
                aria-label="Download token image options"
                className="tw-absolute tw-right-0 tw-top-full tw-z-50 tw-mt-2 tw-min-w-[180px] tw-list-none tw-rounded-lg tw-bg-iron-900 tw-p-1 tw-shadow-lg tw-ring-1 tw-ring-white/10"
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
              className="tw-h-5 tw-w-5"
              icon={faExternalLink}
              aria-hidden
            />
          </button>
          <Tooltip
            id={`external-tooltip-${props.token.id}`}
            place="bottom"
            className="!tw-bg-iron-900 !tw-px-2 !tw-py-1 !tw-text-white"
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
              className="tw-h-5 tw-w-5"
              icon={faMaximize}
              aria-hidden
            />
          </button>
          <Tooltip
            id={`fullscreen-tooltip-${props.token.id}`}
            place="bottom"
            className="!tw-bg-iron-900 !tw-px-2 !tw-py-1 !tw-text-white"
          >
            Fullscreen
          </Tooltip>
        </div>
      </div>
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

  useEffect(() => {
    setShowZoomControls(false);
  }, [mode]);

  const isBoxOpen = showLightbox || showBlackbox;
  const viewerName = showLightbox ? "lightbox" : "blackbox";
  const viewerBackgroundClassName = showLightbox
    ? "tw-bg-iron-50"
    : "tw-bg-black";
  const ArtworkPanel = isBoxOpen ? "dialog" : "div";
  const artworkPanelClassName = isBoxOpen
    ? `tailwind-scope tw-fixed tw-inset-0 tw-z-[2147483647] tw-m-0 tw-flex tw-h-[100dvh] tw-max-h-none tw-w-screen tw-max-w-none tw-items-center tw-justify-center tw-overflow-hidden tw-border-0 tw-p-4 ${viewerBackgroundClassName}`
    : "tw-rounded-xl tw-border tw-border-solid tw-border-white/10 tw-bg-iron-900/80";
  const artworkPanelDialogProps = isBoxOpen
    ? {
        open: true,
        "aria-modal": true as const,
        "aria-label": `${props.token.name} ${viewerName}`,
      }
    : {};

  const artworkPanel = (
    <ArtworkPanel
      {...artworkPanelDialogProps}
      className={artworkPanelClassName}
      onMouseDown={(event) => {
        if (!isBoxOpen) {
          return;
        }
        const target = event.target;
        if (
          target instanceof Element &&
          !target.closest("img, iframe, button")
        ) {
          setShowLightbox(false);
          setShowBlackbox(false);
        }
      }}
    >
      {isBoxOpen && (
        <button
          autoFocus
          type="button"
          aria-label={`Close ${showLightbox ? "lightbox" : "blackbox"}`}
          onClick={() => {
            setShowLightbox(false);
            setShowBlackbox(false);
          }}
          className={`tw-absolute tw-right-4 tw-top-4 tw-z-10 tw-inline-flex tw-h-11 tw-w-11 tw-items-center tw-justify-center tw-rounded-full tw-border tw-border-solid focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 ${
            showLightbox
              ? "tw-border-black/10 tw-bg-black/10 tw-text-black hover:tw-bg-black/20"
              : "tw-border-white/15 tw-bg-white/10 tw-text-white hover:tw-bg-white/20"
          }`}
        >
          <FontAwesomeIcon
            icon={faXmark}
            className="tw-h-5 tw-w-5"
            aria-hidden="true"
          />
        </button>
      )}
      <div
        className={
          isBoxOpen
            ? "tw-flex tw-h-full tw-w-full tw-items-center tw-justify-center tw-overflow-hidden"
            : "tw-relative tw-w-full tw-overflow-hidden tw-rounded-t-xl tw-bg-black tw-p-3 sm:tw-p-5"
        }
        ref={tokenImageRef}
      >
        <NextGenTokenArtImage
          token={props.token}
          mode={mode}
          is_fullscreen={isFullScreen || isBoxOpen}
          zoom_scale={zoomScale}
          setZoomScale={setZoomScale}
          onImageLoaded={() => {
            setShowZoomControls(true);
          }}
        />
      </div>
      {!isBoxOpen && (
        <div className="tw-border-0 tw-border-t tw-border-solid tw-border-white/10 tw-p-3 sm:tw-px-4">
          {printModeIcons()}
        </div>
      )}
    </ArtworkPanel>
  );

  return (
    <div className="tw-w-full">
      {isBoxOpen ? createPortal(artworkPanel, document.body) : artworkPanel}

      {mode === Mode.LIVE && (
        <p className="tw-mb-0 tw-mt-3 tw-text-sm tw-leading-6 tw-text-iron-400">
          * Live view generates the image dynamically from scratch in your
          browser. Pebbles have a computationally expensive script and the live
          view may take several minutes to render on your computer or phone.
          &quot;Image view&quot; will download faster.
        </p>
      )}
    </div>
  );
}

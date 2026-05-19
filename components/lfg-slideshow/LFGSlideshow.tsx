"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import styles from "./LFGSlideshow.module.scss";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faExpand, faXmarkCircle } from "@fortawesome/free-solid-svg-icons";
import { commonApiFetch } from "@/services/api/common-api";
import type { ApiNftMedia } from "@/generated/models/ApiNftMedia";
import { enterArtFullScreen, fullScreenSupported } from "@/helpers/Helpers";
import { Button } from "react-bootstrap";
import clsx from "clsx";
import { createPortal } from "react-dom";

const DEFAULT_TIMEOUT = 10000;
const SLIDESHOW_ID = "lfg-slideshow";
const EMPTY_CAPTIONS_SRC = "data:text/vtt,WEBVTT%0A%0A";

type LFGMedia = ApiNftMedia & {
  image_compact?: string | null;
  animation_compact?: string | null;
};

const getMediaField = (value: unknown) =>
  typeof value === "string" ? value : "";

const getMediaIdentityField = (value: unknown) =>
  typeof value === "string" || typeof value === "number" ? `${value}` : "";

const isVideo = (url: string | null | undefined) =>
  getMediaField(url).toLowerCase().endsWith(".mp4");

const uniqueSources = (...sources: unknown[]) =>
  sources
    .map(getMediaField)
    .filter((source) => source.length > 0)
    .filter(
      (source, index, allSources) => allSources.indexOf(source) === index
    );

const getImageCandidates = (mediaItem: LFGMedia) =>
  uniqueSources(mediaItem.image_compact, mediaItem.image);

const getVideoCandidates = (mediaItem: LFGMedia) =>
  uniqueSources(mediaItem.animation_compact, mediaItem.animation).filter(
    isVideo
  );

const getCurrentSource = (
  candidates: string[],
  sourceIndexes: Record<string, number>,
  mediaKey: string
) => candidates[sourceIndexes[mediaKey] ?? 0] ?? "";

const preloadMedia = (mediaItem: LFGMedia) => {
  const animation = getVideoCandidates(mediaItem)[0] ?? "";
  const image = getImageCandidates(mediaItem)[0] ?? "";

  if (animation.length > 0) {
    const video = document.createElement("video");
    video.src = animation;
    video.load();
  } else if (image.length > 0) {
    const img = new Image();
    img.src = image;
  }
};

const preloadNext = (mediaItems: LFGMedia[], index: number) => {
  const nextIndex = (index + 1) % mediaItems.length;
  const nextMedia = mediaItems[nextIndex];

  if (!nextMedia) {
    return;
  }

  preloadMedia(nextMedia);
};

const getMediaKey = (mediaItem: LFGMedia, index: number) => {
  const id = getMediaIdentityField(mediaItem.id);
  const animation = getMediaField(mediaItem.animation);
  const image = getMediaField(mediaItem.image);

  if (id.length > 0) {
    return id;
  }

  if (animation.length > 0) {
    return animation;
  }

  if (image.length > 0) {
    return image;
  }

  return `media-${index}`;
};

const shouldShowVideo = (
  mediaItem: LFGMedia,
  index: number,
  videoLoadErrors: Record<string, boolean>,
  videoSourceIndexes: Record<string, number>
) =>
  getCurrentSource(
    getVideoCandidates(mediaItem),
    videoSourceIndexes,
    getMediaKey(mediaItem, index)
  ).length > 0 && videoLoadErrors[getMediaKey(mediaItem, index)] !== true;

const LFGSlideshow: React.FC<{
  isOpen: boolean;
  contract: string;
  setIsOpen: (isOpen: boolean) => void;
}> = ({ isOpen, contract, setIsOpen }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [videoLoadErrors, setVideoLoadErrors] = useState<
    Record<string, boolean>
  >({});
  const [imageSourceIndexes, setImageSourceIndexes] = useState<
    Record<string, number>
  >({});
  const [videoSourceIndexes, setVideoSourceIndexes] = useState<
    Record<string, number>
  >({});
  const slideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const [media, setMedia] = useState<LFGMedia[]>([]);

  const nextSlide = useCallback(() => {
    if (slideTimer.current !== null) {
      clearTimeout(slideTimer.current);
      slideTimer.current = null;
    }
    setCurrentIndex((prevIndex) =>
      media.length > 0 ? (prevIndex + 1) % media.length : prevIndex
    );
  }, [media.length]);

  const resetSession = useCallback(() => {
    if (slideTimer.current !== null) {
      clearTimeout(slideTimer.current);
      slideTimer.current = null;
    }
    setCurrentIndex(0);
    setIsMuted(false);
    setVideoLoadErrors({});
    setImageSourceIndexes({});
    setVideoSourceIndexes({});
  }, []);

  const closeSlideshow = useCallback(() => {
    resetSession();
    setIsOpen(false);
  }, [resetSession, setIsOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeSlideshow();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [closeSlideshow, isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const previousBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousBodyOverflow;
    };
  }, [isOpen]);

  useEffect(() => {
    let canceled = false;

    void commonApiFetch<LFGMedia[]>({
      endpoint: `nfts/${contract}/media`,
    })
      .then((loadedMedia) => {
        if (canceled) {
          return;
        }

        setMedia(loadedMedia);
        setCurrentIndex(0);
        setVideoLoadErrors({});
        setImageSourceIndexes({});
        setVideoSourceIndexes({});
        const firstMedia = loadedMedia[0];
        if (firstMedia) {
          preloadMedia(firstMedia);
        }
      })
      .catch(() => {
        if (!canceled) {
          setMedia([]);
          setCurrentIndex(0);
        }
      });

    return () => {
      canceled = true;
    };
  }, [contract]);

  useEffect(() => {
    if (!isOpen || media.length === 0) return;

    const currentMedia = media[currentIndex];
    if (!currentMedia) return;

    preloadNext(media, currentIndex);

    if (
      shouldShowVideo(
        currentMedia,
        currentIndex,
        videoLoadErrors,
        videoSourceIndexes
      )
    ) {
      const videoElement = videoRef.current;
      if (videoElement !== null) {
        const handleEnded = () => {
          nextSlide();
        };

        const handleVolumeChange = () => {
          setIsMuted(videoElement.muted);
        };

        videoElement.addEventListener("ended", handleEnded);
        videoElement.addEventListener("volumechange", handleVolumeChange);
        return () => {
          videoElement.removeEventListener("ended", handleEnded);
          videoElement.removeEventListener("volumechange", handleVolumeChange);
        };
      }
    } else {
      slideTimer.current = setTimeout(nextSlide, DEFAULT_TIMEOUT);
    }

    return () => {
      if (slideTimer.current !== null) {
        clearTimeout(slideTimer.current);
        slideTimer.current = null;
      }
    };
  }, [
    currentIndex,
    isOpen,
    media,
    nextSlide,
    videoLoadErrors,
    videoSourceIndexes,
  ]);

  const currentMedia = media[currentIndex];

  if (!isOpen || !currentMedia) {
    return <></>;
  }

  const currentMediaKey = getMediaKey(currentMedia, currentIndex);
  const showVideo = shouldShowVideo(
    currentMedia,
    currentIndex,
    videoLoadErrors,
    videoSourceIndexes
  );
  const videoCandidates = getVideoCandidates(currentMedia);
  const imageCandidates = getImageCandidates(currentMedia);
  const currentAnimation = getCurrentSource(
    videoCandidates,
    videoSourceIndexes,
    currentMediaKey
  );
  const currentImage = getCurrentSource(
    imageCandidates,
    imageSourceIndexes,
    currentMediaKey
  );

  const handleVideoUnavailable = () => {
    const nextVideoIndex = (videoSourceIndexes[currentMediaKey] ?? 0) + 1;
    if (nextVideoIndex < videoCandidates.length) {
      setVideoSourceIndexes((indexes) => ({
        ...indexes,
        [currentMediaKey]: nextVideoIndex,
      }));
      return;
    }

    setVideoLoadErrors((errors) => ({
      ...errors,
      [currentMediaKey]: true,
    }));
  };

  const handleImageUnavailable = () => {
    const nextImageIndex = (imageSourceIndexes[currentMediaKey] ?? 0) + 1;
    if (nextImageIndex < imageCandidates.length) {
      setImageSourceIndexes((indexes) => ({
        ...indexes,
        [currentMediaKey]: nextImageIndex,
      }));
      return;
    }

    if (media.length > 1) {
      nextSlide();
    }
  };

  const slideshow = (
    <div className={styles["slideshowContainer"]}>
      <span className={styles["slideButtons"]}>
        {fullScreenSupported() && (
          <FontAwesomeIcon
            icon={faExpand}
            className={styles["slideButton"]}
            onClick={() => enterArtFullScreen(SLIDESHOW_ID)}
          />
        )}
        <FontAwesomeIcon
          icon={faXmarkCircle}
          className={styles["slideButton"]}
          onClick={closeSlideshow}
        />
      </span>
      <div className={styles["slide"]} id={SLIDESHOW_ID}>
        {showVideo ? (
          <video
            ref={videoRef}
            autoPlay
            controls
            playsInline
            muted={isMuted}
            src={currentAnimation}
            poster={currentImage.length > 0 ? currentImage : undefined}
            onError={handleVideoUnavailable}
            onLoadedMetadata={({ currentTarget }) => {
              if (
                currentTarget.videoWidth === 0 ||
                currentTarget.videoHeight === 0
              ) {
                handleVideoUnavailable();
              }
            }}
          >
            <track
              kind="captions"
              src={EMPTY_CAPTIONS_SRC}
              srcLang="en"
              label="No captions available"
            />
            Your browser does not support the video tag.
          </video>
        ) : (
          currentImage.length > 0 && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={currentImage}
              alt={`LFG Slide ${currentIndex + 1}`}
              onError={handleImageUnavailable}
            />
          )
        )}
      </div>
    </div>
  );

  if (typeof document === "undefined") {
    return <></>;
  }

  return createPortal(slideshow, document.body);
};

export const LFGButton: React.FC<{
  contract: string;
}> = ({ contract }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <LFGSlideshow contract={contract} isOpen={isOpen} setIsOpen={setIsOpen} />
      <Button
        onClick={() => setIsOpen(true)}
        className={clsx(styles["lfgButton"], "no-wrap")}
      >
        LFG: Start the Show!
      </Button>
    </>
  );
};

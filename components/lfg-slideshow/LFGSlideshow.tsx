"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import styles from "./LFGSlideshow.module.scss";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faExpand, faXmarkCircle } from "@fortawesome/free-solid-svg-icons";
import { commonApiFetch } from "@/services/api/common-api";
import type { ApiNftMedia } from "@/generated/models/ApiNftMedia";
import { enterArtFullScreen, fullScreenSupported } from "@/helpers/Helpers";
import { createPortal } from "react-dom";
import SeizeVideoPlayer from "@/components/drops/view/item/content/media/SeizeVideoPlayer";

const DEFAULT_TIMEOUT = 10000;
const SLIDESHOW_ID = "lfg-slideshow";

const getMediaField = (value: unknown) =>
  typeof value === "string" ? value : "";

const isVideo = (url: string | null | undefined) =>
  getMediaField(url).toLowerCase().endsWith(".mp4");

const preloadMedia = (mediaItem: ApiNftMedia) => {
  const animation = getMediaField(mediaItem.animation);
  const image = getMediaField(mediaItem.image);

  if (isVideo(animation)) {
    const video = document.createElement("video");
    video.src = animation;
    video.load();
  } else if (image.length > 0) {
    const img = new Image();
    img.src = image;
  }
};

const preloadNext = (mediaItems: ApiNftMedia[], index: number) => {
  const nextIndex = (index + 1) % mediaItems.length;
  const nextMedia = mediaItems[nextIndex];

  if (!nextMedia) {
    return;
  }

  preloadMedia(nextMedia);
};

const LFGSlideshow: React.FC<{
  isOpen: boolean;
  contract: string;
  setIsOpen: (isOpen: boolean) => void;
}> = ({ isOpen, contract, setIsOpen }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const slideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const [media, setMedia] = useState<ApiNftMedia[]>([]);

  const clearSlideTimer = useCallback(() => {
    if (slideTimer.current !== null) {
      clearTimeout(slideTimer.current);
      slideTimer.current = null;
    }
  }, []);

  const nextSlide = useCallback(() => {
    clearSlideTimer();
    setCurrentIndex((prevIndex) =>
      media.length > 0 ? (prevIndex + 1) % media.length : prevIndex
    );
  }, [clearSlideTimer, media.length]);

  const closeSlideshow = useCallback(() => {
    clearSlideTimer();
    setIsOpen(false);
  }, [clearSlideTimer, setIsOpen]);

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

    void commonApiFetch<ApiNftMedia[]>({
      endpoint: `nfts/${contract}/media`,
    })
      .then((loadedMedia) => {
        if (canceled) {
          return;
        }

        setMedia(loadedMedia);
        setCurrentIndex(0);
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

    if (isVideo(currentMedia.animation)) {
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
      clearSlideTimer();
    };
  }, [clearSlideTimer, currentIndex, isOpen, media, nextSlide]);

  const currentMedia = media[currentIndex];

  if (!isOpen || !currentMedia) {
    return <></>;
  }

  const currentAnimation = getMediaField(currentMedia.animation);
  const currentImage = getMediaField(currentMedia.image);

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
        {isVideo(currentAnimation) ? (
          <SeizeVideoPlayer
            videoRef={videoRef}
            template="slideshow"
            autoPlay
            muted={isMuted}
            src={currentAnimation}
            poster={currentImage.length > 0 ? currentImage : undefined}
            loop={false}
            layout="fill"
          />
        ) : (
          <img src={currentImage} alt={`LFG Slide ${currentIndex + 1}`} />
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
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="hover:tw-text-primary-200 tw-inline-flex tw-items-center tw-justify-center tw-whitespace-nowrap tw-rounded-lg tw-border tw-border-solid tw-border-primary-500/60 tw-bg-primary-500/10 tw-px-3.5 tw-py-2 tw-text-xs tw-font-semibold tw-leading-5 tw-text-primary-300 tw-shadow-sm tw-transition tw-duration-300 tw-ease-out hover:tw-border-primary-400 hover:tw-bg-primary-500/15 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-500"
      >
        LFG: Start the Show!
      </button>
    </>
  );
};

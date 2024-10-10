import React, { useState, useEffect } from "react";
import styles from "./LFGSlideshow.module.scss";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faForward, faXmarkCircle } from "@fortawesome/free-solid-svg-icons";
import { commonApiFetch } from "../../services/api/common-api";
import { NftMedia } from "../../generated/models/NftMedia";

const DEFAULT_TIMEOUT = 5000;
const VIDEO_ID = "lfg-slideshow-video";

const LFGSlideshow: React.FC<{
  isOpen: boolean;
  contract: string;
  setIsOpen: (isOpen: boolean) => void;
}> = ({ isOpen, contract, setIsOpen }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [bodyOverflow, setBodyOverflow] = useState<string>();

  const [media, setMedia] = useState<NftMedia[]>([]);

  let slideTimer: NodeJS.Timeout | null = null;

  const isVideo = (url: string) => {
    return url?.toLowerCase().endsWith(".mp4");
  };

  const preloadNext = (index: number) => {
    const nextIndex = (index + 1) % media.length;
    const nextMedia = media[nextIndex];

    if (!nextMedia) {
      return;
    }

    preloadMedia(nextMedia);
  };

  const preloadMedia = (media: NftMedia) => {
    if (isVideo(media.animation)) {
      const video = document.createElement("video");
      video.src = media.animation;
      video.load();
    } else {
      const img = new Image();
      img.src = media.image;
    }
  };

  const toggleSlideshow = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setCurrentIndex(0);
    }
  };

  const nextSlide = () => {
    if (slideTimer) {
      clearTimeout(slideTimer);
    }
    setCurrentIndex((prevIndex) => (prevIndex + 1) % media.length);
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  useEffect(() => {
    if (isOpen) {
      setBodyOverflow(document.body.style.overflow);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = bodyOverflow ?? "unset";
    }

    return () => {
      document.body.style.overflow = bodyOverflow ?? "unset";
    };
  }, [isOpen]);

  useEffect(() => {
    commonApiFetch<NftMedia[]>({
      endpoint: `nfts/${contract}/media`,
    }).then((media) => {
      setMedia(media);
      setCurrentIndex(0);
      preloadMedia(media[0]);
    });
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const currentMedia = media[currentIndex];
    preloadNext(currentIndex);

    if (isVideo(currentMedia.animation)) {
      const videoElement = document.getElementById(
        VIDEO_ID
      ) as HTMLVideoElement;
      if (videoElement) {
        const handleEnded = () => {
          nextSlide();
        };

        videoElement.addEventListener("ended", handleEnded);
        return () => {
          videoElement.removeEventListener("ended", handleEnded);
        };
      }
    } else {
      slideTimer = setTimeout(nextSlide, DEFAULT_TIMEOUT);
    }

    return () => {
      if (slideTimer) {
        clearTimeout(slideTimer);
      }
    };
  }, [isOpen, currentIndex, media]);

  if (!isOpen || media.length === 0) {
    return <></>;
  }

  return (
    <div className={styles.slideshowContainer}>
      <FontAwesomeIcon
        icon={faForward}
        className={`${styles.slideButton} ${styles.next}`}
        onClick={nextSlide}
      />
      <FontAwesomeIcon
        icon={faXmarkCircle}
        className={`${styles.slideButton} ${styles.close}`}
        onClick={toggleSlideshow}
      />
      <div className={styles.slide}>
        {isVideo(media[currentIndex].animation) ? (
          <video
            id={VIDEO_ID}
            autoPlay
            muted
            controls
            src={media[currentIndex].animation}
            poster={media[currentIndex].image}>
            Your browser does not support the video tag.
          </video>
        ) : (
          <img
            src={media[currentIndex].image}
            alt={`LFG Slide ${currentIndex + 1}`}
          />
        )}
      </div>
    </div>
  );
};

export default LFGSlideshow;

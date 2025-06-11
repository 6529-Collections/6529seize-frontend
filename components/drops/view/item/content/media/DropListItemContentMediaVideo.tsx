import React, { useEffect } from "react";
import { useInView } from "../../../../../../hooks/useInView";
import useDeviceInfo from "../../../../../../hooks/useDeviceInfo";
import { useOptimizedVideo } from "../../../../../../hooks/useOptimizedVideo";
import { useHlsPlayer } from "../../../../../../hooks/useHlsPlayer";
import Download from "../../../../../download/Download";

interface Props {
  readonly src: string;
}

function DropListItemContentMediaVideo({ src }: Props) {
  const [wrapperRef, inView] = useInView<HTMLDivElement>({ threshold: 0.1 });
  const { isApp } = useDeviceInfo();

  // 1) Pick up the best URL (HLS or MP4)
  const { playableUrl, isHls, isOptimized } = useOptimizedVideo(src, {
    pollInterval: 10000,
    maxRetries: 8,
    preferHls: true,
    exponentialBackoff: false,
  });

  // 2) Setup HLS (or native) once and get back the videoRef + loading state
  const { videoRef, isLoading } = useHlsPlayer({
    src: playableUrl,
    isHls,
    fallbackSrc: src,
    autoPlay: inView && !isApp,
  });

  // 3) Play/pause & mute based on scroll visibility
  useEffect(() => {
    const videoEl = videoRef.current;
    if (!videoEl || isLoading) return;

    if (inView) {
      // ensure muted autoplay works
      videoEl.muted = true;
      if (!isApp) videoEl.play().catch(() => {});
    } else {
      videoEl.pause();
      videoEl.muted = true;
    }
  }, [inView, isApp, isLoading, videoRef]);

  // 4) Inline attributes for iOS / legacy WebKit
  useEffect(() => {
    const videoEl = videoRef.current;
    if (!videoEl) return;
    videoEl.setAttribute("webkit-playsinline", "true");
    videoEl.setAttribute("x5-playsinline", "true");
  }, [videoRef]);

  // Extract filename from URL
  const getFilenameFromUrl = (url: string) => {
    if (url.startsWith("blob:")) {
      return { name: "video", extension: "video" }; // Generic for blobs
    }
    try {
      const pathname = new URL(url).pathname;
      const filename = pathname.split("/").pop() ?? "video";
      const lastDot = filename.lastIndexOf(".");
      if (lastDot > 0) {
        return {
          name: filename.substring(0, lastDot),
          extension: filename.substring(lastDot + 1),
        };
      }
      return { name: filename, extension: "" }; // No extension found
    } catch {
      return { name: "video", extension: "" };
    }
  };

  const { name: fileName, extension: fileExtension } = getFilenameFromUrl(src);

  return (
    <div
      ref={wrapperRef}
      className="tw-w-full tw-h-full tw-flex tw-items-center tw-justify-center tw-relative tw-group"
    >
      <video
        ref={videoRef}
        playsInline
        controls
        autoPlay={false} /* we control play via the hook+effect */
        muted
        loop
        className={`
          tw-w-full tw-h-full tw-rounded-xl tw-object-contain
        `}
      >
        Your browser does not support the video tag.
      </video>
      {(isOptimized || src.startsWith("blob:")) && (
        <Download
          href={src}
          name={fileName}
          extension={fileExtension}
          showProgress={false}
          className="tw-absolute tw-top-0 tw-right-8 tw-z-10 tw-opacity-0 tw-transition-opacity tw-duration-300 desktop-hover:group-hover:tw-opacity-100"
        />
      )}
    </div>
  );
}

export default React.memo(DropListItemContentMediaVideo);

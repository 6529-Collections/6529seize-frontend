import React, { useRef, useCallback, useEffect, useState } from "react";
import useCapacitor from "../../../../../../hooks/useCapacitor";
import { useInView } from "../../../../../../hooks/useInView";
import { useOptimizedVideo } from "../../../../../../hooks/useOptimizedVideo";

interface Props {
  readonly src: string;
}

function DropListItemContentMediaVideo({ src }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [wrapperRef, inView] = useInView<HTMLDivElement>();
  const capacitor = useCapacitor();
  const [hlsInstance, setHlsInstance] = useState<any>(null);

  // Get the optimized video URL from the hook
  const { playableUrl, isHls } = useOptimizedVideo(src, {
    pollInterval: 10000,
    maxRetries: 15,
    preferHls: true
  });

  const handleVideoClick = useCallback(
    (event: React.MouseEvent<HTMLVideoElement>) => {
      if (videoRef.current) {
        event.stopPropagation();
        event.preventDefault();
        if (videoRef.current.muted) {
          videoRef.current.muted = false;
          videoRef.current.play().catch(err => console.debug('Play error:', err));
        } else if (!videoRef.current.paused) {
          videoRef.current.pause();
        } else {
          videoRef.current.play().catch(err => console.debug('Play error:', err));
        }
      }
    },
    []
  );

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) {
            video.pause();
            video.muted = true;
          }
        });
      },
      { threshold: 0.5 }
    );

    observer.observe(video);

    return () => {
      observer.unobserve(video);
    };
  }, []);

  // Handle HLS with hls.js for browsers that don't support it natively
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Cleanup previous HLS instance
    if (hlsInstance) {
      hlsInstance.destroy();
      setHlsInstance(null);
    }

    const setupVideo = async () => {
      if (isHls) {
        // Check if browser supports HLS natively (Safari/iOS)
        if (video.canPlayType('application/vnd.apple.mpegurl')) {
          video.src = playableUrl;
          if (inView && !capacitor.isCapacitor) {
            video.play().catch(err => console.debug('Auto-play error:', err));
          }
        } else {
          // Use hls.js for Chrome/Firefox
          try {
            const Hls = (await import('hls.js')).default;
            
            if (Hls.isSupported()) {
              const hls = new Hls({
                enableWorker: true,
                lowLatencyMode: false,
                backBufferLength: 90
              });
              
              hls.loadSource(playableUrl);
              hls.attachMedia(video);
              
              hls.on(Hls.Events.MANIFEST_PARSED, () => {
                if (inView && !capacitor.isCapacitor) {
                  video.play().catch(err => console.debug('HLS auto-play error:', err));
                }
              });
              
              hls.on(Hls.Events.ERROR, (event, data) => {
                if (data.fatal) {
                  switch (data.type) {
                    case Hls.ErrorTypes.NETWORK_ERROR:
                      console.error('HLS network error', data);
                      hls.startLoad();
                      break;
                    case Hls.ErrorTypes.MEDIA_ERROR:
                      console.error('HLS media error', data);
                      hls.recoverMediaError();
                      break;
                    default:
                      console.error('HLS fatal error', data);
                      // Fallback to original source
                      video.src = src;
                      break;
                  }
                }
              });
              
              setHlsInstance(hls);
            } else {
              // HLS.js not supported, fallback to original
              console.warn('HLS.js is not supported in this browser');
              video.src = src;
            }
          } catch (error) {
            console.error('Failed to load HLS.js:', error);
            video.src = src;
          }
        }
      } else {
        // Regular MP4 video
        video.src = playableUrl;
        if (inView && !capacitor.isCapacitor) {
          video.play().catch(err => console.debug('Auto-play error:', err));
        }
      }
    };

    setupVideo();

    return () => {
      if (hlsInstance) {
        hlsInstance.destroy();
        setHlsInstance(null);
      }
    };
  }, [playableUrl, isHls, inView, capacitor.isCapacitor, src]);

  return (
    <div ref={wrapperRef} className="tw-w-full tw-h-full tw-flex tw-items-center tw-justify-center">
      {inView && (
        <video
          ref={videoRef}
          playsInline
          controls
          autoPlay={!capacitor.isCapacitor}
          muted
          loop
          className="tw-w-full tw-h-full tw-rounded-xl tw-object-contain"
          onClick={handleVideoClick}
        >
          Your browser does not support the video tag.
        </video>
      )}
    </div>
  );
}

export default React.memo(DropListItemContentMediaVideo);

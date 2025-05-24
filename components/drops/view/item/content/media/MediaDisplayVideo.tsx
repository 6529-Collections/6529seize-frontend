import React, { useRef, useCallback, useEffect, useState } from "react";
import { useInView } from "../../../../../../hooks/useInView";
import { useOptimizedVideo } from "../../../../../../hooks/useOptimizedVideo";

interface Props {
  readonly src: string;
  readonly showControls?: boolean;
  readonly disableClickHandler?: boolean;
  readonly showDebug?: boolean;
}

function MediaDisplayVideo({
  src,
  showControls = false,
  disableClickHandler = false,
  showDebug = false,
}: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [wrapperRef, inView] = useInView<HTMLDivElement>({ threshold: 0.1 });
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasInteraction, setHasInteraction] = useState(false);
  const [hlsInstance, setHlsInstance] = useState<any>(null);
  const [isHlsSupported, setIsHlsSupported] = useState(false);
  
  const { playableUrl, isOptimized, isHls } = useOptimizedVideo(src, {
    pollInterval: 10000,
    maxRetries: 20,
    preferHls: true
  });

  useEffect(() => {
    const checkHlsSupport = () => {
      const video = document.createElement('video');
      return video.canPlayType('application/vnd.apple.mpegurl') !== '';
    };
    
    setIsHlsSupported(checkHlsSupport());
  }, []);

  useEffect(() => {
    const loadHlsJs = async () => {
      if (!videoRef.current || !isHls) {
        if (videoRef.current && !isHls) {
          videoRef.current.src = playableUrl;
        }
        return;
      }

      if (isHlsSupported) {
        videoRef.current.src = playableUrl;
        return;
      }

      try {
        const Hls = (await import('hls.js')).default;
        
        if (Hls.isSupported()) {
          const hls = new Hls({
            enableWorker: true,
            lowLatencyMode: false,
            backBufferLength: 90
          });
          
          hls.loadSource(playableUrl);
          hls.attachMedia(videoRef.current);
          
          hls.on(Hls.Events.MANIFEST_PARSED, () => {
            if (inView && videoRef.current) {
              attemptPlay();
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
                  break;
              }
            }
          });
          
          setHlsInstance(hls);
        } else {
          videoRef.current.src = playableUrl;
        }
      } catch (error) {
        console.error('Failed to load HLS.js:', error);
        if (videoRef.current) {
          videoRef.current.src = playableUrl;
        }
      }
    };

    loadHlsJs();

    return () => {
      if (hlsInstance) {
        hlsInstance.destroy();
        setHlsInstance(null);
      }
    };
  }, [playableUrl, isHls, isHlsSupported, inView]);

  const attemptPlay = useCallback(async () => {
    const video = videoRef.current;
    if (!video) return;
    
    try {
      await video.play();
      setIsPlaying(true);
    } catch (error) {
      console.error("Playback failed:", error);
      setIsPlaying(false);
    }
  }, []);
  
  const handleVideoClick = useCallback(
    (event: React.MouseEvent<HTMLVideoElement>) => {
      if (!videoRef.current) return;
      
      event.stopPropagation();
      event.preventDefault();
      setHasInteraction(true);
      
      const video = videoRef.current;
      
      if (video.paused) {
        if (video.muted) {
          if (hasInteraction) {
            video.muted = false;
          }
        }
        attemptPlay();
      } else {
        video.pause();
        setIsPlaying(false);
      }
    },
    [hasInteraction, attemptPlay]
  );

  useEffect(() => {
    if (inView) {
      if (videoRef.current && !isPlaying && !isHls) {
        attemptPlay();
      }
    } else if (videoRef.current) {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  }, [inView, attemptPlay, isPlaying, isHls]);
  
  useEffect(() => {
    const video = videoRef.current;
    return () => {
      if (video) {
        video.pause();
        video.src = "";
        video.load();
      }
    };
  }, []);

  const handleError = useCallback(() => {
    console.error("Video playback error for source:", playableUrl);
    setIsPlaying(false);
  }, [playableUrl]);

  return (
    <div ref={wrapperRef} className="tw-w-full tw-h-full tw-relative">
      {showDebug && (
        <div className="tw-absolute tw-top-2 tw-left-2 tw-z-10 tw-bg-black/80 tw-text-white tw-text-xs tw-p-2 tw-rounded tw-max-w-xs">
          <div>Status: {isOptimized ? 'Optimized' : 'Original'}</div>
          {isOptimized && <div>Type: {isHls ? 'HLS' : 'MP4'}</div>}
        </div>
      )}
      <video
        ref={videoRef}
        playsInline
        webkit-playsinline="true"
        x5-playsinline="true"
        controls={showControls}
        autoPlay={inView && !isHls}
        muted
        loop
        preload="auto"
        className="tw-w-full tw-rounded-xl tw-overflow-hidden tw-max-h-full tw-object-contain"
        onClick={disableClickHandler ? undefined : handleVideoClick}
        onError={handleError}
      >
        {!isHls && (
          <source src={playableUrl} type="video/mp4" />
        )}
        Your browser does not support the video tag.
      </video>
    </div>
  );
}

export default MediaDisplayVideo;

import React, { useRef, useCallback, useEffect, useState } from "react";
import useCapacitor from "../../../../../../hooks/useCapacitor";
import { useInView } from "../../../../../../hooks/useInView";
import { useOptimizedVideo } from "../../../../../../hooks/useOptimizedVideo";
import { getVideoConversions, checkVideoAvailability } from "../../../../../../helpers/video.helpers";

interface Props {
  readonly src: string;
}

function DropListItemContentMediaVideo({ src }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [wrapperRef, inView] = useInView<HTMLDivElement>();
  const capacitor = useCapacitor();
  const hlsRef = useRef<any>(null);

  // Get the optimized video URL from the hook
  const { playableUrl, isHls, isOptimized } = useOptimizedVideo(src, {
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

  // Update video source when playableUrl changes
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Cleanup previous HLS instance
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    console.debug('Video update:', {
      isHls,
      playableUrl,
      isOptimized,
      canPlayHLS: video.canPlayType('application/vnd.apple.mpegurl')
    });

    if (isHls) {
      // Check if browser supports HLS natively (Safari/iOS)
      if (video.canPlayType('application/vnd.apple.mpegurl')) {
        console.debug('Safari native HLS support detected');
        video.src = playableUrl;
      } else {
        // Use hls.js for Chrome/Firefox
        console.debug('Loading hls.js for Chrome/Firefox');
        
        // NOTE: HLS.js requires 'blob:' in the CSP media-src directive
        // Without it, you'll see CSP errors blocking blob: URLs
        // The backend needs: Content-Security-Policy: media-src 'self' blob: https://*.cloudfront.net
        
        import('hls.js').then(({ default: Hls }) => {
          if (Hls.isSupported()) {
            console.debug('hls.js is supported, initializing...');
            const hls = new Hls({
              enableWorker: true,
              lowLatencyMode: false,
              backBufferLength: 90,
              xhrSetup: (xhr, url) => {
                // This might help with CORS in some cases
                xhr.withCredentials = false;
              }
            });
            
            let hasFatalError = false;
            
            hls.on(Hls.Events.ERROR, (event, data) => {
              console.debug('HLS error:', data);
              
              if (data.fatal) {
                switch (data.type) {
                  case Hls.ErrorTypes.NETWORK_ERROR:
                    // Check if it's a CORS error
                    if (data.details === 'manifestLoadError' && !hasFatalError) {
                      hasFatalError = true;
                      console.error('HLS CORS error detected, falling back to MP4');
                      hls.destroy();
                      hlsRef.current = null;
                      
                      // Try to find an MP4 version
                      const conversions = getVideoConversions(src);
                      if (conversions) {
                        // Try 720p first
                        checkVideoAvailability(conversions.MP4_720P).then(available => {
                          if (available && video) {
                            console.debug('Falling back to 720p MP4');
                            video.src = conversions.MP4_720P;
                          } else {
                            // Try 360p
                            checkVideoAvailability(conversions.MP4_360P).then(available360 => {
                              if (available360 && video) {
                                console.debug('Falling back to 360p MP4');
                                video.src = conversions.MP4_360P;
                              } else {
                                console.debug('Falling back to original video');
                                video.src = src;
                              }
                            });
                          }
                        });
                      } else {
                        video.src = src;
                      }
                    } else if (!hasFatalError) {
                      console.debug('Attempting to recover from network error');
                      hls.startLoad();
                    }
                    break;
                  case Hls.ErrorTypes.MEDIA_ERROR:
                    if (!hasFatalError) {
                      console.debug('Attempting to recover from media error');
                      hls.recoverMediaError();
                    }
                    break;
                  default:
                    if (!hasFatalError) {
                      hasFatalError = true;
                      console.error('Unrecoverable HLS error, falling back to original');
                      hls.destroy();
                      video.src = src;
                    }
                    break;
                }
              }
            });
            
            hls.on(Hls.Events.MANIFEST_PARSED, () => {
              console.debug('HLS manifest parsed, ready to play');
              if (inView && !capacitor.isCapacitor) {
                video.play().catch(err => console.debug('HLS autoplay error:', err));
              }
            });
            
            hls.loadSource(playableUrl);
            hls.attachMedia(video);
            hlsRef.current = hls;
          } else {
            console.warn('hls.js is not supported in this browser, falling back to original');
            video.src = src;
          }
        }).catch(err => {
          console.error('Failed to load hls.js:', err);
          video.src = src;
        });
      }
    } else {
      // Regular MP4 video (either optimized or original)
      console.debug('Using MP4 source:', playableUrl);
      video.src = playableUrl;
      
      // Autoplay if in view and not on mobile
      if (inView && !capacitor.isCapacitor) {
        video.play().catch(err => console.debug('Auto-play error:', err));
      }
    }

    // Cleanup function
    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [playableUrl, isHls, isOptimized, inView, capacitor.isCapacitor, src]);

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

import React, { useState, useEffect, useRef, useCallback } from "react";

interface ClientThumbnailGeneratorProps {
  readonly src: string;
}

const ClientThumbnailGenerator: React.FC<ClientThumbnailGeneratorProps> = ({
  src,
}) => {
  const [thumbnailDataUrl, setThumbnailDataUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<boolean>(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const cleanup = useCallback(() => {
    const video = videoRef.current;
    if (video) {
      // Remove event listeners
      video.removeEventListener("loadedmetadata", handleMetadataLoaded);
      video.removeEventListener("seeked", handleSeeked);
      video.removeEventListener("error", handleError);
      // Pause and clear src to release resources
      video.pause();
      video.removeAttribute("src");
      video.load();
      videoRef.current = null; // Clear ref
    }
  }, []);

  const handleMetadataLoaded = useCallback(() => {
    if (videoRef.current) {
      // Seek slightly after the beginning
      videoRef.current.currentTime = 0.1;
    }
  }, []);

  const handleSeeked = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (video && canvas) {
      try {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const imageDataURL = canvas.toDataURL("image/jpeg", 0.8); // Use JPEG for smaller size
          setThumbnailDataUrl(imageDataURL);
        } else {
          setError(true); // Canvas context error
        }
      } catch (err) {
        console.error("Error drawing video frame to canvas:", err);
        setError(true);
      } finally {
        setIsLoading(false);
        cleanup(); // Clean up after drawing or if error occurred during draw
      }
    }
  }, [cleanup]);

  const handleError = useCallback(() => {
    console.error("Error loading video for thumbnail generation:", src);
    setError(true);
    setIsLoading(false);
    cleanup();
  }, [src, cleanup]);

  useEffect(() => {
    // Reset state on src change
    setIsLoading(true);
    setError(false);
    setThumbnailDataUrl(null);

    const video = document.createElement("video");
    videoRef.current = video;
    video.crossOrigin = "anonymous"; // May be needed depending on CDN CORS policy
    video.muted = true; // Mute to avoid potential playback issues
    video.playsInline = true; // Important for mobile

    const canvas = document.createElement("canvas");
    canvasRef.current = canvas;

    video.addEventListener("loadedmetadata", handleMetadataLoaded);
    video.addEventListener("seeked", handleSeeked);
    video.addEventListener("error", handleError);

    // Start loading the video
    video.src = src;
    video.load(); // Explicitly call load

    // Cleanup function for the effect
    return () => {
      cleanup();
    };
  }, [src, handleMetadataLoaded, handleSeeked, handleError, cleanup]);


  // Render Logic
  if (isLoading) {
    // Simple pulsing placeholder
    return (
      <div className="tw-w-full tw-h-full tw-bg-iron-800 tw-animate-pulse tw-rounded-xl" />
    );
  }

  if (error || !thumbnailDataUrl) {
    // Error or no thumbnail state - show a placeholder (e.g., broken image icon)
    // Using FontAwesome icon as an example
    return (
      <div className="tw-w-full tw-h-full tw-flex tw-items-center tw-justify-center tw-bg-iron-800 tw-rounded-xl">
        <svg 
          className="tw-w-10 tw-h-10 tw-text-iron-500" 
          fill="currentColor" 
          viewBox="0 0 20 20" 
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
            <path 
              clipRule="evenodd" 
              fillRule="evenodd" 
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm0-2a6 6 0 100-12 6 6 0 000 12zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" 
            />
        </svg>
      </div>
    );
  }

  // Display the generated thumbnail
  return (
    <div className="tw-w-full tw-h-full tw-flex tw-items-center tw-justify-center tw-bg-black">
      <img
        src={thumbnailDataUrl}
        alt="Media thumbnail"
        className="tw-object-contain tw-max-w-full tw-max-h-full"
      />
    </div>
  );
};

export default React.memo(ClientThumbnailGenerator); 
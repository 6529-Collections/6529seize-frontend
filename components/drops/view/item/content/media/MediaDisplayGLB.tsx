import React, { useRef, useEffect, useState } from "react";
import "@google/model-viewer";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faXmark } from "@fortawesome/free-solid-svg-icons";
import useDeviceInfo from "@/hooks/useDeviceInfo";

/**
 * 3D model display component that prevents scroll hijacking.
 * Desktop: Click to enable, double-click to disable.
 * Touch: Click to enable, use close button to disable.
 */
export default function MediaDisplayGLB({
  src,
}: {
  readonly src: string;
}) {
  const modelRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isActive, setIsActive] = useState(false);
  const { hasTouchScreen } = useDeviceInfo();

  useEffect(() => {
    const modelViewer = modelRef.current;
    const container = containerRef.current;
    if (!modelViewer || !container) return;

    const enableControls = (e: Event) => {
      e.stopPropagation();
      e.preventDefault();
      setIsActive(true);
      modelViewer.setAttribute('camera-controls', '');
    };

    const disableControls = () => {
      setIsActive(false);
      modelViewer.removeAttribute('camera-controls');
    };

    const handleClick = (e: Event) => {
      if (!isActive) {
        enableControls(e);
      }
    };

    const handleDoubleClick = (e: Event) => {
      if (isActive && !hasTouchScreen) {
        e.stopPropagation();
        e.preventDefault();
        disableControls();
      }
    };

    const handleClickOutside = (e: Event) => {
      if (isActive && !container.contains(e.target as Node)) {
        disableControls();
      }
    };

    // Enable controls on click
    modelViewer.addEventListener('click', handleClick);
    
    // Disable controls on double-click (desktop only)
    if (!hasTouchScreen) {
      modelViewer.addEventListener('dblclick', handleDoubleClick);
    }
    
    // Disable controls when clicking outside (only when active)
    if (isActive) {
      document.addEventListener('click', handleClickOutside);
    }

    // Cleanup
    return () => {
      if (modelViewer) {
        modelViewer.removeEventListener('click', handleClick);
        modelViewer.removeEventListener('dblclick', handleDoubleClick);
      }
      document.removeEventListener('click', handleClickOutside);
    };
  }, [isActive, hasTouchScreen]);

  const handleCloseClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setIsActive(false);
    if (modelRef.current) {
      modelRef.current.removeAttribute('camera-controls');
    }
  };

  const handleContainerTouch = (e: React.TouchEvent) => {
    // Only prevent touch events from bubbling when GLB is in interactive mode
    if (isActive) {
      e.stopPropagation();
    }
  };

  return (
    <div 
      ref={containerRef} 
      className="tw-w-full tw-h-full tw-relative tw-select-none"
      onTouchStart={handleContainerTouch}
      onTouchMove={handleContainerTouch}
      onTouchEnd={handleContainerTouch}
    >
      {/* @ts-ignore */}
      <model-viewer
        ref={modelRef}
        src={src}
        ar
        auto-rotate
        disable-pan
        // Note: camera-controls removed by default, added via JS on interaction
        className="tw-w-full tw-h-full"
        // @ts-ignore
      ></model-viewer>

      {/* Controls overlay - positioned like video controls */}
      <div className="tw-absolute tw-bottom-2 tw-right-2 tw-z-20 tw-flex tw-items-center tw-gap-2">
        {/* Text hint */}
        <div 
          className={`tw-bg-black/20 tw-px-2 tw-py-1 tw-rounded tw-text-iron-100 tw-text-xs tw-shadow-lg ${
            !isActive ? 'tw-cursor-pointer hover:tw-bg-black/30' : 'tw-pointer-events-none'
          }`}
          onClick={!isActive ? (e) => {
            e.stopPropagation();
            e.preventDefault();
            setIsActive(true);
            if (modelRef.current) {
              modelRef.current.setAttribute('camera-controls', '');
            }
          } : undefined}
        >
          {!isActive 
            ? "Click model to interact"
            : hasTouchScreen 
              ? "Use close button to end"
              : "Double-click model to end"
          }
        </div>

        {/* Close button for touch devices when active */}
        {isActive && hasTouchScreen && (
          <button
            onClick={handleCloseClick}
            className="tw-bg-black/70 tw-border tw-broder-solid tw-border-red tw-text-red tw-rounded-full tw-w-6 tw-h-6 tw-flex tw-items-center tw-justify-center tw-transition-colors"
            aria-label="Disable 3D controls"
          >
            <FontAwesomeIcon icon={faXmark} className="tw-w-3 tw-h-3 tw-flex-shrink-0" />
          </button>
        )}
      </div>
    </div>
  );
}

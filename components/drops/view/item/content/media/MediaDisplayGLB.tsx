"use client";

import useDeviceInfo from "@/hooks/useDeviceInfo";
import "@google/model-viewer";
import React, { useEffect, useRef, useState } from "react";
import { Tooltip } from "react-tooltip";

/**
 * 3D model display component with custom 3D cube toggle icon.
 * - Click cube icon to enable/disable 3D controls (all devices)
 * - Desktop: Double-click model as secondary disable method
 * - Prevents scroll hijacking when controls are active
 */
export default function MediaDisplayGLB({
  src,
  disableMediaInteractions = false,
}: {
  readonly src: string;
  readonly disableMediaInteractions?: boolean | undefined;
}) {
  const modelRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isActive, setIsActive] = useState(false);
  const { hasTouchScreen } = useDeviceInfo();

  useEffect(() => {
    const modelViewer = modelRef.current;
    const container = containerRef.current;
    if (!modelViewer || !container) return;

    const disableControls = () => {
      setIsActive(false);
      modelViewer.removeAttribute("camera-controls");
    };

    const handleClickOutside = (e: Event) => {
      if (isActive && !container.contains(e.target as Node)) {
        disableControls();
      }
    };

    // Disable controls when clicking outside (only when active)
    if (isActive) {
      document.addEventListener("click", handleClickOutside);
    }

    // Cleanup
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [isActive, hasTouchScreen]);

  useEffect(() => {
    if (disableMediaInteractions) return;
    if (!modelRef.current) return;
    setIsActive(true);
    modelRef.current.setAttribute("camera-controls", "");
  }, [disableMediaInteractions, src]);

  const handleCubeToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    if (isActive) {
      // Disable 3D controls
      setIsActive(false);
      if (modelRef.current) {
        modelRef.current.removeAttribute("camera-controls");
      }
    } else {
      // Enable 3D controls
      setIsActive(true);
      if (modelRef.current) {
        modelRef.current.setAttribute("camera-controls", "");
      }
    }
  };

  const handleContainerInteraction = (
    e: React.MouseEvent | React.TouchEvent
  ) => {
    // Prevent navigation/touch events from bubbling when 3D controls are active
    if (isActive) {
      e.stopPropagation();
    }
  };

  return (
    <section
      ref={containerRef}
      className="tw-relative tw-h-full tw-w-full tw-select-none"
      onClick={handleContainerInteraction}
      onTouchStart={handleContainerInteraction}
      onTouchMove={handleContainerInteraction}
      onTouchEnd={handleContainerInteraction}
      aria-label="3D model viewer"
    >
      {/* @ts-ignore */}
      <model-viewer
        ref={modelRef}
        src={src}
        auto-rotate
        disable-pan
        // Note: camera-controls removed by default, added via JS on interaction
        className="tw-h-full tw-w-full"
        // @ts-ignore
      ></model-viewer>

      {/* Custom 3D Cube Icon - positioned like native AR icon */}
      {!disableMediaInteractions && (
        <div className="tw-absolute tw-bottom-2 tw-right-2 tw-z-[1]">
          <button
            onClick={handleCubeToggle}
            className={`tw-flex tw-h-9 tw-w-9 tw-items-center tw-justify-center tw-rounded-full tw-border tw-border-solid tw-transition-all tw-duration-200 ${
              isActive
                ? "tw-border-primary-600 tw-bg-primary-500 tw-text-white tw-shadow-lg tw-shadow-primary-500/50 hover:tw-bg-primary-600"
                : "tw-border-gray-300 tw-bg-gray-200 tw-text-gray-700 tw-shadow-md tw-shadow-gray-400/30 hover:tw-bg-gray-300"
            }`}
            aria-label={isActive ? "Disable 3D controls" : "Enable 3D controls"}
            data-tooltip-id="glb-cube-tooltip"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="tw-drop-shadow-sm"
            >
              {/* Corner brackets */}
              <path d="M3 7V5a2 2 0 0 1 2-2h2" />
              <path d="M17 3h2a2 2 0 0 1 2 2v2" />
              <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
              <path d="M7 21H5a2 2 0 0 1-2-2v-2" />

              {/* Top face */}
              <path
                d="M6 9l6-3 6 3l-6 3z"
                fill={isActive ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.05)"}
                stroke="currentColor"
              />
              {/* Left face */}
              <path
                d="M6 9v6l6 3V12z"
                fill={isActive ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.03)"}
                stroke="currentColor"
              />
              {/* Right face */}
              <path
                d="M12 12v6l6-3v-6z"
                fill={isActive ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.02)"}
                stroke="currentColor"
              />

              {/* All connecting edges (re‑stroked for extra weight) */}
              <path d="M6 9v6l6 3 6-3v-6" fill="none" stroke="currentColor" />
              <path d="M6 9l6-3 6 3" fill="none" stroke="currentColor" />
              <path d="M12 6v12" fill="none" stroke="currentColor" />
            </svg>
          </button>

          {/* Tooltip for desktop only */}
          {!hasTouchScreen && (
            <Tooltip
              id="glb-cube-tooltip"
              place="left"
              style={{
                backgroundColor: "#1F2937",
                color: "white",
                padding: "6px 10px",
                fontSize: "12px",
              }}
            >
              {isActive
                ? "Click to disable 3D controls"
                : "Click to enable 3D controls"}
            </Tooltip>
          )}
        </div>
      )}
    </section>
  );
}

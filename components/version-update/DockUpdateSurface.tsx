"use client";

import { useId, type ReactNode } from "react";
import styles from "./DockUpdateSurface.module.css";

const BUMP_PATH = "M0 36 C24 36 24 0 52 0 C80 0 80 36 104 36 V37 H0 Z";

/** The browser lays out this silhouette with the dock; no measured frame is cached. */
export default function DockUpdateSurface({
  children,
}: {
  readonly children?: ReactNode;
}) {
  const id = useId().replaceAll(":", "");
  const shapeId = `${id}-shape`;
  const clipId = `${id}-clip`;
  const edgeId = `${id}-edge`;
  const clipPath = `var(--dock-update-contour, url(#${clipId}))`;

  return (
    <div
      aria-hidden="true"
      data-dock-update-surface="true"
      className={styles["surface"]}
    >
      <svg className={styles["outline"]} width="100%" height="100%">
        <defs>
          <g id={shapeId} fill="white">
            <rect className={styles["body"]} />
            <path className={styles["bump"]} d={BUMP_PATH} />
          </g>
          <clipPath id={clipId}>
            <rect className={styles["body"]} />
            <path className={styles["bump"]} d={BUMP_PATH} />
          </clipPath>
          {/* Match main's box-shadow order, radii and opacity. Outer shadows must
              exclude the ENTIRE silhouette, or they brighten the glass/join. */}
          <filter
            id={edgeId}
            x="-50%"
            y="-150%"
            width="200%"
            height="400%"
            colorInterpolationFilters="sRGB"
          >
            <feGaussianBlur
              in="SourceAlpha"
              stdDeviation="17"
              result="glowBlur"
            />
            <feFlood floodColor="white" floodOpacity="0.075" />
            <feComposite in2="glowBlur" operator="in" result="glow" />
            <feMorphology
              in="SourceAlpha"
              operator="dilate"
              radius="1"
              result="spread"
            />
            <feFlood floodColor="white" floodOpacity="0.045" />
            <feComposite in2="spread" operator="in" result="ring" />
            <feGaussianBlur in="SourceAlpha" stdDeviation="22.5" />
            <feOffset dy="18" result="dropBlur" />
            <feFlood floodColor="black" floodOpacity="0.48" />
            <feComposite in2="dropBlur" operator="in" result="drop" />
            <feMerge>
              <feMergeNode in="glow" />
              <feMergeNode in="ring" />
              <feMergeNode in="drop" />
            </feMerge>
            <feComposite in2="SourceAlpha" operator="out" result="outside" />
            <feOffset in="SourceAlpha" dy="1" result="down" />
            <feComposite
              in="SourceAlpha"
              in2="down"
              operator="out"
              result="topEdge"
            />
            <feFlood floodColor="white" floodOpacity="0.105" />
            <feComposite in2="topEdge" operator="in" result="topHighlight" />
            <feOffset in="SourceAlpha" dy="-1" result="up" />
            <feComposite
              in="SourceAlpha"
              in2="up"
              operator="out"
              result="bottomEdge"
            />
            <feFlood floodColor="white" floodOpacity="0.06" />
            <feComposite
              in2="bottomEdge"
              operator="in"
              result="bottomHighlight"
            />
            <feMerge>
              <feMergeNode in="outside" />
              <feMergeNode in="bottomHighlight" />
              <feMergeNode in="topHighlight" />
            </feMerge>
          </filter>
        </defs>
        <use href={`#${shapeId}`} filter={`url(#${edgeId})`} />
      </svg>
      <div className={styles["glass"]} style={{ clipPath }} />
      <div
        data-dock-selection-clip="true"
        className={styles["selectionClip"]}
        style={{ clipPath }}
      >
        <div className={styles["selectionBody"]}>{children}</div>
      </div>
    </div>
  );
}

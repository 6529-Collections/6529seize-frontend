"use client";

import useDeviceInfo from "@/hooks/useDeviceInfo";

/** Fills a reserved image frame without changing its dimensions on load. */
export function ImagePreviewLoading() {
  const { hasTouchScreen } = useDeviceInfo();
  return (
    <div
      aria-hidden="true"
      className={`tw-absolute tw-inset-0 tw-rounded-xl tw-bg-iron-800 ${hasTouchScreen ? "" : "motion-safe:tw-animate-pulse"}`}
    />
  );
}

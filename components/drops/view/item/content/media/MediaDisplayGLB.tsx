import React from "react";
import "@google/model-viewer";

/**
 * 3D model display component without interactive modal functionality.
 * Uses the same model-viewer as the original component.
 */
export default function MediaDisplayGLB({
  src,
}: {
  readonly src: string;
}) {
  return (
    <div className="tw-w-full tw-h-full">
      {/* @ts-ignore */}
      <model-viewer
        src={src}
        ar
        auto-rotate
        camera-controls
        className="tw-w-full tw-h-full"
        // @ts-ignore
      ></model-viewer>
    </div>
  );
}

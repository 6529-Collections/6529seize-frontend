import React from "react";
import { FallbackImage } from "@/components/common/FallbackImage";

interface WavePictureProps {
  readonly name: string;
  readonly picture: string | null;
  readonly contributors: {
    readonly pfp: string;
  }[];
}

const polygonsByCount: Record<number, string[]> = {
  // 1 entire area
  1: ["polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)"],

  // 2 halves: left, right
  2: [
    "polygon(0% 0%, 50% 0%, 50% 100%, 0% 100%)", // left
    "polygon(50% 0%, 100% 0%, 100% 100%, 50% 100%)", // right
  ],

  // 3 horizontal strips: top, middle, bottom
  3: [
    "polygon(0% 0%, 100% 0%, 100% 33.33%, 0% 33.33%)", // top
    "polygon(0% 33.33%, 100% 33.33%, 100% 66.66%, 0% 66.66%)", // middle
    "polygon(0% 66.66%, 100% 66.66%, 100% 100%, 0% 100%)", // bottom
  ],

  // 4 quadrants
  4: [
    "polygon(0% 0%, 50% 0%, 50% 50%, 0% 50%)", // top-left
    "polygon(50% 0%, 100% 0%, 100% 50%, 50% 50%)", // top-right
    "polygon(0% 50%, 50% 50%, 50% 100%, 0% 100%)", // bottom-left
    "polygon(50% 50%, 100% 50%, 100% 100%, 50% 100%)", // bottom-right
  ],

  // 5 horizontal strips (each 20% height)
  5: [
    "polygon(0% 0%, 100% 0%, 100% 20%, 0% 20%)",
    "polygon(0% 20%, 100% 20%, 100% 40%, 0% 40%)",
    "polygon(0% 40%, 100% 40%, 100% 60%, 0% 60%)",
    "polygon(0% 60%, 100% 60%, 100% 80%, 0% 80%)",
    "polygon(0% 80%, 100% 80%, 100% 100%, 0% 100%)",
  ],

  // 6 => 2 rows × 3 columns each
  6: [
    // top-left
    "polygon(0% 0%, 33.33% 0%, 33.33% 50%, 0% 50%)",
    // top-middle
    "polygon(33.33% 0%, 66.66% 0%, 66.66% 50%, 33.33% 50%)",
    // top-right
    "polygon(66.66% 0%, 100% 0%, 100% 50%, 66.66% 50%)",
    // bottom-left
    "polygon(0% 50%, 33.33% 50%, 33.33% 100%, 0% 100%)",
    // bottom-middle
    "polygon(33.33% 50%, 66.66% 50%, 66.66% 100%, 33.33% 100%)",
    // bottom-right
    "polygon(66.66% 50%, 100% 50%, 100% 100%, 66.66% 100%)",
  ],
};

export default function WavePicture({
  name,
  picture,
  contributors,
}: WavePictureProps) {
  if (picture) {
    return (
      <div className="tw-w-full tw-h-full tw-relative tw-rounded-full tw-overflow-hidden">
        <FallbackImage
          primarySrc={picture}
          fallbackSrc={picture}
          alt={name}
          fill
          sizes="64px"
          className="tw-object-cover"
        />
      </div>
    );
  }

  const pfps = contributors.map((c) => c.pfp).filter(Boolean);

  // 3) If no PFPS, show fallback background
  if (pfps.length === 0) {
    return (
      <div className="tw-w-full tw-h-full tw-bg-gradient-to-br tw-from-iron-800 tw-to-iron-700 tw-rounded-full" />
    );
  }

  // 4) Use up to N slices
  const maxSlices = 6;
  const sliceCount = Math.min(pfps.length, maxSlices);

  // 5) Grab the polygons for that sliceCount
  const polygons = polygonsByCount[sliceCount];

  return (
    <div className="tw-relative tw-w-full tw-h-full">
      {pfps.slice(0, sliceCount).map((pfp, i) => {
        const clip = polygons[i];
        return (
          <div
            key={pfp + i}
            className="tw-absolute tw-inset-0"
            style={{ clipPath: clip }}
          >
            <FallbackImage
              primarySrc={pfp}
              fallbackSrc={pfp}
              alt={`Contributor-${i}`}
              fill
              sizes="64px"
              className="tw-object-cover tw-block tw-rounded-full"
            />
          </div>
        );
      })}
    </div>
  );
}

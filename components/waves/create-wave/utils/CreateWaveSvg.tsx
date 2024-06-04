import { useRouter } from "next/router";
import { useEffect, useState } from "react";

export default function CreateWaveSvg() {
  const router = useRouter();

  const isFirefox = () => {
    return (
      typeof window !== "undefined" &&
      typeof (window as any).InstallTrigger !== "undefined"
    );
  };

  const firefox = isFirefox();
  return (
    <div>
      <svg
        width="700"
        height="700"
        viewBox="0 0 700 700"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g clip-path="url(#clip0_1973_2242)">
          <path
            opacity="0.16"
            d="M700 0H0V700H700V0Z"
            fill="url(#paint0_radial_1973_2242)"
          />
        </g>
        <defs>
          <radialGradient
            id="paint0_radial_1973_2242"
            cx="0"
            cy="0"
            r="1"
            gradientUnits="userSpaceOnUse"
            gradientTransform="translate(350 350) scale(350)"
          >
            <stop stop-color="#94979D" />
            <stop offset="1" stop-color="#131316" />
          </radialGradient>
          <clipPath id="clip0_1973_2242">
            <rect width="700" height="700" fill="white" />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
}

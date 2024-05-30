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
    <svg
      width="1375"
      height="1328"
      viewBox="0 0 1375 1328"
      fill="none"
      className={firefox ? "firefox-svg" : ""}
      xmlns="http://www.w3.org/2000/svg"
    >
      <g>
        <g
          filter={`url(#${
            firefox ? "adjustedFilters" : "filter0_f_1844_1505"
          })`}
        >
          <ellipse
            cx="99.4611"
            cy="98.0406"
            rx="99.4611"
            ry="98.0406"
            transform="matrix(0.984162 0.177269 -0.154162 0.988046 612.228 525)"
            fill="#6A40D3"
          />
        </g>
        <g
          filter={`url(#${
            firefox ? "adjustedFilters" : "filter0_f_1844_1505"
          })`}
        >
          <ellipse
            cx="66.2658"
            cy="47.4838"
            rx="66.2658"
            ry="47.4838"
            transform="matrix(0.948518 0.316724 -0.253382 0.967366 644.177 562.782)"
            fill="#4E29E4"
          />
        </g>
        <g
          filter={`url(#${
            firefox ? "adjustedFilters" : "filter0_f_1844_1505"
          })`}
        >
          <path
            d="M701.755 666.516C646.126 656.619 634.377 595.086 614.768 594.496C590.118 593.756 589.535 650.111 607.475 673.715C628.621 701.538 739.453 673.223 701.755 666.516Z"
            fill="#00EAFF"
          />
        </g>
        <g
          filter={`url(#${
            firefox ? "adjustedFilters" : "filter0_f_1844_1505"
          })`}
        >
          <path
            d="M612.725 675.222C595.425 675.305 591.524 697.958 591.986 711.917C592.949 741.043 746.002 750.667 768.323 726.266C784.728 708.334 794.724 668.372 776.515 659.532C755.936 649.543 748.514 651.463 728.888 659.532C712.512 666.264 699.345 669.524 681.294 675.222C664.398 680.555 628.091 675.148 612.725 675.222Z"
            fill="#9AAAFF"
          />
        </g>
      </g>
      <defs>
        <filter
          id="filter0_f_1844_1505"
          x="195.317"
          y="140.4"
          width="999.366"
          height="998.2"
          filterUnits="userSpaceOnUse"
          color-interpolation-filters="sRGB"
        >
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feBlend
            mode="normal"
            in="SourceGraphic"
            in2="BackgroundImageFix"
            result="shape"
          />
          <feGaussianBlur
            stdDeviation="200.312"
            result="effect1_foregroundBlur_1844_1505"
          />
        </filter>
        <filter
          id="filter1_f_1844_1505"
          x="74.5231"
          y="22.7195"
          width="1240.95"
          height="1213.97"
          filterUnits="userSpaceOnUse"
          color-interpolation-filters="sRGB"
        >
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feBlend
            mode="normal"
            in="SourceGraphic"
            in2="BackgroundImageFix"
            result="shape"
          />
          <feGaussianBlur
            stdDeviation="278.235"
            result="effect1_foregroundBlur_1844_1505"
          />
        </filter>
        <filter
          id="filter2_f_1844_1505"
          x="0.853333"
          y="0.329285"
          width="1302.82"
          height="1279.56"
          filterUnits="userSpaceOnUse"
          color-interpolation-filters="sRGB"
        >
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feBlend
            mode="normal"
            in="SourceGraphic"
            in2="BackgroundImageFix"
            result="shape"
          />
          <feGaussianBlur
            stdDeviation="297.08"
            result="effect1_foregroundBlur_1844_1505"
          />
        </filter>
        <filter
          id="filter3_f_1844_1505"
          x="4.10022"
          y="64.8912"
          width="1370"
          height="1263.11"
          filterUnits="userSpaceOnUse"
          color-interpolation-filters="sRGB"
        >
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feBlend
            mode="normal"
            in="SourceGraphic"
            in2="BackgroundImageFix"
            result="shape"
          />
          <feGaussianBlur
            stdDeviation="293.925"
            result="effect1_foregroundBlur_1844_1505"
          />
        </filter>
        <filter
          id="adjustedFilters"
          x="4.10022"
          y="64.8912"
          width="1370"
          height="1263.11"
          filterUnits="userSpaceOnUse"
          color-interpolation-filters="sRGB"
        >
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feBlend
            mode="normal"
            in="SourceGraphic"
            in2="BackgroundImageFix"
            result="shape"
          />
          <feGaussianBlur
            stdDeviation="146.963"
            result="effect1_foregroundBlur_1844_1505"
          />
        </filter>
      </defs>
    </svg>
  );
}

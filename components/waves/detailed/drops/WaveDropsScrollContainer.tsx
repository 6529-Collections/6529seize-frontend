import React, { forwardRef } from "react";

interface WaveDropsScrollContainerProps {
  readonly children: React.ReactNode;
  readonly onScroll: () => void;
}

export const WaveDropsScrollContainer = forwardRef<
  HTMLDivElement,
  WaveDropsScrollContainerProps
>(({ children, onScroll }, ref) => {
  return (
    <div
      ref={ref}
      className="tw-flex tw-flex-col-reverse tw-flex-grow tw-overflow-y-auto tw-divide-y tw-divide-iron-800 tw-divide-solid tw-divide-x-0 tw-scrollbar-thin tw-scrollbar-thumb-iron-500 tw-scrollbar-track-iron-800 hover:tw-scrollbar-thumb-iron-300 tw-transition-all tw-duration-300"
      onScroll={onScroll}
    >
      <div className="tw-flex tw-flex-col-reverse tw-flex-grow">
        <div className="tw-overflow-hidden">{children}</div>
        <div className="tw-bg-iron-900 tw-px-4 tw-py-4 tw-mb-2">
          <div className="tw-mb-2 tw-bg-iron-700 tw-h-14 tw-w-14 tw-flex tw-justify-center tw-items-center tw-rounded-full">
            <svg
              className="tw-size-6 tw-text-iron-300"
              viewBox="0 0 56 56"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <g clipPath="url(#clip0_3618_2829)">
                <path
                  d="M48.4537 30.9531H49.9848C53.3016 30.9531 56 28.2545 56 24.9375V22.4219C56 19.1049 53.3016 16.4062 49.9848 16.4062H38.8459V13.0456L42.2741 7.51548C43.2288 5.9757 43.2727 4.1113 42.3917 2.5282C41.5106 0.945219 39.9031 0 38.0914 0H4.93119C3.11961 0 1.51202 0.945109 0.631003 2.5282C-0.250013 4.1113 -0.206154 5.9757 0.748471 7.51548L4.17683 13.0455V42.9545L0.748471 48.4845C-0.206154 50.0243 -0.250122 51.8887 0.631003 53.4718C1.51202 55.0549 3.11961 56 4.93119 56H38.0913C39.903 56 41.5105 55.0548 42.3916 53.4718C43.2726 51.8887 43.2287 50.0243 42.274 48.4845L38.8458 42.9544V19.6875H49.9847C51.4923 19.6875 52.7189 20.9141 52.7189 22.4219V24.9375C52.7189 26.4452 51.4923 27.6719 49.9847 27.6719H48.4536C45.1368 27.6719 42.4384 30.3705 42.4384 33.6875V35C42.4384 38.317 45.1368 41.0156 48.4536 41.0156C49.0613 41.0156 49.6262 41.289 50.0034 41.7654L53.0731 45.6433C53.397 46.0523 53.8764 46.2656 54.3605 46.2656C54.717 46.2656 55.0763 46.1498 55.3777 45.9113C56.0881 45.3488 56.2079 44.317 55.6456 43.6066L52.5759 39.7287C51.5725 38.4613 50.07 37.7344 48.4537 37.7344C46.9461 37.7344 45.7195 36.5077 45.7195 35V33.6875C45.7195 32.1798 46.9461 30.9531 48.4537 30.9531ZM39.5249 51.876C39.3838 52.1293 38.9618 52.7188 38.0914 52.7188H4.93119C4.06078 52.7188 3.63882 52.1293 3.49783 51.876C3.35685 51.6227 3.07827 50.9533 3.53699 50.2136L6.73041 45.0625H36.2922L39.4857 50.2136C39.9443 50.9533 39.6658 51.6227 39.5249 51.876ZM3.49783 4.12398C3.63882 3.87067 4.06078 3.28125 4.93119 3.28125H7.45775H35.5648H38.0914C38.9618 3.28125 39.3838 3.87067 39.5249 4.12398C39.6658 4.3773 39.9443 5.04667 39.4856 5.78637L36.2923 10.9375H35.5648H7.45775H6.73041L3.53699 5.78637C3.07827 5.04667 3.35685 4.3773 3.49783 4.12398ZM35.5648 41.7812H15.2508L35.5649 38.3411V41.7812H35.5648ZM35.5648 35.0132L7.45775 39.7731V35.6723L35.5648 30.9125V35.0132ZM35.5648 27.5846L7.45775 32.3445V28.2687L35.5648 23.507V27.5846ZM7.45775 14.2188H27.1225L7.45775 17.5523V14.2188ZM35.5648 20.1791L7.45775 24.9408V20.8802L35.5648 16.1156V20.1791Z"
                  fill="currentColor"
                />
              </g>
              <defs>
                <clipPath id="clip0_3618_2829">
                  <rect width="56" height="56" fill="white" />
                </clipPath>
              </defs>
            </svg>
          </div>

          <h2 className="tw-text-base tw-font-medium tw-text-iron-50 tw-mb-1">
            Lorem ipsum dolor sit.
          </h2>
          <p className="tw-text-sm tw-text-iron-400 tw-mn-0">
            Started by{" "}
            <span className="tw-font-semibold tw-text-iron-50">Ragne</span>
          </p>
          <p className="tw-text-xs tw-text-iron-500 tw-mt-1 tw-mb-0">
            23 September 2024
          </p>
        </div>
      </div>
    </div>
  );
});

WaveDropsScrollContainer.displayName = "WaveDropsScrollContainer";

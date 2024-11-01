import React from "react";
import { ApiWave } from "../../../../generated/models/ApiWave";
import Link from "next/link";
import { useRouter } from "next/router";
import { getTimeAgoShort } from "../../../../helpers/Helpers";
import { usePrefetchWaveData } from "../../../../hooks/usePrefetchWaveData";
import Tippy from "@tippyjs/react";
import useIsMobileDevice from "../../../../hooks/isMobileDevice";

interface BrainLeftSidebarWaveProps {
  readonly wave: ApiWave;
  readonly newDropsCounts: Record<string, number>;
  readonly resetWaveCount: (waveId: string) => void;
}

const BrainLeftSidebarWave: React.FC<BrainLeftSidebarWaveProps> = ({
  wave,
  newDropsCounts,
  resetWaveCount,
}) => {
  const router = useRouter();
  const prefetchWaveData = usePrefetchWaveData();
  const isMobile = useIsMobileDevice();

  const getHref = (waveId: string) => {
    const currentWaveId = router.query.wave as string | undefined;
    return currentWaveId === waveId
      ? "/my-stream"
      : `/my-stream?wave=${waveId}`;
  };

  const haveNewDrops = newDropsCounts[wave.id] > 0;

  const onHover = (waveId: string) => {
    if (waveId !== router.query.wave) prefetchWaveData(waveId);
  };

  const isActive = wave.id === router.query.wave;

  const onLinkClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    resetWaveCount(wave.id);
    router.push(getHref(wave.id), undefined, { shallow: true });
  };

  return (
    <div
      className={`tw-flex tw-px-5 tw-py-2 tw-group tw-transition-colors tw-duration-200 tw-ease-in-out ${
        isActive
          ? "tw-bg-primary-300/5 desktop-hover:hover:tw-bg-primary-300/10"
          : "desktop-hover:hover:tw-bg-iron-900"
      }`}
    >
      <Link
        href={getHref(wave.id)}
        onMouseEnter={() => onHover(wave.id)}
        onClick={onLinkClick}
        className={`tw-flex tw-relative tw-items-center tw-flex-1 tw-space-x-3 tw-no-underline tw-py-1 ${
          isActive
            ? "tw-text-primary-400 hover:tw-text-primary-400"
            : "tw-text-iron-200 hover:tw-text-iron-200"
        }`}
      >
        <div
          className={`tw-relative tw-size-8 tw-rounded-full tw-overflow-hidden tw-transition tw-duration-300 group-hover:tw-brightness-110 ${
            isActive
              ? "tw-ring-2 tw-ring-primary-400"
              : "tw-ring-1 tw-ring-iron-700"
          }`}
        >
          {wave.picture ? (
            <img
              src={wave.picture}
              alt={wave.name}
              className="tw-w-full tw-h-full tw-object-cover"
            />
          ) : (
            <div className="tw-w-full tw-h-full tw-bg-gradient-to-br tw-from-iron-800 tw-to-iron-700" />
          )}
        </div>
        {!isActive && haveNewDrops && (
          <div className="tw-absolute tw-top-1 tw-left-2 tw-bg-indigo-500 tw-text-white tw-rounded-full tw-h-4 tw-min-w-4 tw-flex tw-items-center tw-justify-center tw-text-xs tw-animate-pulse group-hover:tw-animate-bounce">
            {newDropsCounts[wave.id]}
          </div>
        )}
        <div className="tw-flex-1">
          <div className="tw-font-medium tw-text-sm">{wave.name}</div>
          <div className="tw-mt-0.5 tw-text-xs tw-text-iron-500">
            <span className="tw-pr-1">Last drop:</span>
            <span className="tw-text-iron-400">
              {getTimeAgoShort(wave.metrics.latest_drop_timestamp)}
            </span>
          </div>
        </div>
      </Link>
      <div className="tw-flex tw-items-center tw-gap-x-4 md:tw-gap-x-2">
        <Tippy
          content={<span className="tw-text-xs">Stream</span>}
          disabled={isMobile}
        >
          <button
            onClick={() => {
              resetWaveCount(wave.id);
              router.push(getHref(wave.id), undefined, { shallow: true });
            }}
            className="tw-size-8 md:tw-size-7 tw-rounded-lg tw-bg-iron-800/50 tw-flex tw-items-center tw-justify-center tw-border-0 tw-text-iron-400 desktop-hover:hover:tw-text-iron-50 tw-transition tw-duration-300 tw-ease-out desktop-hover:hover:tw-bg-iron-700 focus-visible:tw-outline-none focus-visible:tw-ring-1 focus-visible:tw-ring-primary-400"
          >
            <svg
              width="24"
              height="24"
              className="tw-size-4 tw-flex-shrink-0"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <g clipPath="url(#clip0_4088_1029)">
                <path
                  d="M6.62133 10.6875H1.62867C0.730594 10.6875 0 9.95691 0 9.05883V4.06617C0 3.16809 0.730594 2.4375 1.62867 2.4375H6.62133C7.51941 2.4375 8.25 3.16809 8.25 4.06617V9.05883C8.25 9.95691 7.51941 10.6875 6.62133 10.6875ZM1.62867 3.9375C1.5577 3.9375 1.5 3.9952 1.5 4.06617V9.05883C1.5 9.1298 1.5577 9.1875 1.62867 9.1875H6.62133C6.6923 9.1875 6.75 9.1298 6.75 9.05883V4.06617C6.75 3.9952 6.6923 3.9375 6.62133 3.9375H1.62867Z"
                  fill="currentColor"
                />
                <path
                  d="M6.62133 21.5625H1.62867C0.730594 21.5625 0 20.8319 0 19.9338V14.9412C0 14.0431 0.730594 13.3125 1.62867 13.3125H6.62133C7.51941 13.3125 8.25 14.0431 8.25 14.9412V19.9338C8.25 20.8319 7.51941 21.5625 6.62133 21.5625ZM1.62867 14.8125C1.5577 14.8125 1.5 14.8702 1.5 14.9412V19.9338C1.5 20.0048 1.5577 20.0625 1.62867 20.0625H6.62133C6.6923 20.0625 6.75 20.0048 6.75 19.9338V14.9412C6.75 14.8702 6.6923 14.8125 6.62133 14.8125H1.62867Z"
                  fill="currentColor"
                />
                <path
                  d="M23.25 6.1875H11.25C10.8358 6.1875 10.5 5.85169 10.5 5.4375C10.5 5.02331 10.8358 4.6875 11.25 4.6875H23.25C23.6642 4.6875 24 5.02331 24 5.4375C24 5.85169 23.6642 6.1875 23.25 6.1875Z"
                  fill="currentColor"
                />
                <path
                  d="M19.125 9H11.25C10.8358 9 10.5 8.66419 10.5 8.25C10.5 7.83581 10.8358 7.5 11.25 7.5H19.125C19.5392 7.5 19.875 7.83581 19.875 8.25C19.875 8.66419 19.5392 9 19.125 9Z"
                  fill="currentColor"
                />
                <path
                  d="M23.25 16.875H11.25C10.8358 16.875 10.5 16.5392 10.5 16.125C10.5 15.7108 10.8358 15.375 11.25 15.375H23.25C23.6642 15.375 24 15.7108 24 16.125C24 16.5392 23.6642 16.875 23.25 16.875Z"
                  fill="currentColor"
                />
                <path
                  d="M19.125 19.875H11.25C10.8358 19.875 10.5 19.5392 10.5 19.125C10.5 18.7108 10.8358 18.375 11.25 18.375H19.125C19.5392 18.375 19.875 18.7108 19.875 19.125C19.875 19.5392 19.5392 19.875 19.125 19.875Z"
                  fill="currentColor"
                />
              </g>
              <defs>
                <clipPath id="clip0_4088_1029">
                  <rect width="24" height="24" fill="white" />
                </clipPath>
              </defs>
            </svg>
          </button>
        </Tippy>
        <Tippy
          content={<span className="tw-text-xs">Go to wave</span>}
          disabled={isMobile}
        >
          <Link
            href={`/waves/${wave.id}`}
            className="tw-size-8 md:tw-size-7 tw-rounded-lg tw-bg-iron-800/50 tw-flex tw-items-center tw-justify-center tw-border-0 tw-text-iron-400 desktop-hover:hover:tw-text-iron-50 tw-transition tw-duration-300 tw-ease-out desktop-hover:hover:tw-bg-iron-700 focus-visible:tw-outline-none focus-visible:tw-ring-1 focus-visible:tw-ring-primary-400"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
              aria-hidden="true"
              className="tw-size-4 tw-flex-shrink-0"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 0 1-.825-.242m9.345-8.334a2.126 2.126 0 0 0-.476-.095 48.64 48.64 0 0 0-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0 0 11.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155"
              />
            </svg>
          </Link>
        </Tippy>
      </div>
    </div>
  );
};

export default BrainLeftSidebarWave;

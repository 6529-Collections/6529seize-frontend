import React from "react";
import { ApiWave } from "../../../../generated/models/ApiWave";
import Link from "next/link";
import { useRouter } from "next/router";
import { getTimeAgoShort } from "../../../../helpers/Helpers";
import { usePrefetchWaveData } from "../../../../hooks/usePrefetchWaveData";
import Tippy from "@tippyjs/react";
import useIsMobileDevice from "../../../../hooks/isMobileDevice";
import { ApiWaveType } from "../../../../generated/models/ApiWaveType";

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
  const isDropWave = wave.wave.type !== ApiWaveType.Chat;

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
      <div className="tw-flex tw-items-center tw-gap-x-4">
        <Tippy
          content={<span className="tw-text-xs">Stream</span>}
          disabled={isMobile}
        >
          <button
            onClick={() => {
              resetWaveCount(wave.id);
              router.push(getHref(wave.id), undefined, { shallow: true });
            }}
            className="tw-size-8 md:tw-size-7 tw-rounded-lg tw-bg-iron-800 tw-flex tw-items-center tw-justify-center tw-border-0 tw-text-iron-400 desktop-hover:hover:tw-text-iron-50 tw-transition tw-duration-300 tw-ease-out desktop-hover:hover:tw-bg-iron-700 focus-visible:tw-outline-none focus-visible:tw-ring-1 focus-visible:tw-ring-primary-400"
          >
            <svg
              width="24"
              height="24"
              className="tw-size-4 tw-flex-shrink-0"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect
                x="1"
                y="4"
                width="6"
                height="6"
                rx="1"
                stroke="currentColor"
                strokeWidth="1.5"
              />
              <rect
                x="1"
                y="14"
                width="6"
                height="6"
                rx="1"
                stroke="currentColor"
                strokeWidth="1.5"
              />
              <path
                d="M11 7H23"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
              <path
                d="M11 17H23"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </Tippy>
        <Tippy
          content={<span className="tw-text-xs">Go to wave</span>}
          disabled={isMobile}
        >
          <Link
            href={`/waves/${wave.id}`}
            className="tw-size-8 md:tw-size-7 tw-rounded-lg tw-bg-iron-800 tw-flex tw-items-center tw-justify-center tw-border-0 tw-text-iron-400 desktop-hover:hover:tw-text-iron-50 tw-transition tw-duration-300 tw-ease-out desktop-hover:hover:tw-bg-iron-700 focus-visible:tw-outline-none focus-visible:tw-ring-1 focus-visible:tw-ring-primary-400"
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

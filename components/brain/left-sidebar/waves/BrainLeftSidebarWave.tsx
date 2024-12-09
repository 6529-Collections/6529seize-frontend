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

  const getAvatarRingClasses = () => {
    if (isActive) return "tw-ring-2 tw-ring-primary-400";
    if (isDropWave) return "tw-ring-2 tw-ring-blue-400/40";
    return "tw-ring-1 tw-ring-iron-700";
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
        <div className="tw-relative">
          <div
            className={`tw-relative tw-size-8 tw-rounded-full tw-overflow-hidden tw-transition tw-duration-300 group-hover:tw-brightness-110 ${getAvatarRingClasses()}`}
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
            {isDropWave && (
              <div className="tw-absolute tw-inset-0 tw-border-2 tw-border-blue-400/40 tw-rounded-full" />
            )}
          </div>
          {isDropWave && (
            <div className="tw-absolute tw-bottom-[-2px] tw-right-[-2px] tw-size-3.5 tw-flex tw-items-center tw-justify-center tw-bg-iron-950 tw-rounded-full tw-shadow-lg">
              <svg
                className="tw-size-2.5 tw-flex-shrink-0 tw-text-[#E8D48A]"
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 576 512"
              >
                <path
                  fill="currentColor"
                  d="M400 0L176 0c-26.5 0-48.1 21.8-47.1 48.2c.2 5.3 .4 10.6 .7 15.8L24 64C10.7 64 0 74.7 0 88c0 92.6 33.5 157 78.5 200.7c44.3 43.1 98.3 64.8 138.1 75.8c23.4 6.5 39.4 26 39.4 45.6c0 20.9-17 37.9-37.9 37.9L192 448c-17.7 0-32 14.3-32 32s14.3 32 32 32l192 0c17.7 0 32-14.3 32-32s-14.3-32-32-32l-26.1 0C337 448 320 431 320 410.1c0-19.6 15.9-39.2 39.4-45.6c39.9-11 93.9-32.7 138.2-75.8C542.5 245 576 180.6 576 88c0-13.3-10.7-24-24-24L446.4 64c.3-5.2 .5-10.4 .7-15.8C448.1 21.8 426.5 0 400 0zM48.9 112l84.4 0c9.1 90.1 29.2 150.3 51.9 190.6c-24.9-11-50.8-26.5-73.2-48.3c-32-31.1-58-76-63-142.3zM464.1 254.3c-22.4 21.8-48.3 37.3-73.2 48.3c22.7-40.3 42.8-100.5 51.9-190.6l84.4 0c-5.1 66.3-31.1 111.2-63 142.3z"
                />
              </svg>
            </div>
          )}
          {!isActive && haveNewDrops && (
            <div className="tw-absolute tw-top-[-4px] tw-right-[-4px] tw-bg-indigo-500 tw-text-white tw-rounded-full tw-h-4 tw-min-w-4 tw-flex tw-items-center tw-justify-center tw-text-[10px] tw-font-medium tw-px-1 tw-shadow-sm">
              {newDropsCounts[wave.id]}
            </div>
          )}
        </div>
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

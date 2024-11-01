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
    <div className="tw-flex tw-px-5">
      <Link
        href={getHref(wave.id)}
        onMouseEnter={() => onHover(wave.id)}
        onClick={onLinkClick}
        className={`tw-flex tw-relative tw-items-center tw-flex-1 tw-space-x-3 tw-no-underline tw-py-2 tw-group ${
          isActive
            ? "tw-text-primary-400 hover:tw-text-primary-400"
            : "tw-text-iron-200 hover:tw-text-iron-300"
        } `}
      >
        <div
          className={`tw-relative tw-size-8 tw-rounded-full tw-overflow-hidden tw-transition tw-duration-300 group-hover:tw-brightness-110 desktop-hover:group-hover:tw-ring-2 desktop-hover:group-hover:tw-ring-primary-400 ${
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
        <div className="tw-flex-1 tw-min-w-0">
          <div className="tw-font-medium tw-truncate tw-text-sm">
            {wave.name}
          </div>
          <div className="tw-mt-0.5 tw-text-xs tw-text-iron-500">
            <span className="tw-pr-1">Last drop:</span>
            <span className="tw-text-iron-400">
              {getTimeAgoShort(wave.metrics.latest_drop_timestamp)}
            </span>
          </div>
        </div>
      </Link>
      <Tippy content="Go to wave" disabled={isMobile}>
        <Link
          href={`/waves/${wave.id}`}
          className="tw-z-10 tw-mt-1.5 tw-size-7 tw-rounded-lg tw-bg-iron-800 tw-flex tw-items-center tw-justify-center tw-border-0 tw-flex-shrink-0 tw-text-iron-400 desktop-hover:hover:tw-text-iron-50 tw-transition tw-duration-300 tw-ease-out hover:tw-bg-iron-700 focus-visible:tw-outline-none focus-visible:tw-ring-1 focus-visible:tw-ring-primary-400"
          aria-label="Open chat"
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
              d="M2.25 12.76c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 0 1 1.037-.443 48.282 48.282 0 0 0 5.68-.494c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z"
            />
          </svg>
        </Link>
      </Tippy>
    </div>
  );
};

export default BrainLeftSidebarWave;

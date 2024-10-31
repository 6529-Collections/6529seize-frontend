import React from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { ApiWave } from "../../../../generated/models/ApiWave";
import {
  getScaledImageUri,
  ImageScale,
} from "../../../../helpers/image.helpers";
import { usePrefetchWaveData } from "../../../../hooks/usePrefetchWaveData";
import Tippy from "@tippyjs/react";

interface BrainLeftSidebarSearchWaveItemProps {
  readonly wave: ApiWave;
  readonly onClose: () => void;
}

const BrainLeftSidebarSearchWaveItem: React.FC<
  BrainLeftSidebarSearchWaveItemProps
> = ({ wave, onClose }) => {
  const router = useRouter();
  const prefetchWaveData = usePrefetchWaveData();

  const getHref = (waveId: string) => {
    const currentWaveId = router.query.wave as string | undefined;
    if (currentWaveId === waveId) {
      return "/my-stream";
    }
    return `/my-stream?wave=${waveId}`;
  };

  const onHover = (waveId: string) => {
    if (waveId === router.query.wave) return;
    prefetchWaveData(waveId);
  };

  const isActive = wave.id === router.query.wave;

  const onLinkClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    router.push(getHref(wave.id), undefined, { shallow: true });
    onClose();
  };
  return (
    <li className="tw-px-2 tw-h-full tw-flex tw-items-center tw-justify-between tw-gap-x-2 hover:tw-bg-iron-800 tw-rounded-lg">
      <Link
        href={getHref(wave.id)}
        onClick={onLinkClick}
        onMouseEnter={() => onHover(wave.id)}
        className="tw-no-underline md:hover:tw-bg-iron-800 tw-py-2 tw-w-full tw-h-full tw-bg-transparent tw-border-none tw-text-left tw-flex tw-items-center tw-justify-between tw-text-iron-50 tw-rounded-lg tw-relative tw-cursor-pointer tw-select-none tw-px-1 hover:tw-bg-iron-800 focus-visible:tw-outline-none focus-visible:tw-ring-1 focus-visible:tw-ring-primary-400"
      >
        <div className="tw-w-full tw-flex tw-justify-between tw-items-center">
          <div className="tw-flex tw-space-x-3 tw-items-center">
            {wave.picture && (
              <div className="tw-h-8 tw-w-8 tw-rounded-full tw-overflow-hidden tw-ring-2 tw-ring-inset tw-ring-white/10 tw-bg-iron-900">
                <img
                  src={getScaledImageUri(wave.picture, ImageScale.W_AUTO_H_50)}
                  alt="Wave Picture"
                  className="tw-bg-transparent tw-max-w-full tw-max-h-full tw-h-auto tw-w-auto tw-object-cover"
                />
              </div>
            )}
            <div className="tw-max-w-[14rem] tw-truncate">
              <p className="tw-mb-0 tw-text-sm tw-font-semibold tw-text-iron-50 tw-truncate tw-whitespace-nowrap">
                {wave.name}
              </p>
              <p className="tw-mb-0 tw-text-xs tw-font-medium tw-text-iron-400 tw-truncate tw-whitespace-nowrap">
                By {wave.author.handle}
              </p>
            </div>
          </div>
          {isActive && (
            <svg
              className="tw-flex-shrink-0 tw-size-5 tw-text-primary-400 tw-transition tw-duration-300 tw-ease-out"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M20 6L9 17L4 12"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </div>
      </Link>
      <Tippy content="Go to wave">
        <Link
          href={`/waves/${wave.id}`}
          className="tw-size-7 sm:tw-size-6 desktop-hover:hover:tw-bg-iron-700 tw-bg-transparent tw-flex tw-items-center tw-justify-center tw-border-0 tw-flex-shrink-0 tw-rounded-full tw-text-iron-400 desktop-hover:hover:tw-text-iron-50 tw-transition tw-duration-300 tw-ease-out focus-visible:tw-outline-none focus-visible:tw-ring-1 focus-visible:tw-ring-primary-400"
          aria-label="Open chat"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            stroke="currentColor"
            aria-hidden="true"
            className="tw-size-5 sm:tw-size-4 tw-flex-shrink-0"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M2.25 12.76c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 0 1 1.037-.443 48.282 48.282 0 0 0 5.68-.494c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z"
            />
          </svg>
        </Link>
      </Tippy>
    </li>
  );
};

export default BrainLeftSidebarSearchWaveItem;

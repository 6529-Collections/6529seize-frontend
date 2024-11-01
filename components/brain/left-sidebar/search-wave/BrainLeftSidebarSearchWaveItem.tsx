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
          className="tw-mt-1.5 tw-no-underline tw-rounded-lg tw-bg-iron-800 tw-flex tw-items-center tw-justify-center tw-border-0 tw-flex-shrink-0 tw-text-iron-400 desktop-hover:hover:tw-text-iron-50 tw-transition tw-duration-300 tw-ease-out hover:tw-bg-iron-700 focus-visible:tw-outline-none focus-visible:tw-ring-1 focus-visible:tw-ring-primary-400 tw-size-6"
        >
          <svg
            className="tw-size-4 tw-flex-shrink-0"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 0 1-.825-.242m9.345-8.334a2.126 2.126 0 0 0-.476-.095 48.64 48.64 0 0 0-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0 0 11.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155"
            />
          </svg>
        </Link>
      </Tippy>
    </li>
  );
};

export default BrainLeftSidebarSearchWaveItem;

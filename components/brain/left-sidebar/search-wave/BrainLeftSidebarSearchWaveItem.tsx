import React from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { ApiWave } from "../../../../generated/models/ApiWave";
import {
  getScaledImageUri,
  ImageScale,
} from "../../../../helpers/image.helpers";
import { usePrefetchWaveData } from "../../../../hooks/usePrefetchWaveData";

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
    <li className="tw-h-full">
      <Link
        href={getHref(wave.id)}
        onClick={onLinkClick}
        onMouseEnter={() => onHover(wave.id)}
        className="tw-no-underline hover:tw-bg-iron-800 tw-py-2 tw-w-full tw-h-full tw-bg-transparent tw-border-none tw-text-left tw-flex tw-items-center tw-justify-between tw-text-iron-50 tw-rounded-lg tw-relative tw-cursor-pointer tw-select-none tw-px-2 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-primary-400 tw-transition tw-duration-300 tw-ease-out"
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
            <div className="tw-w-[14rem] tw-truncate">
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
    </li>
  );
};

export default BrainLeftSidebarSearchWaveItem;

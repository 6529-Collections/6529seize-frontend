import React from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { ApiWave } from "../../../../generated/models/ApiWave";
import { usePrefetchWaveData } from "../../../../hooks/usePrefetchWaveData";
import { ApiWaveType } from "../../../../generated/models/ApiWaveType";
import { useWave } from "../../../../hooks/useWave";
import WavePicture from "../../../waves/WavePicture";
import { useMyStream } from "../../../../contexts/wave/MyStreamContext";
interface BrainLeftSidebarSearchWaveItemProps {
  readonly wave: ApiWave;
  readonly onClose: () => void;
}

const BrainLeftSidebarSearchWaveItem: React.FC<
  BrainLeftSidebarSearchWaveItemProps
> = ({ wave, onClose }) => {
  const router = useRouter();
  const prefetchWaveData = usePrefetchWaveData();
  const { registerWave } = useMyStream();
  const isDropWave = wave.wave.type !== ApiWaveType.Chat;
  const { isDm } = useWave(wave);

  const getHref = (waveId: string) => {
    const base = isDm ? `/my-stream?view=messages&wave=${waveId}` : `/my-stream?wave=${waveId}`;
    const currentWaveId = router.query.wave as string | undefined;
    if (currentWaveId === waveId) {
      return "/my-stream";
    }
    return base;
  };
  const isActive = wave.id === router.query.wave;

  const onLinkClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    router.push(getHref(wave.id), undefined, { shallow: true });
    onClose();
  };

  const onWaveHover = (waveId: string) => {
    if (waveId !== router.query.wave) {
      registerWave(waveId);
      prefetchWaveData(waveId);
    }
  };
  return (
    <li className="tw-px-2 tw-h-full tw-flex tw-items-center tw-justify-between tw-gap-x-2 hover:tw-bg-iron-800 tw-rounded-lg">
      <Link
        href={getHref(wave.id)}
        onClick={onLinkClick}
        onMouseEnter={() => onWaveHover(wave.id)}
        className="tw-no-underline md:hover:tw-bg-iron-800 tw-py-2 tw-w-full tw-h-full tw-bg-transparent tw-border-none tw-text-left tw-flex tw-items-center tw-justify-between tw-text-iron-50 tw-rounded-lg tw-relative tw-cursor-pointer tw-select-none tw-px-1 hover:tw-bg-iron-800 focus-visible:tw-outline-none focus-visible:tw-ring-1 focus-visible:tw-ring-primary-400"
      >
        <div className="tw-w-full tw-flex tw-justify-between tw-items-center">
          <div className="tw-flex tw-space-x-3 tw-items-center">
            <div className="tw-relative">
              <div
                className={`tw-h-8 tw-w-8 tw-rounded-full tw-overflow-hidden ${
                  isDropWave
                    ? "tw-ring-2 tw-ring-blue-400/40"
                    : "tw-ring-2 tw-ring-inset tw-ring-white/10"
                } tw-bg-iron-900`}
              >
                <WavePicture
                  name={wave.name}
                  picture={wave.picture}
                  contributors={wave.contributors_overview.map((c) => ({
                    pfp: c.contributor_pfp,
                  }))}
                />
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
            </div>
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
    </li>
  );
};

export default BrainLeftSidebarSearchWaveItem;

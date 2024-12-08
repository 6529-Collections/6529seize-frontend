import React from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import Tippy from "@tippyjs/react";
import { usePrefetchWaveData } from "../../../hooks/usePrefetchWaveData";
import { useWaveData } from "../../../hooks/useWaveData";
import useIsMobileDevice from "../../../hooks/isMobileDevice";
import { ApiWaveType } from "../../../generated/models/ObjectSerializer";

interface BrainContentPinnedWaveProps {
  readonly waveId: string;
  readonly active: boolean;
  readonly onMouseEnter: (waveId: string) => void;
  readonly onMouseLeave: () => void;
  readonly onRemove: (waveId: string) => void;
}

const BrainContentPinnedWave: React.FC<BrainContentPinnedWaveProps> = ({
  waveId,
  active,
  onMouseEnter,
  onMouseLeave,
  onRemove,
}) => {
  const router = useRouter();
  const prefetchWaveData = usePrefetchWaveData();
  const { data: wave } = useWaveData(waveId);
  const isMobile = useIsMobileDevice();
  const isDropWave = wave && wave.wave.type !== ApiWaveType.Chat;
  const getHref = (waveId: string) => {
    const currentWaveId = router.query.wave as string | undefined;
    if (currentWaveId === waveId) {
      return "/my-stream";
    }
    return `/my-stream?wave=${waveId}`;
  };

  const onLinkClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    onMouseLeave();
    router.push(getHref(waveId), undefined, { shallow: true });
  };

  const onHover = () => {
    onMouseEnter(waveId);
    if (waveId === router.query.wave) return;
    prefetchWaveData(waveId);
  };

  const onRemoveClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    onRemove(waveId);
  };

  return (
    <div
      className={`tw-pt-1 tw-relative tw-group tw-transition-all tw-duration-300 ${
        !active ? "tw-opacity-70" : ""
      }`}
      onMouseEnter={onHover}
      onMouseLeave={onMouseLeave}
    >
      <Link
        href={getHref(waveId)}
        onClick={onLinkClick}
        className="tw-flex tw-flex-col tw-items-center tw-no-underline"
      >
        <Tippy
          disabled={isMobile}
          content={<span className="tw-text-xs">{wave?.name ?? ""}</span>}
          placement="top"
          theme="dark"
        >
          <div
            className={`tw-relative tw-size-16 md:tw-size-14 tw-rounded-full tw-flex tw-items-center tw-justify-center tw-cursor-pointer tw-transition-all tw-duration-300 ${
              active ? "tw-bg-indigo-900" : "tw-bg-iron-800"
            }`}
          >
            <div
              className={`tw-absolute tw-inset-0 tw-rounded-full tw-bg-gradient-to-tr tw-from-indigo-300 tw-via-blue-500 tw-to-indigo-600 tw-transition-all tw-duration-300 ${
                active ? "tw-opacity-100" : "tw-opacity-0"
              }`}
            ></div>
            <div className={`tw-absolute tw-inset-0.5 tw-rounded-full tw-bg-iron-900 tw-flex tw-items-center tw-justify-center ${
              isDropWave ? "tw-ring-2 tw-ring-blue-400/40" : ""
            }`}>
              <div className="tw-absolute tw-inset-0.5 tw-rounded-full tw-overflow-hidden">
                {wave?.picture ? (
                  <img
                    src={wave.picture}
                    alt={wave.name || "Wave picture"}
                    className="tw-w-full tw-h-full tw-object-cover"
                  />
                ) : (
                  <div className="tw-w-full tw-h-full tw-bg-gradient-to-br tw-from-iron-900 tw-to-iron-800"></div>
                )}
                {isDropWave && (
                  <div className="tw-absolute tw-inset-0 tw-border-2 tw-border-blue-400/40 tw-rounded-full" />
                )}
              </div>
            </div>
            {isDropWave && (
              <div className="tw-absolute tw-bottom-0 tw-right-0 tw-size-5 tw-flex tw-items-center tw-justify-center tw-bg-iron-950 tw-rounded-full tw-shadow-lg">
                <svg
                  className="tw-size-3.5 tw-flex-shrink-0 tw-text-[#E8D48A]"
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
            <button
              type="button"
              onClick={onRemoveClick}
              aria-label="Remove wave"
              className="tw-border-0 tw-bg-iron-800 tw-rounded-full tw-size-5 tw-p-0 -tw-top-1 -tw-right-5 tw-absolute tw-flex tw-items-center tw-justify-center tw-text-iron-400 tw-cursor-pointer tw-opacity-100 desktop-hover:tw-opacity-0 desktop-hover:group-hover:tw-opacity-100 desktop-hover:hover:tw-text-red md:hover:tw-bg-iron-700 tw-transition-all tw-duration-300"
            >
              <svg
                className="tw-size-5 tw-flex-shrink-0"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M17 7L7 17M7 7L17 17"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        </Tippy>
      </Link>
    </div>
  );
};

export default BrainContentPinnedWave;

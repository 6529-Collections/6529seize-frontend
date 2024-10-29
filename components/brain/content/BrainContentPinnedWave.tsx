import React from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import Tippy from "@tippyjs/react";
import { usePrefetchWaveData } from "../../../hooks/usePrefetchWaveData";
import { useWaveData } from "../../../hooks/useWaveData";
import useIsMobileDevice from "../../../hooks/isMobileDevice";

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
            <div className="tw-absolute tw-inset-0.5 tw-rounded-full tw-bg-iron-900 tw-flex tw-items-center tw-justify-center">
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
              </div>
            </div>
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

import React from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { usePrefetchWaveData } from "../../../hooks/usePrefetchWaveData";
import { useWaveData } from "../../../hooks/useWaveData";

interface BrainContentPinnedWaveProps {
  readonly waveId: string;
  readonly active: boolean;
  readonly onMouseEnter: (waveId: string) => void;
  readonly onMouseLeave: () => void;
}

const BrainContentPinnedWave: React.FC<BrainContentPinnedWaveProps> = ({
  waveId,
  active,
  onMouseEnter,
  onMouseLeave,
}) => {
  const router = useRouter();
  const prefetchWaveData = usePrefetchWaveData();
  const { data: wave } = useWaveData(waveId);

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

  return (
    <div
      className={`tw-pt-1 tw-relative tw-group tw-transition-all tw-duration-300 ${
        !active ? "tw-opacity-60" : ""
      }`}
      onMouseEnter={onHover}
      onMouseLeave={onMouseLeave}
    >
      <Link
        href={getHref(waveId)}
        onClick={onLinkClick}
        className="tw-flex tw-flex-col tw-items-center tw-no-underline"
      >
        <div
          className={`tw-relative tw-w-14 tw-h-14 tw-rounded-full tw-flex tw-items-center tw-justify-center tw-cursor-pointer tw-transition-all tw-duration-300 ${
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
              {wave?.picture && (
                <img
                  src={wave.picture}
                  alt={wave.name || "Wave picture"}
                  className="tw-w-full tw-h-full tw-object-cover"
                />
              )}
            </div>
          </div>
          <button
            type="button"
            aria-label="Remove wave"
            className="tw-border-0 tw-bg-iron-800 tw-rounded-full tw-size-5 tw-p-0 -tw-top-1 -tw-right-5 tw-absolute tw-flex tw-items-center tw-justify-center tw-text-iron-400 tw-cursor-pointer tw-opacity-0 group-hover:tw-opacity-100 hover:tw-text-red hover:tw-bg-iron-700 tw-transition-all tw-duration-300"
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
        <span
          className={`tw-mt-2 tw-text-[11px] tw-font-medium tw-text-center tw-truncate tw-max-w-[7rem] tw-transition-all tw-duration-300 ${
            active ? "tw-text-primary-300" : "tw-text-iron-500"
          }`}
        >
          {wave?.name ?? ""}
        </span>
      </Link>
    </div>
  );
};

export default BrainContentPinnedWave;

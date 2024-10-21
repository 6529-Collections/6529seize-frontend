import React from "react";
import { ApiWave } from "../../../../generated/models/ApiWave";
import Link from "next/link";
import { useRouter } from "next/router";
import { getTimeAgoShort } from "../../../../helpers/Helpers";
import { usePrefetchWaveData } from "../../../../hooks/usePrefetchWaveData";

interface BrainLeftSidebarWaveProps {
  readonly wave: ApiWave;
}

const BrainLeftSidebarWave: React.FC<BrainLeftSidebarWaveProps> = ({
  wave,
}) => {
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
  };

  return (
    <div
      key={wave.id}
      className={`tw-py-2 tw-px-5 ${
        isActive ? "tw-bg-primary-300/5 tw-text-iron-50" : ""
      } `}
    >
      <Link
        href={getHref(wave.id)}
        onMouseEnter={() => onHover(wave.id)}
        onClick={onLinkClick}
        className="tw-ml-1 tw-no-underline tw-flex tw-items-center tw-text-iron-200 tw-font-medium tw-text-sm hover:tw-text-iron-400 tw-transition tw-duration-300 tw-ease-out group"
      >
        <div
          className={`tw-mr-3 tw-flex-shrink-0 tw-size-8 tw-rounded-full tw-relative ${
            isActive
              ? "tw-ring-1 tw-ring-inset tw-ring-primary-400"
              : "tw-ring-1 tw-ring-inset tw-ring-white/10"
          } ${!wave.picture ? "tw-bg-gradient-to-br tw-from-iron-900 tw-to-iron-800" : ""}`}
        >
          {wave.picture && (
            <img
              src={wave.picture}
              alt={wave.name}
              className="tw-w-full tw-h-full tw-rounded-full tw-object-contain"
            />
          )}
        </div>
        <div className="tw-flex tw-justify-between tw-gap-x-2 tw-w-full">
          <span>{wave.name}</span>
          <div className="tw-mt-0.5 tw-text-right tw-whitespace-nowrap tw-text-xs tw-text-iron-400">
            <span>{getTimeAgoShort(wave.metrics.latest_drop_timestamp)}</span>
          </div>
        </div>
      </Link>
    </div>
  );
};

export default BrainLeftSidebarWave;

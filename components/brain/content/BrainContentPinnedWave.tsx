import React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ApiWave } from "../../../generated/models/ApiWave";
import { commonApiFetch } from "../../../services/api/common-api";
import { QueryKey } from "../../react-query-wrapper/ReactQueryWrapper";
import Tippy from "@tippyjs/react";
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
    <Tippy content={wave?.name || ""}>
      <div
        className={`tw-relative tw-group ${!active ? "tw-opacity-80" : ""}`}
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
            {active && (
              <div className="tw-absolute tw-inset-0 tw-rounded-full tw-bg-gradient-to-tr tw-from-indigo-400 tw-via-blue-500 tw-to-indigo-600 tw-animate-gradient-xy"></div>
            )}
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
          </div>
        </Link>
      </div>
    </Tippy>
  );
};

export default BrainContentPinnedWave;

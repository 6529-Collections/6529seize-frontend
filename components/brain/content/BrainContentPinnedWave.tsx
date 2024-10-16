import React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ApiWave } from "../../../generated/models/ApiWave";
import { commonApiFetch } from "../../../services/api/common-api";
import { QueryKey } from "../../react-query-wrapper/ReactQueryWrapper";
import Tippy from "@tippyjs/react";

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
  const { data: wave } = useQuery<ApiWave>({
    queryKey: [QueryKey.WAVE, { wave_id: waveId }],
    queryFn: async () =>
      await commonApiFetch<ApiWave>({
        endpoint: `waves/${waveId}`,
      }),
    staleTime: 60000,
  });

  return (
 <Tippy content={wave?.name || ""}>
     <div
      className={`tw-relative tw-group ${!active ? "tw-opacity-80" : ""}`}
      onMouseEnter={() => onMouseEnter(waveId)}
      onMouseLeave={onMouseLeave}
    >
      <Link
        href={`/my-stream?wave=${waveId}`}
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

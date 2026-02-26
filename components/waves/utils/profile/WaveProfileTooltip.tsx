import { useMemo } from "react";

import WavePicture from "@/components/waves/WavePicture";
import type { ApiWaveMin } from "@/generated/models/ApiWaveMin";
import { getTimeAgoShort, numberWithCommas } from "@/helpers/Helpers";
import { useWaveById } from "@/hooks/useWaveById";

interface WaveProfileTooltipProps {
  readonly waveId: string;
  readonly initialWave?: ApiWaveMin | null;
  readonly fallbackName?: string | undefined;
}

const formatNumber = (value?: number | null) =>
  typeof value === "number" ? numberWithCommas(value) : "--";

export default function WaveProfileTooltip({
  waveId,
  initialWave = null,
  fallbackName,
}: WaveProfileTooltipProps) {
  const { wave } = useWaveById(waveId);

  const waveName =
    wave?.name ?? initialWave?.name ?? fallbackName ?? `Wave ${waveId}`;
  const wavePicture = wave?.picture ?? initialWave?.picture ?? null;
  const authorHandle =
    wave?.author.handle ?? wave?.author.primary_address ?? null;

  const contributors = useMemo(
    () =>
      wave?.contributors_overview
        .map((contributor) => ({
          pfp: contributor.contributor_pfp,
        }))
        .filter((contributor) => !!contributor.pfp) ?? [],
    [wave?.contributors_overview]
  );

  const dropsCount = wave?.metrics.drops_count;
  const subscribersCount = wave?.metrics.subscribers_count;
  const latestDropTimestamp = wave?.metrics.latest_drop_timestamp;
  const statsReady = Boolean(wave?.metrics);
  const hasDrops = typeof dropsCount === "number" && dropsCount > 0;
  const lastDropLabel =
    hasDrops && typeof latestDropTimestamp === "number"
      ? `Last drop ${getTimeAgoShort(latestDropTimestamp)}`
      : "No drops yet";

  return (
    <div className="tailwind-scope tw-min-w-[260px] tw-max-w-[320px] tw-bg-iron-950 tw-p-4">
      <div className="tw-flex tw-items-start tw-gap-3">
        <div className="tw-h-10 tw-w-10 tw-flex-shrink-0">
          <WavePicture
            name={waveName}
            picture={wavePicture}
            contributors={contributors}
          />
        </div>
        <div className="tw-flex tw-min-w-0 tw-flex-1 tw-flex-col">
          <span className="tw-truncate tw-text-sm tw-font-semibold tw-text-iron-50">
            {waveName}
          </span>
          {authorHandle && (
            <span className="tw-truncate tw-text-xs tw-text-iron-400">
              @{authorHandle}
            </span>
          )}
        </div>
      </div>

      <div className="tw-mt-3">
        {statsReady ? (
          <>
            <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-x-4 tw-gap-y-1 tw-text-xs tw-text-iron-400">
              <span className="tw-inline-flex tw-items-center tw-gap-1">
                <span className="tw-font-medium tw-text-iron-100">
                  {formatNumber(dropsCount)}
                </span>
                <span className="tw-text-iron-500">
                  {dropsCount === 1 ? "Drop" : "Drops"}
                </span>
              </span>
              <span className="tw-inline-flex tw-items-center tw-gap-1">
                <span className="tw-font-medium tw-text-iron-100">
                  {formatNumber(subscribersCount)}
                </span>
                <span className="tw-text-iron-500">Joined</span>
              </span>
            </div>
            <div className="tw-mt-2 tw-text-[11px] tw-text-iron-500">
              {lastDropLabel}
            </div>
          </>
        ) : (
          <div className="tw-h-4 tw-w-40 tw-animate-pulse tw-rounded tw-bg-iron-800/60" />
        )}
      </div>
    </div>
  );
}

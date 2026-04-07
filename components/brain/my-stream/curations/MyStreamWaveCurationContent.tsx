"use client";

import CircleLoader, {
  CircleLoaderSize,
} from "@/components/distribution-plan-tool/common/CircleLoader";
import CommonIntersectionElement from "@/components/utils/CommonIntersectionElement";
import Drop, { DropLocation } from "@/components/waves/drops/Drop";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { useWaveDrops } from "@/hooks/useWaveDrops";
import type { ApiWave } from "@/generated/models/ApiWave";
import { useMemo, type ReactNode } from "react";

interface MyStreamWaveCurationContentProps {
  readonly wave: ApiWave;
  readonly curationId: string;
  readonly curationName?: string | null | undefined;
  readonly onDropClick: (drop: ExtendedDrop) => void;
}

export default function MyStreamWaveCurationContent({
  wave,
  curationId,
  curationName,
  onDropClick,
}: MyStreamWaveCurationContentProps) {
  const { drops, fetchNextPage, hasNextPage, isFetching, isFetchingNextPage } =
    useWaveDrops({
      waveId: wave.id,
      curationId,
    });

  const isInitialLoading = isFetching && drops.length === 0;

  const handleBottomIntersection = async (isIntersecting: boolean) => {
    if (!isIntersecting || !hasNextPage || isFetchingNextPage) {
      return;
    }

    await fetchNextPage();
  };

  const trimmedCurationName = curationName?.trim();
  const curationTitle =
    trimmedCurationName && trimmedCurationName.length > 0
      ? trimmedCurationName
      : "Curation";

  const renderedDrops = useMemo(
    () =>
      drops.map((drop, index) => (
        <Drop
          key={drop.stableKey}
          drop={drop}
          previousDrop={index > 0 ? (drops[index - 1] ?? null) : null}
          nextDrop={drops[index + 1] ?? null}
          showWaveInfo={false}
          activeDrop={null}
          showReplyAndQuote={false}
          location={DropLocation.WAVE}
          dropViewDropId={null}
          onReply={() => {}}
          onReplyClick={() => {}}
          onQuoteClick={() => {}}
          onDropContentClick={onDropClick}
        />
      )),
    [drops, onDropClick]
  );

  let content: ReactNode;

  if (isInitialLoading) {
    content = (
      <div className="tw-flex tw-flex-1 tw-items-center tw-justify-center">
        <CircleLoader size={CircleLoaderSize.XXLARGE} />
      </div>
    );
  } else if (drops.length === 0) {
    content = (
      <div className="tw-flex tw-flex-1 tw-items-center tw-justify-center tw-px-6">
        <div className="tw-max-w-md tw-rounded-2xl tw-border tw-border-dashed tw-border-iron-700 tw-bg-iron-950/70 tw-px-6 tw-py-8 tw-text-center">
          <p className="tw-mb-2 tw-text-base tw-font-semibold tw-text-iron-100">
            {curationTitle} is empty
          </p>
          <p className="tw-mb-0 tw-text-sm tw-text-iron-400">
            This tab will show the drops added to this curation.
          </p>
        </div>
      </div>
    );
  } else {
    content = (
      <div className="tw-flex tw-min-h-0 tw-flex-1 tw-flex-col tw-px-2 tw-py-4 sm:tw-px-4">
        {renderedDrops}
        {(hasNextPage || isFetchingNextPage) && (
          <div className="tw-py-4">
            {isFetchingNextPage ? (
              <div className="tw-flex tw-justify-center">
                <CircleLoader size={CircleLoaderSize.MEDIUM} />
              </div>
            ) : (
              <CommonIntersectionElement
                onIntersection={handleBottomIntersection}
              />
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="tw-flex tw-h-full tw-w-full tw-flex-col tw-overflow-y-auto tw-overflow-x-hidden tw-scrollbar-thin tw-scrollbar-track-iron-800 tw-scrollbar-thumb-iron-500 desktop-hover:hover:tw-scrollbar-thumb-iron-300">
      {content}
    </div>
  );
}

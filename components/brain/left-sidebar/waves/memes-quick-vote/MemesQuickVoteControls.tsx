"use client";

import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { formatNumberWithCommas } from "@/helpers/Helpers";
import WaveDropAuthorPfp from "@/components/waves/drops/WaveDropAuthorPfp";
import WaveDropTime from "@/components/waves/drops/time/WaveDropTime";
import MemesQuickVoteActionBar from "./MemesQuickVoteActionBar";

interface MemesQuickVoteControlsProps {
  readonly customValue: string;
  readonly drop: ExtendedDrop;
  readonly isCustomOpen: boolean;
  readonly isSubmitting: boolean;
  readonly latestUsedAmount: number | null;
  readonly remainingCount: number;
  readonly quickAmounts: readonly number[];
  readonly uncastPower: number | null;
  readonly votingLabel: string | null;
  readonly onCustomChange: (value: string) => void;
  readonly onCustomSubmit: () => Promise<void>;
  readonly onOpenCustom: () => void;
  readonly onSkip: () => void;
  readonly onVoteAmount: (amount: number) => Promise<void>;
}

export default function MemesQuickVoteControls({
  customValue,
  drop,
  isCustomOpen,
  isSubmitting,
  latestUsedAmount,
  remainingCount,
  quickAmounts,
  uncastPower,
  votingLabel,
  onCustomChange,
  onCustomSubmit,
  onOpenCustom,
  onSkip,
  onVoteAmount,
}: MemesQuickVoteControlsProps) {
  const title =
    drop.metadata.find((entry) => entry.data_key === "title")?.data_value ??
    "Untitled submission";
  const description =
    drop.metadata.find((entry) => entry.data_key === "description")
      ?.data_value ?? "";
  const authorLabel = drop.author.handle ?? drop.author.primary_address;

  return (
    <div
      data-testid="quick-vote-controls-desktop-context"
      className="tw-flex tw-shrink-0 tw-flex-col tw-gap-0 sm:tw-h-full sm:tw-min-h-0 sm:tw-overflow-hidden sm:tw-bg-[#0a0a0a]/30"
    >
      <div className="tw-hidden tw-shrink-0 tw-flex-wrap tw-gap-2 tw-px-8 sm:tw-flex sm:tw-pb-6 sm:tw-pt-6">
        <span className="tw-rounded-full tw-border tw-border-solid tw-border-white/5 tw-bg-white/[0.03] tw-px-4 tw-py-1.5 tw-text-[13px] tw-font-bold tw-text-zinc-300 tw-shadow-sm tw-backdrop-blur-md">
          {formatNumberWithCommas(remainingCount)} unexplored
        </span>
      </div>

      <div className="tw-hidden tw-min-h-0 tw-flex-1 tw-overflow-y-auto [-ms-overflow-style:none] [scrollbar-width:none] sm:tw-flex sm:tw-px-8 sm:tw-pb-6 [&::-webkit-scrollbar]:tw-hidden">
        <div className="tw-flex tw-min-h-full tw-w-full tw-flex-col">
          <div className="tw-flex tw-w-full tw-flex-col tw-gap-5 tw-rounded-xl tw-border tw-border-solid tw-border-white/10 tw-bg-white/[0.03] tw-p-5 tw-shadow-[0_24px_60px_rgba(0,0,0,0.2)] tw-backdrop-blur-xl sm:tw-p-6">
            <div className="tw-flex tw-items-center tw-gap-3">
              <WaveDropAuthorPfp drop={drop} />
              <div className="tw-min-w-0 tw-flex-1">
                <div className="tw-mb-2.5 tw-flex tw-items-center tw-gap-1.5">
                  <span className="tw-truncate tw-text-md tw-font-bold tw-leading-none tw-tracking-tight tw-text-white">
                    {authorLabel}
                  </span>
                  <span className="tw-inline-flex tw-items-center tw-gap-1.5 tw-text-zinc-500 [&_p]:tw-mb-0">
                    <span className="tw-text-[12px] tw-font-medium tw-leading-none">
                      •
                    </span>
                    <WaveDropTime timestamp={drop.created_at} />
                  </span>
                </div>
                <p className="tw-mb-0 tw-truncate tw-text-[9px] tw-font-semibold tw-uppercase tw-leading-none tw-tracking-widest tw-text-zinc-500">
                  {drop.wave.name}
                </p>
              </div>
            </div>

            <div className="tw-flex tw-min-h-0 tw-flex-1 tw-flex-col">
              <h2 className="tw-mb-3 tw-mt-4 tw-line-clamp-3 tw-text-2xl tw-font-semibold tw-leading-tight tw-tracking-tight tw-text-white sm:tw-text-3xl">
                {title}
              </h2>

              {description && (
                <p className="tw-mb-0 tw-line-clamp-4 tw-text-sm tw-font-medium tw-leading-relaxed tw-text-zinc-400 sm:tw-text-md">
                  {description}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <MemesQuickVoteActionBar
        customValue={customValue}
        isCustomOpen={isCustomOpen}
        isSubmitting={isSubmitting}
        latestUsedAmount={latestUsedAmount}
        quickAmounts={quickAmounts}
        uncastPower={uncastPower}
        votingLabel={votingLabel}
        onCustomChange={onCustomChange}
        onCustomSubmit={onCustomSubmit}
        onOpenCustom={onOpenCustom}
        onSkip={onSkip}
        onVoteAmount={onVoteAmount}
      />
    </div>
  );
}

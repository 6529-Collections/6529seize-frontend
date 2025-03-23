import React, { useEffect } from "react";
import { useRouter } from "next/router";
import { usePinnedWaves } from "../../../../../hooks/usePinnedWaves";
import { useWaveData } from "../../../../../hooks/useWaveData";
import BrainLeftSidebarWave from "../BrainLeftSidebarWave";

interface RecentWavesListProps {
  readonly activeWaveId: string | null;
}

const RecentWavesList: React.FC<RecentWavesListProps> = ({
  activeWaveId
}) => {
  const router = useRouter();
  const { pinnedIds, addId, removeId } = usePinnedWaves();


  // Add current wave to pinned/recent waves list when it changes
  useEffect(() => {
    const { wave } = router.query;
    if (wave && typeof wave === "string") {
      addId(wave);
    }
  }, [router.query, addId]);

  // Empty state - if no pinned waves
  if (!pinnedIds.length) {
    return null;
  }

  return (
    <div className="tw-mb-4">
      <div className="tw-h-full tw-bg-iron-950 tw-rounded-xl tw-ring-1 tw-ring-inset tw-ring-iron-800 tw-py-4">
        <div className="tw-flex tw-flex-col tw-gap-y-1.5 tw-px-5">
          <div className="tw-flex tw-justify-between tw-items-center">
            <p className="tw-mb-0 tw-text-lg sm:tw-text-xl tw-font-semibold tw-text-iron-200 tw-tracking-tight">
              Recent Waves
            </p>
          </div>
        </div>
        <div className="tw-mt-2 tw-max-h-96 tw-pb-2 tw-overflow-y-auto tw-scrollbar-thin tw-scrollbar-thumb-iron-600 tw-scrollbar-track-iron-900">
          <div className="tw-flex tw-flex-col">
            {pinnedIds.map((id) => (
              <PinnedWaveItem
                key={id}
                waveId={id}
                isActive={id === activeWaveId}
                onRemove={removeId}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper component to fetch and render each pinned wave
interface PinnedWaveItemProps {
  readonly waveId: string;
  readonly isActive: boolean;
  readonly onRemove: (id: string) => void;
}

const PinnedWaveItem: React.FC<PinnedWaveItemProps> = ({
  waveId,
  isActive,
  onRemove,
}) => {
  const router = useRouter();
  const { data: wave, isLoading } = useWaveData(waveId);
  const { addId } = usePinnedWaves();

  // Empty states while loading
  if (isLoading || !wave) {
    return (
      <div className="tw-flex tw-px-5 tw-py-2 tw-animate-pulse">
        <div className="tw-flex tw-flex-1 tw-space-x-3">
          <div className="tw-relative">
            <div className="tw-size-8 tw-rounded-full tw-bg-iron-800"></div>
          </div>
          <div className="tw-flex-1">
            <div className="tw-h-4 tw-w-24 tw-bg-iron-800 tw-rounded"></div>
            <div className="tw-mt-2 tw-h-3 tw-w-32 tw-bg-iron-800 tw-rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  const getHref = (waveId: string) => {
    const currentWaveId = router.query.wave as string | undefined;
    return currentWaveId === waveId
      ? "/my-stream"
      : `/my-stream?wave=${waveId}`;
  };

  const handleRemove = async (id: string) => {
    if (router.query.wave === id) {
      await router.replace("/my-stream", undefined, { shallow: true });
    }
    onRemove(id);
  };

  const resetWaveCount = (id: string) => {
    // When a wave is clicked, move it to the top of the list
    addId(id);
  };

  // Using BrainLeftSidebarWave component with necessary props
  return (
    <div className="tw-group tw-relative">
      <BrainLeftSidebarWave
        wave={wave}
        newDropsCounts={{}} // No new drops count needed for pinned waves
        resetWaveCount={resetWaveCount} // This will move the clicked wave to the top
        isHighlighted={isActive}
      />
      <button
        onClick={() => handleRemove(waveId)}
        className="tw-absolute tw-right-4 tw-top-1/2 tw-transform -tw-translate-y-1/2 tw-bg-transparent tw-border-0 tw-p-1.5 tw-rounded-full tw-text-iron-400 tw-opacity-0 group-hover:tw-opacity-100 hover:tw-text-red-500 tw-transition-opacity tw-duration-200"
        aria-label="Remove from recent waves"
      >
        <svg
          className="tw-w-4 tw-h-4"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M6 18L18 6M6 6L18 18"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </div>
  );
};

export default RecentWavesList;

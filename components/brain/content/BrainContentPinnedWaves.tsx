import React, { useEffect, useState } from "react";
import BrainContentPinnedWave from "./BrainContentPinnedWave";
import { usePinnedWaves } from "../../../hooks/usePinnedWaves";
import { useRouter } from "next/router";

const BrainContentPinnedWaves: React.FC = () => {
  const router = useRouter();
  const { pinnedIds, addId, removeId } = usePinnedWaves();
  const [onHoverWaveId, setOnHoverWaveId] = useState<string | null>(null);

  useEffect(() => {
    const { wave } = router.query;
    if (wave && typeof wave === "string") {
      addId(wave);
    }
  }, [router.query, addId]);

  if (!pinnedIds.length) {
    return null;
  }

  const onRemove = async (waveId: string) => {
    if (router.query.wave === waveId) {
      await router.replace("/my-stream", undefined, { shallow: true });
    }
    removeId(waveId);
  };

  return (
    <div className="tw-flex tw-gap-4 tw-mb-2">
      <div className="tw-flex tw-items-center tw-pb-2 tw-gap-x-6 tw-overflow-x-auto tw-w-full tw-scrollbar-thin tw-scrollbar-thumb-iron-500 tw-scrollbar-track-iron-800 hover:tw-scrollbar-thumb-iron-300">
        {pinnedIds.map((id, i) => (
          <BrainContentPinnedWave
            key={id}
            waveId={id}
            active={router.query.wave === id || onHoverWaveId === id}
            onMouseEnter={setOnHoverWaveId}
            onMouseLeave={() => setOnHoverWaveId(null)}
            onRemove={onRemove}
          />
        ))}
      </div>
    </div>
  );
};

export default BrainContentPinnedWaves;

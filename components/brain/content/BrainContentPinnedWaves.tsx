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
    <div className="tw-relative tw-h-8 tw-mb-2">
      <div className="tw-absolute tw-inset-0 tw-flex tw-items-center tw-overflow-x-auto tw-overflow-y-hidden no-scrollbar tw-scrollbar-thin tw-scrollbar-thumb-iron-500 tw-scrollbar-track-iron-800 hover:tw-scrollbar-thumb-iron-300">
        <div className="tw-flex tw-gap-x-3">
          {pinnedIds.map((id) => (
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
    </div>
  );
};

export default BrainContentPinnedWaves;

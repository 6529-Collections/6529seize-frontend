import React, { useEffect, useState } from "react";
import BrainContentPinnedWavesAdd from "./BrainContentPinnedWavesAdd";
import BrainContentPinnedWave from "./BrainContentPinnedWave";
import { usePinnedWaves } from "../../../hooks/usePinnedWaves";
import { useRouter } from "next/router";

const BrainContentPinnedWaves: React.FC = () => {
  const router = useRouter();
  const { pinnedIds, addId } = usePinnedWaves();
  const [onHoverWaveId, setOnHoverWaveId] = useState<string | null>(null);

  useEffect(() => {
    const { wave } = router.query;
    if (wave && typeof wave === "string" && !pinnedIds.includes(wave)) {
      addId(wave);
    }
  }, [router.query, addId, pinnedIds]);

  if (!pinnedIds.length) {
    return null;
  }

  return (
    <div className="tw-flex tw-gap-4 tw-mb-4">
      <div className="tw-flex tw-items-center tw-gap-2">
        {pinnedIds.map((id, i) => (
          <BrainContentPinnedWave
            key={id}
            waveId={id}
            active={router.query.wave === id || onHoverWaveId === id}
            onMouseEnter={setOnHoverWaveId}
            onMouseLeave={() => setOnHoverWaveId(null)}
          />
        ))}
      </div>
      {/* <BrainContentPinnedWavesAdd /> */}
    </div>
  );
};

export default BrainContentPinnedWaves;

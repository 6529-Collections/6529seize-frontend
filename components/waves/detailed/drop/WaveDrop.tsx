import React, { useState } from "react";
import { ExtendedDrop } from "../../../../helpers/waves/drop.helpers";
import { WaveDropChat } from "./WaveDropChat";
import { useDrop } from "../../../../hooks/useDrop";
import { useWaveData } from "../../../../hooks/useWaveData";
import { WaveDropHeader } from "./WaveDropHeader";
import { WaveDropInfoPanel } from "./WaveDropInfoPanel";

interface WaveDropProps {
  readonly drop: ExtendedDrop;
  readonly onClose: () => void;
}

export enum WaveDropTab {
  INFO = "INFO",
  CHAT = "CHAT",
}

export const WaveDrop: React.FC<WaveDropProps> = ({
  drop: initialDrop,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<WaveDropTab>(WaveDropTab.INFO);
  const { drop } = useDrop({ dropId: initialDrop.id });
  const { data: wave } = useWaveData(drop?.wave.id ?? null);

  return (
    <div className="tw-w-full">
      <WaveDropHeader
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onClose={onClose}
      />

      <div className="tw-flex tw-flex-col lg:tw-flex-row tw-flex-1">
        {!!drop && !!wave && (
          <WaveDropInfoPanel
            drop={{
              ...drop,
              stableHash: initialDrop.stableHash,
              stableKey: initialDrop.stableKey,
            }}
            wave={wave}
            activeTab={activeTab}
            onClose={onClose}
          />
        )}

        <div
          className={`${
            activeTab === WaveDropTab.CHAT ? "tw-flex" : "tw-hidden"
          } lg:tw-flex lg:tw-flex-1 `}
        >
          {wave && drop && <WaveDropChat wave={wave} drop={drop} />}
        </div>
      </div>
    </div>
  );
};

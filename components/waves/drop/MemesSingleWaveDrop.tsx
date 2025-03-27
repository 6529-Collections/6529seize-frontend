import React, { useState } from "react";
import { SingleWaveDropHeader } from "./SingleWaveDropHeader";
import { SingleWaveDropChat } from "./SingleWaveDropChat";
import { SingleWaveDropTab } from "./SingleWaveDrop";
import { ExtendedDrop } from "../../../helpers/waves/drop.helpers";
import { useDrop } from "../../../hooks/useDrop";
import { useWaveData } from "../../../hooks/useWaveData";
import { MemesSingleWaveDropInfoPanel } from "./MemesSingleWaveDropInfoPanel";

interface MemesSingleWaveDropProps {
  readonly drop: ExtendedDrop;
  readonly onClose: () => void;
}

export const MemesSingleWaveDrop: React.FC<MemesSingleWaveDropProps> = ({
  drop: initialDrop,
  onClose,
}) => {
  const { drop } = useDrop({ dropId: initialDrop.id });
  const { data: wave } = useWaveData(drop?.wave.id ?? null);
  const [activeTab, setActiveTab] = useState<SingleWaveDropTab>(
    SingleWaveDropTab.INFO
  );

  return (
    <div className="tw-w-full">
      <SingleWaveDropHeader
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onClose={onClose}
      />

      <div className="tw-flex tw-flex-col lg:tw-flex-row tw-flex-1">
        {!!drop && !!wave && (
          <MemesSingleWaveDropInfoPanel
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
            activeTab === SingleWaveDropTab.CHAT ? "tw-flex" : "tw-hidden"
          } lg:tw-flex lg:tw-flex-1 `}
        >
          {wave && drop && <SingleWaveDropChat wave={wave} drop={drop} />}
        </div>
      </div>
    </div>
  );
};

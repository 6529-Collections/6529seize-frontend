import React, { useState } from "react";
import { ExtendedDrop } from "../../../helpers/waves/drop.helpers";
import { useDrop } from "../../../hooks/useDrop";
import { useWaveData } from "../../../hooks/useWaveData";
import { SingleWaveDropInfoPanel } from "./SingleWaveDropInfoPanel";
import { SingleWaveDropHeader } from "./SingleWaveDropHeader";
import { SingleWaveDropChat } from "./SingleWaveDropChat";

interface SingleWaveDropProps {
  readonly drop: ExtendedDrop;
  readonly onClose: () => void;
}

export enum SingleWaveDropTab {
  INFO = "INFO",
  CHAT = "CHAT",
}

export const SingleWaveDrop: React.FC<SingleWaveDropProps> = ({
  drop: initialDrop,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<SingleWaveDropTab>(SingleWaveDropTab.INFO);
  const { drop } = useDrop({ dropId: initialDrop.id });
  const { data: wave } = useWaveData(drop?.wave.id ?? null);

  return (
    <div className="tw-w-full">
      <SingleWaveDropHeader
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onClose={onClose}
      />

      <div className="tw-flex tw-flex-col lg:tw-flex-row tw-flex-1">
        {!!drop && !!wave && (
          <SingleWaveDropInfoPanel
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
"use client";

import React, { useState } from "react";
import { SingleWaveDropHeader } from "./SingleWaveDropHeader";
import { SingleWaveDropChat } from "./SingleWaveDropChat";
import { SingleWaveDropTab } from "./SingleWaveDrop";
import { DropSize, ExtendedDrop } from "../../../helpers/waves/drop.helpers";
import { useDrop } from "../../../hooks/useDrop";
import { useWaveData } from "../../../hooks/useWaveData";
import { MemesSingleWaveDropInfoPanel } from "./MemesSingleWaveDropInfoPanel";
import { useRouter, usePathname } from "next/navigation";

interface MemesSingleWaveDropProps {
  readonly drop: ExtendedDrop;
  readonly onClose: () => void;
}

export const MemesSingleWaveDrop: React.FC<MemesSingleWaveDropProps> = ({
  drop: initialDrop,
  onClose,
}) => {
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const { drop } = useDrop({ dropId: initialDrop.id });
  const { data: wave } = useWaveData({
    waveId: drop?.wave.id ?? null,
    onWaveNotFound: () => {
      router.push(pathname);
    },
  });
  const [activeTab, setActiveTab] = useState<SingleWaveDropTab>(
    SingleWaveDropTab.INFO
  );

  return (
    <div className="tw-w-full tw-h-full tw-bg-iron-950">
      <SingleWaveDropHeader
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onClose={onClose}
      />

      <div className="tw-flex tw-flex-col lg:tw-flex-row tw-flex-1">
        {!!drop && !!wave && (
          <MemesSingleWaveDropInfoPanel
            drop={{
              type: DropSize.FULL,
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
          } lg:tw-flex lg:tw-flex-1 `}>
          {wave && drop && <SingleWaveDropChat wave={wave} drop={drop} />}
        </div>
      </div>
    </div>
  );
};

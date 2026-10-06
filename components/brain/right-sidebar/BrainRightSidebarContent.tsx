import React from "react";
import type { ApiWave } from "@/generated/models/ApiWave";
import Drop, { DropLocation } from "@/components/waves/drops/Drop";
import { DropSize } from "@/helpers/waves/drop.helpers";
import { waveRightPanelText } from "@/helpers/waves/wave-right-panel.helpers";

interface BrainRightSidebarContentProps {
  readonly wave: ApiWave;
}

const BrainRightSidebarContent: React.FC<BrainRightSidebarContentProps> = ({
  wave,
}) => {
  const pinnedDrop = wave.description_drop as
    | ApiWave["description_drop"]
    | null
    | undefined;
  if (!pinnedDrop?.id) {
    return null;
  }

  return (
    <section
      aria-label={waveRightPanelText("waves.sidebar.rightPanel.pinnedDrop")}
      className="tw-min-w-0 tw-px-2 tw-pb-4 tw-pt-4"
    >
      <Drop
        drop={{
          ...pinnedDrop,
          type: DropSize.FULL,
          stableKey: pinnedDrop.id,
          stableHash: pinnedDrop.id,
        }}
        showWaveInfo={false}
        activeDrop={null}
        dropViewDropId={null}
        onReplyClick={() => {}}
        showReplyAndQuote={false}
        location={DropLocation.WAVE}
        onReply={() => {}}
        previousDrop={null}
        nextDrop={null}
        onQuoteClick={() => {}}
      />
    </section>
  );
};

export default BrainRightSidebarContent;

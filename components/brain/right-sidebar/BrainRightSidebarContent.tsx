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
  const pinnedDrop = wave.description_drop;
  if (!pinnedDrop.id) {
    return null;
  }

  return (
    <section className="tw-min-w-0 tw-px-2 tw-pb-4 tw-pt-4">
      <h2 className="tw-mb-3 tw-px-2 !tw-text-[0.6875rem] !tw-font-semibold tw-uppercase !tw-leading-4 tw-tracking-[0.06em] !tw-text-iron-400 sm:tw-tracking-[0.1em]">
        {waveRightPanelText("waves.sidebar.rightPanel.pinnedDrop")}
      </h2>
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

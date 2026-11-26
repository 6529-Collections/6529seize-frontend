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
      className="tw-min-w-0 tw-py-4 [&_[data-wave-drop-author-avatar]]:tw-size-8 md:[&_[data-wave-drop-author-avatar]]:tw-mt-1 [&_[data-wave-drop-author-name]]:tw-text-sm md:[&_[data-wave-drop-content-column]]:tw-max-w-[calc(100%-2.75rem)]"
    >
      <Drop
        drop={{
          ...pinnedDrop,
          type: DropSize.FULL,
          stableKey: pinnedDrop.id,
          stableHash: pinnedDrop.id,
        }}
        showWaveInfo={false}
        timestampLayout="stacked-compact"
        activeDrop={null}
        dropViewDropId={null}
        onReplyClick={() => {}}
        showReplyAndQuote={false}
        location={DropLocation.WAVE}
        onReply={() => {}}
        previousDrop={null}
        nextDrop={null}
        onQuoteClick={() => {}}
        wrapContentOnly={(content) =>
          pinnedDrop.parts.length > 1 ? (
            <div className="tw-pb-2">{content}</div>
          ) : (
            content
          )
        }
      />
    </section>
  );
};

export default BrainRightSidebarContent;

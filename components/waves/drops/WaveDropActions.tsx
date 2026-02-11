"use client";

import { useCompactMode } from "@/contexts/CompactModeContext";
import { useSeizeSettings } from "@/contexts/SeizeSettingsContext";
import { ApiDropType } from "@/generated/models/ApiDropType";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { useState } from "react";
import WaveDropActionsAddReaction from "./WaveDropActionsAddReaction";
import WaveDropActionsBoost from "./WaveDropActionsBoost";
import WaveDropActionsEdit from "./WaveDropActionsEdit";
import WaveDropActionsMore from "./WaveDropActionsMore";
import WaveDropActionsQuickReact from "./WaveDropActionsQuickReact";
import WaveDropActionsRate from "./WaveDropActionsRate";
import WaveDropActionsReply from "./WaveDropActionsReply";

interface WaveDropActionsProps {
  readonly drop: ExtendedDrop;
  readonly activePartIndex: number;
  readonly showVoting?: boolean | undefined;
  readonly onReply: () => void;
  readonly onEdit?: (() => void) | undefined;
}

export default function WaveDropActions({
  drop,
  activePartIndex,
  showVoting = true,
  onReply,
  onEdit,
}: WaveDropActionsProps) {
  const { isMemesWave } = useSeizeSettings();
  const compact = useCompactMode();
  const [isMoreDropdownOpen, setIsMoreDropdownOpen] = useState(false);

  // Hide voting for participation drops in memes waves
  const shouldShowVoting =
    showVoting &&
    !(
      drop.drop_type === ApiDropType.Participatory && isMemesWave(drop.wave.id)
    );

  return (
    <div
      className={`tw-absolute tw-right-2 tw-z-20 ${
        compact ? "-tw-top-4" : "tw-top-0"
      } tw-transition-opacity tw-duration-200 tw-ease-in-out ${
        isMoreDropdownOpen
          ? "tw-opacity-100"
          : "tw-opacity-0 desktop-hover:group-hover:tw-opacity-100 desktop-hover:hover:tw-opacity-100"
      }`}
    >
      <div className="tw-flex tw-items-center tw-gap-x-2">
        <div className="tw-flex tw-h-9 tw-items-center tw-gap-x-0.5 tw-rounded-xl tw-bg-iron-950 tw-px-1 tw-shadow-md tw-shadow-black/20 tw-ring-1 tw-ring-inset tw-ring-iron-700/40">
          <WaveDropActionsQuickReact drop={drop} />
          <WaveDropActionsAddReaction drop={drop} />
          <WaveDropActionsReply
            onReply={onReply}
            drop={drop}
            activePartIndex={activePartIndex}
          />
          <WaveDropActionsBoost drop={drop} />
          {onEdit && drop.drop_type !== ApiDropType.Participatory && (
            <WaveDropActionsEdit drop={drop} onEdit={onEdit} />
          )}
          <WaveDropActionsMore
            drop={drop}
            onOpenChange={setIsMoreDropdownOpen}
          />
        </div>
        {shouldShowVoting && <WaveDropActionsRate drop={drop} />}
      </div>
    </div>
  );
}

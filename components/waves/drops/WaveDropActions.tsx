"use client";

import { AuthContext } from "@/components/auth/Auth";
import { useCompactMode } from "@/contexts/CompactModeContext";
import { useSeizeSettings } from "@/contexts/SeizeSettingsContext";
import { ApiDropType } from "@/generated/models/ApiDropType";
import { getFileInfoFromUrl } from "@/helpers/file.helpers";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { useDropInteractionRules } from "@/hooks/drops/useDropInteractionRules";
import { useContext } from "react";
import WaveDropActionsAddReaction from "./WaveDropActionsAddReaction";
import WaveDropActionsBoost from "./WaveDropActionsBoost";
import WaveDropActionsCopyLink from "./WaveDropActionsCopyLink";
import WaveDropActionsDownload from "./WaveDropActionsDownload";
import WaveDropActionsEdit from "./WaveDropActionsEdit";
import WaveDropActionsMarkUnread from "./WaveDropActionsMarkUnread";
import WaveDropActionsOpen from "./WaveDropActionsOpen";
import WaveDropActionsOptions from "./WaveDropActionsOptions";
import WaveDropActionsQuote from "./WaveDropActionsQuote";
import WaveDropActionsRate from "./WaveDropActionsRate";
import WaveDropActionsReply from "./WaveDropActionsReply";
import WaveDropActionsToggleLinkPreview from "./WaveDropActionsToggleLinkPreview";
import WaveDropFollowAuthor from "./WaveDropFollowAuthor";

interface WaveDropActionsProps {
  readonly drop: ExtendedDrop;
  readonly activePartIndex: number;
  readonly showVoting?: boolean | undefined;
  readonly onReply: () => void;
  readonly onQuote: () => void;
  readonly onEdit?: (() => void) | undefined;
}

export default function WaveDropActions({
  drop,
  activePartIndex,
  showVoting = true,
  onReply,
  onQuote,
  onEdit,
}: WaveDropActionsProps) {
  const { connectedProfile } = useContext(AuthContext);
  const { canDelete } = useDropInteractionRules(drop);
  const { isMemesWave } = useSeizeSettings();
  const compact = useCompactMode();

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
      } tw-opacity-0 tw-transition-opacity tw-duration-200 tw-ease-in-out group-hover:tw-opacity-100`}
    >
      <div className="tw-flex tw-items-center tw-gap-x-2">
        <div className="tw-flex tw-h-8 tw-items-center tw-rounded-lg tw-bg-iron-950 tw-shadow tw-ring-1 tw-ring-inset tw-ring-iron-800">
          <WaveDropActionsToggleLinkPreview drop={drop} />
          {connectedProfile?.handle !== drop.author.handle &&
            !activePartIndex && <WaveDropFollowAuthor drop={drop} />}
          <WaveDropActionsMarkUnread drop={drop} />
          <WaveDropActionsReply
            onReply={onReply}
            drop={drop}
            activePartIndex={activePartIndex}
          />
          <WaveDropActionsQuote
            onQuote={onQuote}
            drop={drop}
            activePartIndex={activePartIndex}
          />
          <WaveDropActionsCopyLink drop={drop} />
          <WaveDropActionsOpen drop={drop} />
          {(() => {
            const media = drop.parts.at(0)?.media.at(0);
            const url = media?.url;
            if (!url) return null;
            const info = getFileInfoFromUrl(url);
            if (!info) return null;
            return (
              <WaveDropActionsDownload
                href={url}
                name={info.name}
                extension={info.extension}
                tooltipId={`download-media-${drop.id}`}
              />
            );
          })()}
          {onEdit && drop.drop_type !== ApiDropType.Participatory && (
            <WaveDropActionsEdit drop={drop} onEdit={onEdit} />
          )}
          {canDelete && <WaveDropActionsOptions drop={drop} />}
          <WaveDropActionsAddReaction drop={drop} />
          <WaveDropActionsBoost drop={drop} />
        </div>
        {shouldShowVoting && <WaveDropActionsRate drop={drop} />}
      </div>
    </div>
  );
}

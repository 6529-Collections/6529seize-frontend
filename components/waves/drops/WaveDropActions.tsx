"use client";

import WaveDropActionsRate from "./WaveDropActionsRate";
import WaveDropActionsReply from "./WaveDropActionsReply";
import WaveDropActionsQuote from "./WaveDropActionsQuote";
import WaveDropActionsCopyLink from "./WaveDropActionsCopyLink";
import WaveDropActionsOptions from "./WaveDropActionsOptions";
import WaveDropActionsOpen from "./WaveDropActionsOpen";
import { useContext } from "react";
import { AuthContext } from "@/components/auth/Auth";
import WaveDropFollowAuthor from "./WaveDropFollowAuthor";
import { useDropInteractionRules } from "@/hooks/drops/useDropInteractionRules";
import { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import WaveDropActionsAddReaction from "./WaveDropActionsAddReaction";
import { useSeizeSettings } from "@/contexts/SeizeSettingsContext";
import { ApiDropType } from "@/generated/models/ApiDropType";
import WaveDropActionsEdit from "./WaveDropActionsEdit";
import WaveDropActionsDownload from "./WaveDropActionsDownload";
import { getFileInfoFromUrl } from "@/helpers/file.helpers";

interface WaveDropActionsProps {
  readonly drop: ExtendedDrop;
  readonly activePartIndex: number;
  readonly showVoting?: boolean;
  readonly onReply: () => void;
  readonly onQuote: () => void;
  readonly onEdit?: () => void;
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

  // Hide voting for participation drops in memes waves
  const shouldShowVoting =
    showVoting &&
    !(
      drop.drop_type === ApiDropType.Participatory && isMemesWave(drop.wave?.id)
    );

  return (
    <div className="tw-absolute tw-z-20 tw-right-2 tw-top-0 group-hover:tw-opacity-100 tw-opacity-0 tw-transition-opacity tw-duration-200 tw-ease-in-out">
      <div className="tw-flex tw-items-center tw-gap-x-2">
        <div className="tw-h-8 tw-flex tw-items-center tw-shadow tw-bg-iron-950 tw-ring-1 tw-ring-iron-800 tw-ring-inset tw-rounded-lg">
          {connectedProfile?.handle !== drop.author.handle &&
            !activePartIndex && <WaveDropFollowAuthor drop={drop} />}
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
            const media = drop.parts?.at(0)?.media?.at(0);
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
          {onEdit && drop.drop_type !== ApiDropType.Participatory && <WaveDropActionsEdit drop={drop} onEdit={onEdit} />}
          {canDelete && <WaveDropActionsOptions drop={drop} />}
          <WaveDropActionsAddReaction drop={drop} />
        </div>
        {shouldShowVoting && <WaveDropActionsRate drop={drop} />}
      </div>
    </div>
  );
}

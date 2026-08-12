import React from "react";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import type { ApiDropPart } from "@/generated/models/ApiDropPart";
import type { ApiDropMentionedUser } from "@/generated/models/ApiDropMentionedUser";
import type { ApiDropGroupMention } from "@/generated/models/ApiDropGroupMention";
import type { ApiMentionedWave } from "@/generated/models/ApiMentionedWave";
import WaveDropPartTitle from "./WaveDropPartTitle";
import WaveDropPartContent from "./WaveDropPartContent";
import { ImageScale } from "@/helpers/image.helpers";
import type { DropContentPresentation } from "./dropContentPresentation";

interface WaveDropPartDropProps {
  drop: ApiDrop;
  activePart: ApiDropPart;
  havePreviousPart: boolean;
  haveNextPart: boolean;
  isStorm: boolean;
  activePartIndex: number;
  setActivePartIndex: (index: number) => void;
  onQuoteClick: (drop: ApiDrop) => void;
  isEditing?: boolean | undefined;
  isSaving?: boolean | undefined;
  readonly onSave?:
    | ((
        newContent: string,
        mentions?: ApiDropMentionedUser[],
        mentionedGroups?: ApiDropGroupMention[],
        mentionedWaves?: ApiMentionedWave[]
      ) => void)
    | undefined;
  readonly onCancel?: (() => void) | undefined;
  isCompetitionDrop?: boolean | undefined;
  mediaImageScale?: ImageScale | undefined;
  mediaContainerHeightClassName?: string | undefined;
  fullWidthMedia?: boolean | undefined;
  fullWidthLinkPreviews?: boolean | undefined;
  readonly onLinkCardActionsActiveChange?:
    | ((href: string, active: boolean) => void)
    | undefined;
  readonly contentPresentation?: DropContentPresentation | undefined;
  readonly embedPath?: readonly string[] | undefined;
  readonly quotePath?: readonly string[] | undefined;
  readonly embedDepth?: number | undefined;
  readonly maxEmbedDepth?: number | undefined;
}

const WaveDropPartDrop: React.FC<WaveDropPartDropProps> = ({
  drop,
  activePart,
  havePreviousPart,
  haveNextPart,
  isStorm,
  activePartIndex,
  setActivePartIndex,
  onQuoteClick,
  isEditing = false,
  isSaving = false,
  onSave,
  onCancel,
  isCompetitionDrop = false,
  mediaImageScale = ImageScale.AUTOx450,
  mediaContainerHeightClassName,
  fullWidthMedia = false,
  fullWidthLinkPreviews = false,
  onLinkCardActionsActiveChange,
  contentPresentation = "default",
  embedPath,
  quotePath,
  embedDepth,
  maxEmbedDepth,
}) => {
  const showStandaloneTitle = contentPresentation !== "quorumCompact";

  return (
    <div className="tw-relative tw-flex tw-h-full tw-gap-x-3">
      <div className="tw-flex tw-h-full tw-w-full tw-flex-col tw-self-center sm:tw-self-start">
        <div>
          {showStandaloneTitle && <WaveDropPartTitle title={drop.title} />}
          <WaveDropPartContent
            mentionedUsers={drop.mentioned_users}
            mentionedGroups={drop.mentioned_groups}
            mentionedWaves={drop.mentioned_waves}
            referencedNfts={drop.referenced_nfts}
            wave={drop.wave}
            activePart={activePart}
            havePreviousPart={havePreviousPart}
            haveNextPart={haveNextPart}
            isStorm={isStorm}
            activePartIndex={activePartIndex}
            setActivePartIndex={setActivePartIndex}
            onQuoteClick={onQuoteClick}
            isEditing={isEditing}
            isSaving={isSaving}
            onSave={onSave}
            onCancel={onCancel}
            drop={drop}
            isCompetitionDrop={isCompetitionDrop}
            mediaImageScale={mediaImageScale}
            mediaContainerHeightClassName={mediaContainerHeightClassName}
            fullWidthMedia={fullWidthMedia}
            fullWidthLinkPreviews={fullWidthLinkPreviews}
            onLinkCardActionsActiveChange={onLinkCardActionsActiveChange}
            contentPresentation={contentPresentation}
            embedPath={embedPath}
            quotePath={quotePath}
            embedDepth={embedDepth}
            maxEmbedDepth={maxEmbedDepth}
          />
        </div>
      </div>
    </div>
  );
};

export default WaveDropPartDrop;

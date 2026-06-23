import React from "react";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import type { ApiDropMentionedUser } from "@/generated/models/ApiDropMentionedUser";
import type { ApiDropGroupMention } from "@/generated/models/ApiDropGroupMention";
import type { ApiMentionedWave } from "@/generated/models/ApiMentionedWave";
import WaveDropPart from "./WaveDropPart";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { ImageScale } from "@/helpers/image.helpers";
import useIsTouchDevice from "@/hooks/useIsTouchDevice";
import type { DropContentPresentation } from "./dropContentPresentation";
import WaveDropPoll from "./poll/WaveDropPoll";

interface WaveDropContentProps {
  readonly drop: ExtendedDrop;
  readonly activePartIndex: number;
  readonly setActivePartIndex: (index: number) => void;
  readonly onDropContentClick?: ((drop: ExtendedDrop) => void) | undefined;
  readonly onQuoteClick: (drop: ApiDrop) => void;
  readonly onLongPress: () => void;
  readonly setLongPressTriggered: (triggered: boolean) => void;
  readonly isEditing?: boolean | undefined;
  readonly isSaving?: boolean | undefined;
  readonly onSave?:
    | ((
        newContent: string,
        mentions?: ApiDropMentionedUser[],
        mentionedGroups?: ApiDropGroupMention[],
        mentionedWaves?: ApiMentionedWave[]
      ) => void)
    | undefined;
  readonly onCancel?: (() => void) | undefined;
  readonly isCompetitionDrop?: boolean | undefined;
  readonly mediaImageScale?: ImageScale | undefined;
  readonly mediaContainerHeightClassName?: string | undefined;
  readonly fullWidthMedia?: boolean | undefined;
  readonly fullWidthLinkPreviews?: boolean | undefined;
  readonly hasTouch?: boolean | undefined;
  readonly onLinkCardActionsActiveChange?:
    | ((href: string, active: boolean) => void)
    | undefined;
  readonly contentPresentation?: DropContentPresentation | undefined;
  readonly embedPath?: readonly string[] | undefined;
  readonly quotePath?: readonly string[] | undefined;
  readonly embedDepth?: number | undefined;
  readonly maxEmbedDepth?: number | undefined;
}

const WaveDropContent: React.FC<WaveDropContentProps> = ({
  drop,
  activePartIndex,
  setActivePartIndex,
  onDropContentClick,
  onQuoteClick,
  onLongPress,
  setLongPressTriggered,
  isEditing = false,
  isSaving = false,
  onSave,
  onCancel,
  isCompetitionDrop = false,
  mediaImageScale = ImageScale.AUTOx450,
  mediaContainerHeightClassName,
  fullWidthMedia = false,
  fullWidthLinkPreviews = false,
  hasTouch,
  onLinkCardActionsActiveChange,
  contentPresentation = "default",
  embedPath,
  quotePath,
  embedDepth,
  maxEmbedDepth,
}) => {
  const isTouchDevice = useIsTouchDevice();
  const effectiveHasTouch = hasTouch ?? isTouchDevice;

  return (
    <>
      <WaveDropPart
        drop={drop}
        activePartIndex={activePartIndex}
        setActivePartIndex={setActivePartIndex}
        onDropContentClick={onDropContentClick}
        onQuoteClick={onQuoteClick}
        onLongPress={onLongPress}
        setLongPressTriggered={setLongPressTriggered}
        isEditing={isEditing}
        isSaving={isSaving}
        onSave={onSave}
        onCancel={onCancel}
        isCompetitionDrop={isCompetitionDrop}
        mediaImageScale={mediaImageScale}
        mediaContainerHeightClassName={mediaContainerHeightClassName}
        fullWidthMedia={fullWidthMedia}
        fullWidthLinkPreviews={fullWidthLinkPreviews}
        hasTouch={effectiveHasTouch}
        onLinkCardActionsActiveChange={onLinkCardActionsActiveChange}
        contentPresentation={contentPresentation}
        embedPath={embedPath}
        quotePath={quotePath}
        embedDepth={embedDepth}
        maxEmbedDepth={maxEmbedDepth}
      />
      {!isEditing && drop.poll && <WaveDropPoll drop={drop} />}
    </>
  );
};

export default WaveDropContent;

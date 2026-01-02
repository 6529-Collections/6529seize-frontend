import React from "react";
import { ApiDrop } from "@/generated/models/ApiDrop";
import WaveDropPart from "./WaveDropPart";
import { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { ImageScale } from "@/helpers/image.helpers";

interface WaveDropContentProps {
  readonly drop: ExtendedDrop;
  readonly activePartIndex: number;
  readonly setActivePartIndex: (index: number) => void;
  readonly onDropContentClick?: (drop: ExtendedDrop) => void | undefined | undefined;
  readonly onQuoteClick: (drop: ApiDrop) => void;
  readonly onLongPress: () => void;
  readonly setLongPressTriggered: (triggered: boolean) => void;
  readonly parentContainerRef?: React.RefObject<HTMLElement | null> | undefined;
  readonly isEditing?: boolean | undefined;
  readonly isSaving?: boolean | undefined;
  readonly onSave?: (newContent: string) => void | undefined | undefined;
  readonly onCancel?: () => void | undefined | undefined;
  readonly isCompetitionDrop?: boolean | undefined;
  readonly mediaImageScale?: ImageScale | undefined;
}

const WaveDropContent: React.FC<WaveDropContentProps> = ({
  drop,
  activePartIndex,
  setActivePartIndex,
  onDropContentClick,
  onQuoteClick,
  onLongPress,
  setLongPressTriggered,
  parentContainerRef,
  isEditing = false,
  isSaving = false,
  onSave,
  onCancel,
  isCompetitionDrop = false,
  mediaImageScale = ImageScale.AUTOx450,
}) => {
  return (
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
    />
  );
};

export default WaveDropContent;

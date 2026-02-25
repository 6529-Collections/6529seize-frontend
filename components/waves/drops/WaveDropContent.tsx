import React from "react";

import type { ApiDrop } from "@/generated/models/ApiDrop";
import type { ApiDropMentionedUser } from "@/generated/models/ApiDropMentionedUser";
import type { ApiMentionedWave } from "@/generated/models/ApiMentionedWave";
import { ImageScale } from "@/helpers/image.helpers";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import useIsTouchDevice from "@/hooks/useIsTouchDevice";

import WaveDropPart from "./WaveDropPart";

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
        mentionedWaves?: ApiMentionedWave[]
      ) => void)
    | undefined;
  readonly onCancel?: (() => void) | undefined;
  readonly isCompetitionDrop?: boolean | undefined;
  readonly mediaImageScale?: ImageScale | undefined;
  readonly hasTouch?: boolean | undefined;
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
  hasTouch,
}) => {
  const isTouchDevice = useIsTouchDevice();
  const effectiveHasTouch = hasTouch ?? isTouchDevice;

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
      hasTouch={effectiveHasTouch}
    />
  );
};

export default WaveDropContent;

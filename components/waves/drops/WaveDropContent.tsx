import React from "react";
import { ApiDrop } from "../../../generated/models/ApiDrop";
import WaveDropPart from "./WaveDropPart";
import DropContentWrapper from "./DropContentWrapper";
import { ExtendedDrop } from "../../../helpers/waves/drop.helpers";

interface WaveDropContentProps {
  readonly drop: ExtendedDrop;
  readonly activePartIndex: number;
  readonly setActivePartIndex: (index: number) => void;
  readonly onDropContentClick?: (drop: ExtendedDrop) => void;
  readonly onQuoteClick: (drop: ApiDrop) => void;
  readonly onLongPress: () => void;
  readonly setLongPressTriggered: (triggered: boolean) => void;
  readonly parentContainerRef?: React.RefObject<HTMLElement | null>;
  readonly isEditing?: boolean;
  readonly isSaving?: boolean;
  readonly onSave?: (newContent: string) => void;
  readonly onCancel?: () => void;
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
}) => {
  return (
    <DropContentWrapper parentContainerRef={parentContainerRef}>
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
      />
    </DropContentWrapper>
  );
};

export default WaveDropContent;

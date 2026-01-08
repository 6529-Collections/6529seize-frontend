import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import WaveDropContent from "../WaveDropContent";

interface ParticipationDropContentProps {
  readonly drop: ExtendedDrop;
  readonly activePartIndex: number;
  readonly setActivePartIndex: (index: number) => void;
  readonly onLongPress: () => void;
  readonly onDropContentClick?: ((drop: ExtendedDrop) => void) | undefined;
  readonly onQuoteClick: (drop: ApiDrop) => void;
  readonly setLongPressTriggered: (triggered: boolean) => void;
  readonly isCompetitionDrop?: boolean | undefined;
}

export default function ParticipationDropContent({
  drop,
  activePartIndex,
  setActivePartIndex,
  onLongPress,
  onDropContentClick,
  onQuoteClick,
  setLongPressTriggered,
  isCompetitionDrop = false,
}: ParticipationDropContentProps) {
  return (
    <div className="tw-mt-1">
      <WaveDropContent
        drop={drop}
        activePartIndex={activePartIndex}
        setActivePartIndex={setActivePartIndex}
        onLongPress={onLongPress}
        onDropContentClick={onDropContentClick}
        onQuoteClick={onQuoteClick}
        setLongPressTriggered={setLongPressTriggered}
        isCompetitionDrop={isCompetitionDrop}
      />
    </div>
  );
}

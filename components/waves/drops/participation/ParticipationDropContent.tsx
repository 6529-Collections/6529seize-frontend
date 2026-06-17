import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import WaveDropContent from "../WaveDropContent";
import type { DropContentPresentation } from "../dropContentPresentation";
import type { ImageScale } from "@/helpers/image.helpers";

interface ParticipationDropContentProps {
  readonly drop: ExtendedDrop;
  readonly activePartIndex: number;
  readonly setActivePartIndex: (index: number) => void;
  readonly onLongPress: () => void;
  readonly onDropContentClick?: ((drop: ExtendedDrop) => void) | undefined;
  readonly onQuoteClick: (drop: ApiDrop) => void;
  readonly setLongPressTriggered: (triggered: boolean) => void;
  readonly isCompetitionDrop?: boolean | undefined;
  readonly hasTouch?: boolean | undefined;
  readonly mediaImageScale?: ImageScale | undefined;
  readonly fullWidthMedia?: boolean | undefined;
  readonly fullWidthLinkPreviews?: boolean | undefined;
  readonly contentPresentation?: DropContentPresentation | undefined;
  readonly embedPath?: readonly string[] | undefined;
  readonly quotePath?: readonly string[] | undefined;
  readonly embedDepth?: number | undefined;
  readonly maxEmbedDepth?: number | undefined;
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
  hasTouch = false,
  mediaImageScale,
  fullWidthMedia = false,
  fullWidthLinkPreviews = false,
  contentPresentation = "default",
  embedPath,
  quotePath,
  embedDepth,
  maxEmbedDepth,
}: ParticipationDropContentProps) {
  return (
    <div>
      <WaveDropContent
        drop={drop}
        activePartIndex={activePartIndex}
        setActivePartIndex={setActivePartIndex}
        onLongPress={onLongPress}
        onDropContentClick={onDropContentClick}
        onQuoteClick={onQuoteClick}
        setLongPressTriggered={setLongPressTriggered}
        isCompetitionDrop={isCompetitionDrop}
        mediaImageScale={mediaImageScale}
        mediaContainerHeightClassName="tw-h-96"
        fullWidthMedia={fullWidthMedia}
        fullWidthLinkPreviews={fullWidthLinkPreviews}
        hasTouch={hasTouch}
        contentPresentation={contentPresentation}
        embedPath={embedPath}
        quotePath={quotePath}
        embedDepth={embedDepth}
        maxEmbedDepth={maxEmbedDepth}
      />
    </div>
  );
}

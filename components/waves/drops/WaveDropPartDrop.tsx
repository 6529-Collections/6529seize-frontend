import React from "react";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import type { ApiDropPart } from "@/generated/models/ApiDropPart";
import WaveDropPartTitle from "./WaveDropPartTitle";
import WaveDropPartContent from "./WaveDropPartContent";
import { ImageScale } from "@/helpers/image.helpers";

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
  readonly onSave?: ((newContent: string) => void) | undefined;
  readonly onCancel?: (() => void) | undefined;
  isCompetitionDrop?: boolean | undefined;
  mediaImageScale?: ImageScale | undefined;
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
}) => {
  return (
    <div className="tw-flex tw-gap-x-3 tw-h-full tw-relative">
      <div className="tw-flex tw-flex-col tw-w-full tw-h-full tw-self-center sm:tw-self-start">
        <div>
          <WaveDropPartTitle title={drop.title} />
          <WaveDropPartContent
            mentionedUsers={drop.mentioned_users}
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
          />
        </div>
      </div>
    </div>
  );
};

export default WaveDropPartDrop;

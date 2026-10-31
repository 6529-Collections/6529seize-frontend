import { MemeCollaboratorCredits } from "@/components/waves/memes/collaborations/MemeCollaboratorCredits";
import MediaTypeBadge from "@/components/drops/media/MediaTypeBadge";
import { ApiDropType } from "@/generated/models/ApiDropType";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { type ReactNode } from "react";
import WaveDropTime from "../drops/time/WaveDropTime";
import { WithDropAuthorSignedMarker } from "../drops/signature/DropAuthorSignedMarker";
import { SingleWaveDropInfoAuthorSection } from "./SingleWaveDropInfoAuthorSection";
import { SingleWaveDropPosition } from "./SingleWaveDropPosition";
import { WinnerBadge } from "./WinnerBadge";

interface WaveDropMetaRowProps {
  readonly drop: ExtendedDrop;
  readonly isWinner: boolean;
  readonly mimeType?: string | undefined;
  readonly children?: ReactNode | undefined;
}

export const WaveDropMetaRow = ({
  drop,
  isWinner,
  mimeType,
  children,
}: WaveDropMetaRowProps) => (
  <>
    <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-3">
      <SingleWaveDropInfoAuthorSection drop={drop} />
      <span className="tw-text-white/40">{"\u00b7"}</span>
      <WithDropAuthorSignedMarker drop={drop}>
        <WaveDropTime timestamp={drop.created_at} size="sm" />
      </WithDropAuthorSignedMarker>
      {mimeType && (
        <>
          <span className="tw-text-white/40">{"\u00b7"}</span>
          <MediaTypeBadge mimeType={mimeType} dropId={drop.id} />
        </>
      )}
      {isWinner && (
        <>
          <span className="tw-text-white/40">{"\u00b7"}</span>
          <WinnerBadge drop={drop} variant="simple" />
        </>
      )}
      {!isWinner && drop.drop_type === ApiDropType.Participatory && (
        <>
          <span className="tw-text-white/40">{"\u00b7"}</span>
          <SingleWaveDropPosition
            rank={drop.rank}
            drop={drop}
            variant="simple"
          />
        </>
      )}
      {children}
    </div>
    {(drop.collaborators?.length ?? 0) > 0 && (
      <div className="tw-mt-6">
        <MemeCollaboratorCredits
          collaborators={drop.collaborators}
          size="default"
        />
      </div>
    )}
  </>
);

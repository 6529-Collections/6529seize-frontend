import { type ReactNode } from "react";
import { ApiDropType } from "@/generated/models/ApiDropType";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { SingleWaveDropInfoAuthorSection } from "./SingleWaveDropInfoAuthorSection";
import WaveDropTime from "../drops/time/WaveDropTime";
import { SingleWaveDropPosition } from "./SingleWaveDropPosition";
import { WinnerBadge } from "./WinnerBadge";

interface WaveDropMetaRowProps {
  readonly drop: ExtendedDrop;
  readonly isWinner: boolean;
  readonly children?: ReactNode | undefined;
}

export const WaveDropMetaRow = ({
  drop,
  isWinner,
  children,
}: WaveDropMetaRowProps) => (
  <div className="tw-flex tw-items-center tw-gap-3 tw-flex-wrap">
    <SingleWaveDropInfoAuthorSection drop={drop} />
    <span className="tw-text-white/40">{"\u00b7"}</span>
    <WaveDropTime timestamp={drop.created_at} size="sm" />
    {isWinner && (
      <>
        <span className="tw-text-white/40">{"\u00b7"}</span>
        <WinnerBadge drop={drop} variant="simple" />
      </>
    )}
    {!isWinner && drop?.drop_type === ApiDropType.Participatory && (
      <>
        <span className="tw-text-white/40">{"\u00b7"}</span>
        <SingleWaveDropPosition rank={drop.rank} drop={drop} variant="simple" />
      </>
    )}
    {children}
  </div>
);

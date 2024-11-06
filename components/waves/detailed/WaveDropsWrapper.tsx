import { ReactNode } from "react";
import { ApiDrop } from "../../../generated/models/ApiDrop";
import { ActiveDropState } from "./WaveDetailedContent";
import { WaveDetailedDropsSortBy, WaveDetailedDropsView } from "./WaveDetailed";
import WaveDropsAll from "./drops/WaveDropsAll";
import WaveDrops from "./drops/WaveDrops";

interface WaveDropsWrapperProps {
  readonly waveId: string;
  readonly onReply: ({
    drop,
    partId,
  }: {
    drop: ApiDrop;
    partId: number;
  }) => void;
  readonly onQuote: ({
    drop,
    partId,
  }: {
    drop: ApiDrop;
    partId: number;
  }) => void;
  readonly activeDrop: ActiveDropState | null;
  readonly initialDrop: number | null;
  readonly dropsView: WaveDetailedDropsView;
  readonly dropsSortBy: WaveDetailedDropsSortBy;
}

export default function WaveDropsWrapper({
  waveId,
  onReply,
  onQuote,
  activeDrop,
  initialDrop,
  dropsView,
  dropsSortBy,
}: WaveDropsWrapperProps) {
  const components: Record<WaveDetailedDropsView, JSX.Element> = {
    [WaveDetailedDropsView.ALL]: (
      <WaveDropsAll
        waveId={waveId}
        onReply={onReply}
        onQuote={onQuote}
        activeDrop={activeDrop}
        initialDrop={initialDrop}
      />
    ),
    [WaveDetailedDropsView.DROPS]: (
      <WaveDrops
        waveId={waveId}
        onReply={onReply}
        onQuote={onQuote}
        activeDrop={activeDrop}
        initialDrop={initialDrop}
        dropsSortBy={dropsSortBy}
      />
    ),
  };

  return components[dropsView];
}

import { WaveLeaderboardGalleryItem } from "@/components/waves/leaderboard/gallery/WaveLeaderboardGalleryItem";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";

import { PREVIEW_CASE_WIDTHS } from "../presentation/presets";

import { PreviewCaseSection } from "./PreviewCaseSection";
import { PreviewWidthFrame } from "./PreviewWidthFrame";

interface PreviewLeaderboardGalleryCaseProps {
  readonly drop: ExtendedDrop;
  readonly onDropClick: (drop: ExtendedDrop) => void;
}

export function PreviewLeaderboardGalleryCase({
  drop,
  onDropClick,
}: PreviewLeaderboardGalleryCaseProps) {
  return (
    <PreviewCaseSection title="Leaderboard Gallery Card">
      <PreviewWidthFrame
        maxWidthClass={PREVIEW_CASE_WIDTHS.leaderboardGalleryItem}
      >
        <WaveLeaderboardGalleryItem drop={drop} onDropClick={onDropClick} />
      </PreviewWidthFrame>
    </PreviewCaseSection>
  );
}

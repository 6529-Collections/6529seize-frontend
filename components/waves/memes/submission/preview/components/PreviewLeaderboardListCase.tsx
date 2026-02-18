import { MemesLeaderboardDrop } from "@/components/memes/drops/MemesLeaderboardDrop";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { PREVIEW_CASE_WIDTHS } from "../presentation/presets";
import { PreviewCaseSection } from "./PreviewCaseSection";
import { PreviewWidthFrame } from "./PreviewWidthFrame";

interface PreviewLeaderboardListCaseProps {
  readonly drop: ExtendedDrop;
  readonly onDropClick: (drop: ExtendedDrop) => void;
}

export function PreviewLeaderboardListCase({
  drop,
  onDropClick,
}: PreviewLeaderboardListCaseProps) {
  return (
    <PreviewCaseSection title="Leaderboard List Card">
      <PreviewWidthFrame maxWidthClass={PREVIEW_CASE_WIDTHS.leaderboardList}>
        <MemesLeaderboardDrop drop={drop} onDropClick={onDropClick} />
      </PreviewWidthFrame>
    </PreviewCaseSection>
  );
}

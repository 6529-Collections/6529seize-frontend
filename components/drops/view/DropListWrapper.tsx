import CircleLoader, {
  CircleLoaderSize,
} from "../../distribution-plan-tool/common/CircleLoader";
import DropsList from "./DropsList";

import { ActiveDropState } from "../../waves/detailed/WaveDetailedContent";
import { Drop } from "../../../generated/models/Drop";

interface DropListWrapperProps {
  readonly drops: Drop[];
  readonly loading: boolean;
  readonly showWaveInfo: boolean;
  readonly activeDrop: ActiveDropState | null;
  readonly rootDropId: string | null;
  readonly onBottomIntersection: (state: boolean) => void;
  readonly showReplyAndQuote: boolean;
  readonly onReply: ({ drop, partId }: { drop: Drop; partId: number }) => void;
  readonly onQuote: ({ drop, partId }: { drop: Drop; partId: number }) => void;
}

export default function DropListWrapper({
  drops,
  loading,
  showWaveInfo,
  activeDrop,
  rootDropId,
  onBottomIntersection,
  onReply,
  onQuote,
  showReplyAndQuote,
}: DropListWrapperProps) {
  return (
    <div className="tw-overflow-hidden">
      <DropsList
        drops={drops}
        showWaveInfo={showWaveInfo}
        onBottomIntersection={onBottomIntersection}
        onReply={onReply}
        onQuote={onQuote}
        showReplyAndQuote={showReplyAndQuote}
        activeDrop={activeDrop}
        rootDropId={rootDropId}
      />
      {loading && (
        <div className="tw-w-full tw-text-center tw-mt-8">
          <CircleLoader size={CircleLoaderSize.XXLARGE} />
        </div>
      )}
    </div>
  );
}

import { Drop } from "../../../../generated/models/Drop";
import WaveDetailedDropActionsRate from "./WaveDetailedDropActionsRate";
import WaveDetailedDropActionsReply from "./WaveDetailedDropActionsReply";
import WaveDetailedDropActionsQuote from "./WaveDetailedDropActionsQuote";
import WaveDetailedDropActionsCopyLink from "./WaveDetailedDropActionsCopyLink";
import WaveDetailedDropActionsOptions from "./WaveDetailedDropActionsOptions";

interface WaveDetailedDropActionsProps {
  drop: Drop;
  onReply: () => void;
  onQuote: () => void;
}

export default function WaveDetailedDropActions({
  drop,
  onReply,
  onQuote,
}: WaveDetailedDropActionsProps) {
  return (
    <div className="tw-absolute tw-right-2 tw-top-1 group-hover:tw-block tw-hidden tw-transition tw-duration-300 tw-ease-linear">
      <div className="tw-flex tw-items-center tw-gap-x-4">
        <div className="tw-flex tw-items-center tw-bg-iron-900 tw-ring-1 tw-ring-iron-800 tw-ring-inset tw-rounded-lg">
          <WaveDetailedDropActionsReply onReply={onReply} />
          <WaveDetailedDropActionsQuote onQuote={onQuote} />
          <WaveDetailedDropActionsCopyLink drop={drop} />
          <WaveDetailedDropActionsOptions />
        </div>
        <WaveDetailedDropActionsRate drop={drop} />
      </div>
    </div>
  );
}

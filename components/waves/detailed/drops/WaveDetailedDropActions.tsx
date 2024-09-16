import { Drop } from "../../../../generated/models/Drop";
import WaveDetailedDropActionsRate from "./WaveDetailedDropActionsRate";
import WaveDetailedDropActionsReply from "./WaveDetailedDropActionsReply";
import WaveDetailedDropActionsQuote from "./WaveDetailedDropActionsQuote";
import WaveDetailedDropActionsCopyLink from "./WaveDetailedDropActionsCopyLink";
import WaveDetailedDropActionsOptions from "./WaveDetailedDropActionsOptions";
import { useContext } from "react";
import { AuthContext } from "../../../auth/Auth";

interface WaveDetailedDropActionsProps {
  readonly drop: Drop;
  readonly onReply: () => void;
  readonly onQuote: () => void;
}

export default function WaveDetailedDropActions({
  drop,
  onReply,
  onQuote,
}: WaveDetailedDropActionsProps) {
  const { connectedProfile, activeProfileProxy } = useContext(AuthContext);

  const getShowOptions = () => {
    if (!connectedProfile?.profile?.handle) {
      return false;
    }
    if (activeProfileProxy) {
      return false;
    }

    return connectedProfile.profile.handle === drop.author.handle;
  };

  return (
    <div className="tw-absolute tw-right-2 tw-top-1 group-hover:tw-block tw-hidden tw-transition tw-duration-300 tw-ease-linear">
      <div className="tw-flex tw-items-center tw-gap-x-2">
        <div className="tw-flex tw-items-center tw-shadow tw-bg-iron-900 tw-ring-1 tw-ring-iron-800 tw-ring-inset tw-rounded-lg">
          <WaveDetailedDropActionsReply onReply={onReply} drop={drop} />
          <WaveDetailedDropActionsQuote onQuote={onQuote} drop={drop} />
          <WaveDetailedDropActionsCopyLink drop={drop} />
          {getShowOptions() && <WaveDetailedDropActionsOptions drop={drop} />}
        </div>
        <WaveDetailedDropActionsRate drop={drop} />
      </div>
    </div>
  );
}

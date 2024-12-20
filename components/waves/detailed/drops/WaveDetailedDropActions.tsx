import { ApiDrop } from "../../../../generated/models/ApiDrop";
import WaveDetailedDropActionsRate from "./WaveDetailedDropActionsRate";
import WaveDetailedDropActionsReply from "./WaveDetailedDropActionsReply";
import WaveDetailedDropActionsQuote from "./WaveDetailedDropActionsQuote";
import WaveDetailedDropActionsCopyLink from "./WaveDetailedDropActionsCopyLink";
import WaveDetailedDropActionsOptions from "./WaveDetailedDropActionsOptions";
import { useContext } from "react";
import { AuthContext } from "../../../auth/Auth";
import WaveDetailedDropFollowAuthor from "./WaveDetailedDropFollowAuthor";
import { useDropInteractionRules } from "../../../../hooks/drops/useDropInteractionRules";

interface WaveDetailedDropActionsProps {
  readonly drop: ApiDrop;
  readonly activePartIndex: number;
  readonly showVoting?: boolean;
  readonly onReply: () => void;
  readonly onQuote: () => void;
}

export default function WaveDetailedDropActions({
  drop,
  activePartIndex,
  showVoting = true,
  onReply,
  onQuote,
}: WaveDetailedDropActionsProps) {
  const { connectedProfile } = useContext(AuthContext);
  const { canDelete } = useDropInteractionRules(drop);

  return (
    <div className="tw-absolute tw-z-10 tw-right-2 tw-top-1 group-hover:tw-opacity-100 tw-opacity-0 tw-transition-opacity tw-duration-200 tw-ease-in-out">
      <div className="tw-flex tw-items-center tw-gap-x-2">
        <div className="tw-h-8 tw-flex tw-items-center tw-shadow tw-bg-iron-950 tw-ring-1 tw-ring-iron-800 tw-ring-inset tw-rounded-lg">
          {connectedProfile?.profile?.handle !== drop.author.handle &&
            !activePartIndex && <WaveDetailedDropFollowAuthor drop={drop} />}
          <WaveDetailedDropActionsReply
            onReply={onReply}
            drop={drop}
            activePartIndex={activePartIndex}
          />
          <WaveDetailedDropActionsQuote
            onQuote={onQuote}
            drop={drop}
            activePartIndex={activePartIndex}
          />
          <WaveDetailedDropActionsCopyLink drop={drop} />
          {canDelete && <WaveDetailedDropActionsOptions drop={drop} />}
        </div>
        {showVoting && <WaveDetailedDropActionsRate drop={drop} />}
      </div>
    </div>
  );
}

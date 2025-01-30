import React from "react";
import DropListItemRateGive from "../../drops/view/item/rate/give/DropListItemRateGive";
import { ApiDrop } from "../../../generated/models/ApiDrop";
import { useDropInteractionRules } from "../../../hooks/drops/useDropInteractionRules";

interface WaveDropActionsRateProps {
  readonly drop: ApiDrop;
  readonly onRated?: () => void;
  readonly isMobile?: boolean;
}

const WaveDropActionsRate: React.FC<WaveDropActionsRateProps> = ({
  drop,
  onRated,
  isMobile = false,
}) => {
  const { canShowVote } = useDropInteractionRules(drop);

  return (
    <>
      {canShowVote && (
        <div className={isMobile ? "tw-p-4 tw-rounded-xl tw-inline-flex" : ""}>
          <DropListItemRateGive
            drop={drop}
            onRated={onRated}
            isMobile={isMobile}
          />
        </div>
      )}
    </>
  );
};

export default WaveDropActionsRate;

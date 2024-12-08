import React  from "react";
import DropListItemRateGive from "../../../drops/view/item/rate/give/DropListItemRateGive";
import { ApiDrop } from "../../../../generated/models/ApiDrop";
import { useDropInteractionRules } from "../../../../hooks/drops/useDropInteractionRules";

interface WaveDetailedDropActionsRateProps {
  readonly drop: ApiDrop;
  readonly onRated?: () => void;
  readonly isMobile?: boolean;
}

const WaveDetailedDropActionsRate: React.FC<
  WaveDetailedDropActionsRateProps
> = ({ drop, onRated, isMobile = false }) => {
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

export default WaveDetailedDropActionsRate;

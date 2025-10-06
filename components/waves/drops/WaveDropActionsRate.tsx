import React from "react";
import DropListItemRateGive from "@/components/drops/view/item/rate/give/DropListItemRateGive";
import { ApiDrop } from "@/generated/models/ApiDrop";
import { useDropInteractionRules } from "@/hooks/drops/useDropInteractionRules";
import { ApiDropType } from "@/generated/models/ApiDropType";
import { useSeizeSettings } from "@/contexts/SeizeSettingsContext";

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
  const { isMemesWave } = useSeizeSettings();

  // Check if we should hide the clap icon
  // Hide only for chat drops and memes participation drops
  const shouldHideClap =
    drop.drop_type === ApiDropType.Chat ||
    (drop.drop_type === ApiDropType.Participatory &&
      isMemesWave(drop.wave?.id));

  return (
    <>
      {canShowVote && !shouldHideClap && (
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

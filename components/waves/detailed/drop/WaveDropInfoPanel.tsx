import React from "react";
import { WaveDropClose } from "./WaveDropClose";
import { ExtendedDrop } from "../../../../helpers/waves/drop.helpers";
import { WaveDropTab } from "./WaveDrop";
import { useAuth } from "../../../auth/Auth";
import { ApiWave } from "../../../../generated/models/ApiWave";
import { WaveDropInfoContent } from "./WaveDropInfoContent";
import { WaveDropInfoActions } from "./WaveDropInfoActions";
import { WaveDropInfoAuthorSection } from "./WaveDropInfoAuthorSection";
import { WaveDropInfoDetails } from "./WaveDropInfoDetails";
import { WaveDropInfoContainer } from "./WaveDropInfoContainer";

interface WaveDropInfoPanelProps {
  readonly drop: ExtendedDrop | undefined;
  readonly wave: ApiWave | null;
  readonly activeTab: WaveDropTab;
  readonly onClose: () => void;
}

export const WaveDropInfoPanel: React.FC<WaveDropInfoPanelProps> = ({
  drop,
  wave,
  activeTab,
  onClose,
}) => {
  const { connectedProfile } = useAuth();

  return (
    <WaveDropInfoContainer activeTab={activeTab}>
      <div className="tw-hidden lg:tw-block">
        <WaveDropClose onClose={onClose} />
      </div>
      
      <WaveDropInfoContent drop={drop} />

      <div className="tw-border-t tw-border-iron-800 tw-pt-3 tw-border-solid tw-border-x-0 tw-border-b-0">
        <WaveDropInfoActions
          drop={drop}
          wave={wave}
          isVotingEligible={wave?.voting.authenticated_user_eligible ?? false}
          isAuthor={drop?.author.handle === connectedProfile?.profile?.handle}
        />

        <WaveDropInfoAuthorSection drop={drop} wave={wave} />

        <WaveDropInfoDetails drop={drop} />
      </div>
    </WaveDropInfoContainer>
  );
}; 

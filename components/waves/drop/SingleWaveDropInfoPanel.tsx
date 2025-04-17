import React from "react";
import { SingleWaveDropClose } from "./SingleWaveDropClose";
import { ExtendedDrop } from "../../../helpers/waves/drop.helpers";
import { SingleWaveDropTab } from "./SingleWaveDrop";
import { ApiWave } from "../../../generated/models/ApiWave";
import { ApiDropType } from "../../../generated/models/ApiDropType";
import { SingleWaveDropInfoContainer } from "./SingleWaveDropInfoContainer";
import { SingleWaveDropInfoDetails } from "./SingleWaveDropInfoDetails";
import { SingleWaveDropInfoAuthorSection } from "./SingleWaveDropInfoAuthorSection";
import { SingleWaveDropInfoActions } from "./SingleWaveDropInfoActions";
import { SingleWaveDropInfoContent } from "./SingleWaveDropInfoContent";
import { SingleWaveDropVotes } from "./SingleWaveDropVotes";
import WaveDropDeleteButton from "../../utils/button/WaveDropDeleteButton";
import { useDropInteractionRules } from "../../../hooks/drops/useDropInteractionRules";

interface SingleWaveDropInfoPanelProps {
  readonly drop: ExtendedDrop;
  readonly wave: ApiWave | null;
  readonly activeTab: SingleWaveDropTab;
  readonly onClose: () => void;
}

export const SingleWaveDropInfoPanel: React.FC<
  SingleWaveDropInfoPanelProps
> = ({ drop, wave, activeTab, onClose }) => {
  const { canDelete } = useDropInteractionRules(drop);

  return (
    <SingleWaveDropInfoContainer activeTab={activeTab}>
      <div className="tw-hidden lg:tw-block">
        <SingleWaveDropClose onClose={onClose} />
      </div>
      <SingleWaveDropInfoContent drop={drop} />
      <div className="tw-px-6">
        <SingleWaveDropVotes drop={drop} />
      </div>
      <div className="tw-px-6 tw-mt-4">
        <SingleWaveDropInfoAuthorSection drop={drop} wave={wave} />
      </div>
      <SingleWaveDropInfoActions drop={drop} wave={wave} />

      <div className="tw-mt-2">
        <SingleWaveDropInfoDetails drop={drop} />
      </div>
      {canDelete && drop.drop_type !== ApiDropType.Winner && (
        <div className="tw-w-full tw-px-6 tw-pb-6 tw-pt-6 tw-border-t tw-border-iron-800 tw-border-solid tw-border-x-0 tw-border-b-0">
          <WaveDropDeleteButton drop={drop} />
        </div>
      )}
    </SingleWaveDropInfoContainer>
  );
};

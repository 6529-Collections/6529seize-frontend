import React from "react";
import { SingleWaveDropClose } from "./SingleWaveDropClose";
import { ExtendedDrop } from "../../../helpers/waves/drop.helpers";
import { SingleWaveDropTab } from "./SingleWaveDrop";
import { ApiWave } from "../../../generated/models/ApiWave";
import { SingleWaveDropInfoContainer } from "./SingleWaveDropInfoContainer";
import { SingleWaveDropInfoDetails } from "./SingleWaveDropInfoDetails";
import { SingleWaveDropInfoAuthorSection } from "./SingleWaveDropInfoAuthorSection";
import { SingleWaveDropInfoActions } from "./SingleWaveDropInfoActions";
import { SingleWaveDropInfoContent } from "./SingleWaveDropInfoContent";

interface SingleWaveDropInfoPanelProps {
  readonly drop: ExtendedDrop;
  readonly wave: ApiWave | null;
  readonly activeTab: SingleWaveDropTab;
  readonly onClose: () => void;
}

export const SingleWaveDropInfoPanel: React.FC<SingleWaveDropInfoPanelProps> = ({
  drop,
  wave,
  activeTab,
  onClose,
}) => {
  return (
    <SingleWaveDropInfoContainer activeTab={activeTab}>
      <div className="tw-hidden lg:tw-block">
        <SingleWaveDropClose onClose={onClose} />
      </div>

      <SingleWaveDropInfoContent drop={drop} />

      <div className="tw-border-t tw-border-iron-800 tw-pt-3 tw-border-solid tw-border-x-0 tw-border-b-0">
        <SingleWaveDropInfoActions
          drop={drop}
          wave={wave}
        />

        <SingleWaveDropInfoAuthorSection drop={drop} wave={wave} />

        <SingleWaveDropInfoDetails drop={drop} />
      </div>
    </SingleWaveDropInfoContainer>
  );
}; 
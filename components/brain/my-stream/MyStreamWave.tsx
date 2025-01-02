import React from "react";
import { ExtendedDrop } from "../../../helpers/waves/drop.helpers";
import MyStreamWaveChat from "./MyStreamWaveChat";

interface MyStreamWaveProps {
  readonly waveId: string;
  readonly onDropClick: (drop: ExtendedDrop) => void;
}

const MyStreamWave: React.FC<MyStreamWaveProps> = ({ waveId, onDropClick }) => {
  return <MyStreamWaveChat waveId={waveId} onDropClick={onDropClick} />;
};

export default MyStreamWave;

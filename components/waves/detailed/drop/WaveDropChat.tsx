import React from "react";
import { ApiDrop, ApiWave } from "../../../../generated/models/ObjectSerializer";

interface WaveDropChatProps {
  readonly wave: ApiWave;
  readonly drop: ApiDrop;
}

export const WaveDropChat: React.FC<WaveDropChatProps> = ({ wave, drop }) => {
  return (
    <div className="tw-flex-1">
    <div className="tw-rounded-xl tw-overflow-hidden tw-bg-iron-950 tw-ring-1 tw-ring-iron-800 tw-relative">
      chat
    </div>
  </div>
  );
};

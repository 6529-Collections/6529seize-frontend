import React from "react";
import useCapacitor from "../../../hooks/useCapacitor";
import BrainLeftSidebarCreateAWaveButton from "../left-sidebar/BrainLeftSidebarCreateAWaveButton";
import BrainLeftSidebarSearchWave from "../left-sidebar/search-wave/BrainLeftSidebarSearchWave";
import BrainLeftSidebarWaves from "../left-sidebar/waves/BrainLeftSidebarWaves";
import { useQuery } from "@tanstack/react-query";
import { QueryKey } from "../../../components/react-query-wrapper/ReactQueryWrapper";
import { ApiWave } from "../../../generated/models/ApiWave";
import { commonApiFetch } from "../../../services/api/common-api";

interface BrainMobileWavesProps {
  readonly activeWaveId: string;
}

const BrainMobileWaves: React.FC<BrainMobileWavesProps> = ({ activeWaveId }) => {
  const capacitor = useCapacitor();

  const containerClassName = `tw-h-[calc(100vh-10.75rem)] tw-overflow-y-auto no-scrollbar tw-space-y-4${
    capacitor.isCapacitor ? " tw-pb-[calc(4rem+80px)]" : ""
  }`;

  return (
    <div className={containerClassName}>
      <BrainLeftSidebarCreateAWaveButton />
      <BrainLeftSidebarSearchWave />
      <BrainLeftSidebarWaves activeWaveId={activeWaveId} />
    </div>
  );
};

export default BrainMobileWaves;

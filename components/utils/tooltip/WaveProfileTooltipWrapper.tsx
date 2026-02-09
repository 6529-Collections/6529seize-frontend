import React from "react";
import CustomTooltip from "./CustomTooltip";
import WaveProfileTooltip from "@/components/waves/utils/profile/WaveProfileTooltip";
import useDeviceInfo from "@/hooks/useDeviceInfo";
import type { ApiWaveMin } from "@/generated/models/ApiWaveMin";

interface WaveProfileTooltipWrapperProps {
  readonly waveId: string;
  readonly initialWave?: ApiWaveMin | null;
  readonly fallbackName?: string | undefined;
  readonly children: React.ReactElement;
  readonly placement?: "top" | "bottom" | "left" | "right" | "auto" | undefined;
}

export default function WaveProfileTooltipWrapper({
  waveId,
  initialWave = null,
  fallbackName,
  children,
  placement = "auto",
}: WaveProfileTooltipWrapperProps) {
  const { hasTouchScreen } = useDeviceInfo();

  // If it's a touch device, just render the children without the tooltip
  if (hasTouchScreen) {
    return <>{children}</>;
  }

  return (
    <CustomTooltip
      content={
        <WaveProfileTooltip
          waveId={waveId}
          initialWave={initialWave}
          fallbackName={fallbackName}
        />
      }
      placement={placement}
      delayShow={500}
      delayHide={0}
    >
      {children}
    </CustomTooltip>
  );
}

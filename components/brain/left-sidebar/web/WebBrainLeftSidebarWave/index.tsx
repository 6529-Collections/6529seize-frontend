"use client";

import { useMemo } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { usePrefetchWaveData } from "@/hooks/usePrefetchWaveData";
import useDeviceInfo from "@/hooks/useDeviceInfo";
import { ApiWaveType } from "@/generated/models/ApiWaveType";
import { CollapsedWave } from "./subcomponents/CollapsedWave";
import { ExpandedWave } from "./subcomponents/ExpandedWave";
import { useWaveNavigation } from "./hooks/useWaveNavigation";
import { useWaveNameTruncation } from "./hooks/useWaveNameTruncation";
import { formatWaveName } from "./utils/formatWaveName";
import { useMyStream } from "@/contexts/wave/MyStreamContext";
import type { MinimalWave } from "@/contexts/wave/hooks/useEnhancedWavesListCore";

interface WebBrainLeftSidebarWaveProps {
  readonly wave: MinimalWave;
  readonly onHover: (waveId: string) => void;
  readonly showPin?: boolean | undefined;
  readonly basePath?: string | undefined;
  readonly collapsed?: boolean | undefined;
  readonly depth?: 0 | 1 | undefined;
  readonly canExpand?: boolean | undefined;
  readonly isExpanded?: boolean | undefined;
  readonly hasUnreadSubwaves?: boolean | undefined;
  readonly isLastSubwave?: boolean | undefined;
  readonly onToggleExpand?: ((waveId: string) => void) | undefined;
  readonly onPrefetchSubwaves?: ((waveId: string) => void) | undefined;
}

const TOOLTIP_PLACEMENT = "right" as const;

const WebBrainLeftSidebarWave = ({
  wave,
  onHover,
  showPin = true,
  basePath = "/waves",
  collapsed = false,
  depth = 0,
  canExpand = false,
  isExpanded = false,
  hasUnreadSubwaves = false,
  isLastSubwave = false,
  onToggleExpand,
  onPrefetchSubwaves,
}: WebBrainLeftSidebarWaveProps) => {
  const { activeWave } = useMyStream();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const prefetchWaveData = usePrefetchWaveData();
  const { hasTouchScreen } = useDeviceInfo();

  const { href, isActive, onMouseEnter, onClick } = useWaveNavigation({
    basePath,
    activeWaveId: activeWave.id,
    setActiveWave: activeWave.set,
    onHover,
    prefetchWaveData,
    pathname,
    searchParams,
    waveId: wave.id,
    hasTouchScreen,
    firstUnreadDropSerialNo: wave.firstUnreadDropSerialNo,
  });

  const formattedWaveName = useMemo(
    () =>
      formatWaveName({
        name: wave.name,
        type: wave.type,
      }),
    [wave.name, wave.type]
  );

  const { nameRef, isNameTruncated } = useWaveNameTruncation({
    collapsed,
    contentKey: formattedWaveName,
  });

  const isDropWave = wave.type !== ApiWaveType.Chat;
  const haveNewDrops = wave.newDropsCount.count > 0;
  const tooltipId = `wave-collapsed-${wave.id}`;
  const expandedTooltipId = `wave-expanded-${wave.id}`;
  const showCollapsedTooltip = collapsed && !hasTouchScreen;
  const showExpandedTooltip = !collapsed && !hasTouchScreen && isNameTruncated;

  if (collapsed) {
    return (
      <CollapsedWave
        formattedWaveName={formattedWaveName}
        haveNewDrops={haveNewDrops}
        href={href}
        isActive={isActive}
        isDropWave={isDropWave}
        onMouseEnter={onMouseEnter}
        onClick={onClick}
        showTooltip={showCollapsedTooltip}
        tooltipId={tooltipId}
        tooltipPlacement={TOOLTIP_PLACEMENT}
        wave={wave}
        hasUnreadSubwaves={hasUnreadSubwaves}
      />
    );
  }

  return (
    <ExpandedWave
      formattedWaveName={formattedWaveName}
      haveNewDrops={haveNewDrops}
      href={href}
      isActive={isActive}
      isDropWave={isDropWave}
      latestDropTimestamp={wave.newDropsCount.latestDropTimestamp}
      nameRef={nameRef}
      onMouseEnter={onMouseEnter}
      onClick={onClick}
      showExpandedTooltip={showExpandedTooltip}
      showPin={showPin}
      tooltipContent={formattedWaveName}
      tooltipId={expandedTooltipId}
      tooltipPlacement={TOOLTIP_PLACEMENT}
      wave={wave}
      waveId={wave.id}
      isPinned={wave.isPinned}
      depth={depth}
      canExpand={canExpand}
      isExpanded={isExpanded}
      hasUnreadSubwaves={hasUnreadSubwaves}
      isLastSubwave={isLastSubwave}
      onToggleExpand={onToggleExpand}
      onPrefetchSubwaves={hasTouchScreen ? undefined : onPrefetchSubwaves}
    />
  );
};

export default WebBrainLeftSidebarWave;

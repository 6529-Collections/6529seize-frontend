'use client';

import { useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { MinimalWave } from '@/contexts/wave/hooks/useEnhancedWavesList';
import { usePrefetchWaveData } from '@/hooks/usePrefetchWaveData';
import useDeviceInfo from '@/hooks/useDeviceInfo';
import { ApiWaveType } from '@/generated/models/ApiWaveType';
import { CollapsedWave } from './subcomponents/CollapsedWave';
import { ExpandedWave } from './subcomponents/ExpandedWave';
import { useWaveNavigation } from './hooks/useWaveNavigation';
import { useWaveNameTruncation } from './hooks/useWaveNameTruncation';
import { formatWaveName } from './utils/formatWaveName';
import { useMyStream } from '@/contexts/wave/MyStreamContext';

interface WebBrainLeftSidebarWaveProps {
  readonly wave: MinimalWave;
  readonly onHover: (waveId: string) => void;
  readonly showPin?: boolean;
  readonly basePath?: string;
  readonly collapsed?: boolean;
}

const TOOLTIP_PLACEMENT = 'right' as const;

const WebBrainLeftSidebarWave = ({
  wave,
  onHover,
  showPin = true,
  basePath = '/waves',
  collapsed = false,
}: WebBrainLeftSidebarWaveProps) => {
  const { activeWave } = useMyStream();
  const searchParams = useSearchParams();
  const prefetchWaveData = usePrefetchWaveData();
  const { hasTouchScreen } = useDeviceInfo();

  const { href, isActive, onMouseEnter, onClick } = useWaveNavigation({
    basePath,
    activeWaveId: activeWave.id,
    setActiveWave: activeWave.set,
    onHover,
    prefetchWaveData,
    searchParams,
    waveId: wave.id,
    hasTouchScreen,
  });

  const formattedWaveName = useMemo(
    () =>
      formatWaveName({
        name: wave.name,
        type: wave.type,
      }),
    [wave.name, wave.type],
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
    />
  );
};

export default WebBrainLeftSidebarWave;

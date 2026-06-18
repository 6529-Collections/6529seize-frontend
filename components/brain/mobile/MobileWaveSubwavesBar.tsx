"use client";

import { useCallback, useEffect, useMemo } from "react";
import { TrophyIcon } from "@heroicons/react/24/solid";
import { useAuth } from "@/components/auth/Auth";
import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import { useLayout } from "@/components/brain/my-stream/layout/LayoutContext";
import WavePicture from "@/components/waves/WavePicture";
import { useMyStream } from "@/contexts/wave/MyStreamContext";
import type { ApiWave } from "@/generated/models/ApiWave";
import { ApiWaveType } from "@/generated/models/ApiWaveType";
import { useWaveSubwavesMap } from "@/hooks/useWaveSubwaves";
import type { SidebarWave, SidebarWaveContributor } from "@/types/waves.types";

interface MobileWaveSubwavesBarProps {
  readonly wave: ApiWave;
}

interface MobileWaveSubwaveItem {
  readonly id: string;
  readonly label: string;
  readonly pictureName: string;
  readonly picture: string | null;
  readonly contributors: readonly SidebarWaveContributor[];
  readonly type: ApiWaveType;
  readonly muted: boolean;
  readonly unreadDropsCount: number;
}

const EMPTY_SUBWAVES: readonly SidebarWave[] = [];

const getViewerIdentityKey = ({
  address,
  activeProfileProxyId,
}: {
  readonly address: string | null | undefined;
  readonly activeProfileProxyId: string | number | null | undefined;
}): string | null => {
  if (!address) {
    return null;
  }

  const normalizedAddress = address.toLowerCase();
  if (activeProfileProxyId !== null && activeProfileProxyId !== undefined) {
    return `${normalizedAddress}:proxy:${activeProfileProxyId}`;
  }

  return `${normalizedAddress}:primary`;
};

const formatWaveLabel = (
  name: string | null | undefined,
  fallbackId: string
) => {
  const trimmedName = name?.trim();

  if (trimmedName !== undefined && trimmedName.length > 0) {
    return trimmedName;
  }

  return fallbackId.slice(0, 8);
};

const getParentWaveItem = (wave: ApiWave): MobileWaveSubwaveItem => {
  const parentWave = wave.parent_wave;

  if (parentWave) {
    return {
      id: parentWave.id,
      label: "Main",
      pictureName: parentWave.name,
      picture: parentWave.pfp ?? null,
      contributors:
        parentWave.contributors?.map((contributor) => ({
          pfp: contributor.pfp ?? "",
          identity: contributor.handle ?? null,
        })) ?? [],
      type: parentWave.has_competition ? ApiWaveType.Rank : ApiWaveType.Chat,
      muted: parentWave.context_profile_context?.muted ?? false,
      unreadDropsCount: parentWave.context_profile_context?.unread_drops ?? 0,
    };
  }

  return {
    id: wave.id,
    label: "Main",
    pictureName: wave.name,
    picture: wave.picture,
    contributors: wave.contributors_overview.map((contributor) => ({
      pfp: contributor.contributor_pfp,
      identity: contributor.contributor_identity,
    })),
    type: wave.wave.type,
    muted: wave.metrics.muted,
    unreadDropsCount: wave.metrics.your_unread_drops_count,
  };
};

const getSidebarWaveItem = (wave: SidebarWave): MobileWaveSubwaveItem => ({
  id: wave.id,
  label: formatWaveLabel(wave.name, wave.id),
  pictureName: wave.name,
  picture: wave.picture,
  contributors: wave.contributors,
  type: wave.type,
  muted: wave.muted,
  unreadDropsCount: wave.unreadDropsCount,
});

const getActiveSubwaveFallbackItem = (
  wave: ApiWave
): MobileWaveSubwaveItem => ({
  id: wave.id,
  label: formatWaveLabel(wave.name, wave.id),
  pictureName: wave.name,
  picture: wave.picture,
  contributors: wave.contributors_overview.map((contributor) => ({
    pfp: contributor.contributor_pfp,
    identity: contributor.contributor_identity,
  })),
  type: wave.wave.type,
  muted: wave.metrics.muted,
  unreadDropsCount: wave.metrics.your_unread_drops_count,
});

function MobileWaveSubwavesBar({ wave }: MobileWaveSubwavesBarProps) {
  const { registerRef } = useLayout();
  const { activeWave } = useMyStream();
  const { address } = useSeizeConnectContext();
  const { activeProfileProxy } = useAuth();
  const currentWaveId = activeWave.id ?? wave.id;
  const isDirectMessage =
    wave.wave.type === ApiWaveType.Chat &&
    Boolean(wave.chat.scope.group?.is_direct_message);
  const rootWaveId = wave.parent_wave?.id ?? wave.id;
  const isSubwave = Boolean(wave.parent_wave);
  const shouldFetchSubwaves =
    !isDirectMessage && (isSubwave || wave.has_subwaves === true);
  const viewerIdentityKey = useMemo(
    () =>
      getViewerIdentityKey({
        address,
        activeProfileProxyId: activeProfileProxy?.id,
      }),
    [address, activeProfileProxy?.id]
  );
  const { subwavesByParentId } = useWaveSubwavesMap({
    parentWaveIds: shouldFetchSubwaves ? [rootWaveId] : [],
    viewerIdentityKey,
  });
  const fetchedSubwaves = useMemo(
    () => subwavesByParentId.get(rootWaveId)?.subwaves ?? EMPTY_SUBWAVES,
    [rootWaveId, subwavesByParentId]
  );

  const items = useMemo<MobileWaveSubwaveItem[]>(() => {
    const subwaveItems = fetchedSubwaves.map(getSidebarWaveItem);

    if (
      isSubwave &&
      !subwaveItems.some((subwaveItem) => subwaveItem.id === wave.id)
    ) {
      subwaveItems.push(getActiveSubwaveFallbackItem(wave));
    }

    return [getParentWaveItem(wave), ...subwaveItems];
  }, [fetchedSubwaves, isSubwave, wave]);

  const shouldRender =
    !isDirectMessage &&
    (isSubwave || wave.has_subwaves === true || fetchedSubwaves.length > 0);

  useEffect(() => {
    if (!shouldRender) {
      registerRef("pinned", null);
    }
  }, [registerRef, shouldRender]);

  const setBarRef = useCallback(
    (element: HTMLDivElement | null) => {
      registerRef("pinned", element);
    },
    [registerRef]
  );

  const onItemClick = useCallback(
    (item: MobileWaveSubwaveItem) => {
      if (item.id === currentWaveId) {
        return;
      }

      activeWave.set(item.id, { isDirectMessage: false });
    },
    [activeWave, currentWaveId]
  );

  if (!shouldRender) {
    return null;
  }

  return (
    <div
      ref={setBarRef}
      className="tw-sticky tw-top-0 tw-z-10 tw-bg-iron-950 tw-px-2 tw-pb-2 sm:tw-px-4 md:tw-px-6"
    >
      <div className="tw-flex tw-items-center tw-gap-1.5 tw-overflow-x-auto tw-overflow-y-hidden tw-py-1 tw-scrollbar-thin tw-scrollbar-track-iron-800 tw-scrollbar-thumb-iron-500">
        {items.map((item) => {
          const isActive = item.id === currentWaveId;
          const isDropWave = item.type !== ApiWaveType.Chat;
          const showUnreadBadge =
            !isActive && !item.muted && item.unreadDropsCount > 0;

          return (
            <button
              key={item.id}
              type="button"
              aria-current={isActive ? "page" : undefined}
              aria-label={`Open ${item.label}`}
              onClick={() => onItemClick(item)}
              className={`tw-relative tw-flex tw-h-7 tw-flex-shrink-0 tw-items-center tw-gap-1.5 tw-rounded-lg tw-border tw-border-solid tw-px-2 tw-text-left tw-transition ${
                isActive
                  ? "tw-border-primary-400/30 tw-bg-primary-500/15 tw-text-primary-300"
                  : "tw-border-iron-700 tw-bg-iron-800 tw-text-iron-200 desktop-hover:hover:tw-border-iron-600 desktop-hover:hover:tw-bg-iron-700"
              }`}
            >
              <span className="tw-relative tw-flex tw-size-4 tw-flex-shrink-0 tw-items-center tw-justify-center tw-overflow-visible tw-rounded-full tw-bg-iron-900">
                <span className="tw-size-4 tw-overflow-hidden tw-rounded-full">
                  <WavePicture
                    name={item.pictureName}
                    picture={item.picture}
                    contributors={item.contributors}
                  />
                </span>
                {isDropWave && (
                  <span className="tw-absolute -tw-bottom-0.5 -tw-right-0.5 tw-flex tw-size-2.5 tw-items-center tw-justify-center tw-rounded-full tw-bg-iron-950">
                    <TrophyIcon
                      className="tw-size-2 tw-text-[#E8D48A]"
                      aria-hidden="true"
                    />
                  </span>
                )}
              </span>
              <span className="tw-max-w-28 tw-truncate tw-text-xs tw-font-semibold">
                {item.label}
              </span>
              {showUnreadBadge && (
                <span className="tw-ml-0.5 tw-flex tw-h-4 tw-min-w-4 tw-items-center tw-justify-center tw-rounded-full tw-bg-primary-500 tw-px-1 tw-text-[10px] tw-font-semibold tw-leading-none tw-text-white">
                  {item.unreadDropsCount > 99 ? "99+" : item.unreadDropsCount}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default MobileWaveSubwavesBar;

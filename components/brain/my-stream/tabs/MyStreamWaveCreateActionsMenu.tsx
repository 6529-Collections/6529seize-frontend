"use client";

import { useMemo, useState } from "react";
import { PlusIcon } from "@heroicons/react/24/outline";
import { CompactMenu, type CompactMenuItem } from "@/components/compact-menu";
import { useAuth } from "@/components/auth/Auth";
import CreateWaveModal from "@/components/waves/create-wave/CreateWaveModal";
import type { ApiWave } from "@/generated/models/ApiWave";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import MyStreamActionTooltip from "../MyStreamActionTooltip";
import MyStreamWaveCurationCreateDialog from "./MyStreamWaveCurationCreateDialog";

interface MyStreamWaveCreateActionsMenuProps {
  readonly wave: ApiWave;
  readonly onCreated: (curationId: string) => void;
  readonly variant?: "desktop" | "mobile" | undefined;
}

export default function MyStreamWaveCreateActionsMenu({
  wave,
  onCreated,
  variant = "desktop",
}: MyStreamWaveCreateActionsMenuProps) {
  const { connectedProfile, activeProfileProxy } = useAuth();
  const locale = useBrowserLocale();
  const [isCreateCurationOpen, setIsCreateCurationOpen] = useState(false);
  const [isCreateSubwaveOpen, setIsCreateSubwaveOpen] = useState(false);
  const isDirectMessage = wave.chat?.scope?.group?.is_direct_message ?? false;
  const waveConfig = wave.wave as typeof wave.wave | null | undefined;
  const parentAdminGroup = waveConfig?.admin_group as
    | typeof wave.wave.admin_group
    | null
    | undefined;
  const parentAdminGroupId = parentAdminGroup?.group?.id ?? null;
  const canCreateCuration =
    waveConfig?.authenticated_user_eligible_for_admin === true;
  const canCreateSubwave =
    Boolean(connectedProfile) &&
    !activeProfileProxy &&
    !isDirectMessage &&
    !wave.parent_wave &&
    Boolean(parentAdminGroupId) &&
    waveConfig?.authenticated_user_eligible_for_admin === true;

  const menuItems = useMemo<CompactMenuItem[]>(
    () => [
      ...(canCreateCuration
        ? [
            {
              id: "create-curation",
              label: t(locale, "waves.create.actions.newCuration"),
              onSelect: () => setIsCreateCurationOpen(true),
            },
          ]
        : []),
      ...(canCreateSubwave
        ? [
            {
              id: "create-subwave",
              label: t(locale, "waves.create.actions.newSubwave"),
              onSelect: () => setIsCreateSubwaveOpen(true),
            },
          ]
        : []),
    ],
    [canCreateCuration, canCreateSubwave, locale]
  );

  if (menuItems.length === 0) {
    return null;
  }

  const createActionsTooltipId = `my-stream-create-actions-${wave.id}`;
  const isMobile = variant === "mobile";
  const buttonClassName = isMobile
    ? "tw-group tw-flex tw-size-11 tw-items-center tw-justify-center tw-rounded-lg tw-border-0 tw-bg-transparent tw-p-0 tw-text-iron-300 focus-visible:tw-outline-none"
    : "tw-flex tw-h-8 tw-w-8 tw-items-center tw-justify-center tw-rounded-lg tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900 tw-text-iron-200 tw-transition tw-duration-150 hover:tw-border-iron-500 hover:tw-bg-iron-800 hover:tw-text-white";
  const trigger = isMobile ? (
    <span className="tw-flex tw-size-8 tw-items-center tw-justify-center tw-rounded-md tw-bg-iron-900/80 tw-ring-1 tw-ring-inset tw-ring-white/10 tw-transition-colors tw-duration-150 group-active:tw-bg-iron-800 group-active:tw-text-white group-focus-visible:tw-ring-2 group-focus-visible:tw-ring-primary-300 group-focus-visible:tw-ring-offset-2 group-focus-visible:tw-ring-offset-black desktop-hover:group-hover:tw-bg-iron-800 desktop-hover:group-hover:tw-text-white motion-reduce:tw-transition-none">
      <PlusIcon className="tw-size-4" aria-hidden="true" />
    </span>
  ) : (
    <PlusIcon className="tw-size-4 tw-flex-shrink-0" aria-hidden="true" />
  );

  return (
    <>
      <span
        className="tw-inline-flex tw-flex-shrink-0 tw-self-center"
        {...(!isMobile && {
          "data-tooltip-id": createActionsTooltipId,
          "data-tooltip-content": t(locale, "waves.create.actions.create"),
        })}
      >
        <CompactMenu
          className="tailwind-scope tw-flex tw-flex-shrink-0"
          trigger={trigger}
          triggerClassName={buttonClassName}
          unstyledTrigger
          aria-label={t(locale, "waves.create.actions.openCreateMenu")}
          items={menuItems}
          menuWidthClassName={isMobile ? "tw-w-44" : "tw-w-52"}
          unstyledMenu
          menuClassName={`tailwind-scope tw-z-50 tw-rounded-lg tw-bg-iron-950 tw-py-0 tw-shadow-2xl tw-ring-1 tw-ring-iron-700/80 focus:tw-outline-none ${isMobile ? "tw-mt-1.5" : "tw-mt-3"}`}
          header={t(locale, "waves.create.actions.createMenuHeader")}
          headerClassName={`tw-font-medium tw-uppercase tw-leading-4 tw-tracking-widest tw-text-iron-400 ${isMobile ? "tw-px-2.5 tw-pb-1 tw-pt-1.5 tw-text-[0.6875rem]" : "tw-px-3 tw-pb-2 tw-pt-2 tw-text-xs"}`}
          itemsWrapperClassName={isMobile ? "tw-p-1.5" : "tw-p-2"}
          itemClassName={`tw-flex tw-w-full tw-items-center tw-rounded-lg tw-border-0 tw-bg-transparent tw-text-left tw-text-sm tw-font-medium tw-transition tw-duration-150 tw-ease-out ${isMobile ? "tw-min-h-10 tw-px-2.5 tw-py-1.5 tw-leading-5" : "tw-px-3 tw-py-2 tw-leading-6"}`}
          inactiveItemClassName="tw-text-iron-100 desktop-hover:hover:tw-bg-iron-800/70 desktop-hover:hover:tw-text-white"
          focusItemClassName="tw-bg-iron-800/70 tw-text-white"
          unstyledItems
        />
      </span>
      {!isMobile && <MyStreamActionTooltip id={createActionsTooltipId} />}

      {isCreateCurationOpen && (
        <MyStreamWaveCurationCreateDialog
          wave={wave}
          isOpen={isCreateCurationOpen}
          onClose={() => setIsCreateCurationOpen(false)}
          onSaved={(curation) => onCreated(curation.id)}
        />
      )}

      {connectedProfile && canCreateSubwave && (
        <CreateWaveModal
          isOpen={isCreateSubwaveOpen}
          onClose={() => setIsCreateSubwaveOpen(false)}
          profile={connectedProfile}
          parentWaveId={wave.id}
          parentAdminGroupId={parentAdminGroupId}
        />
      )}
    </>
  );
}

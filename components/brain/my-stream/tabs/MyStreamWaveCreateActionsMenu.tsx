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
  const parentAdminGroup = wave.wave.admin_group as
    | typeof wave.wave.admin_group
    | null;
  const parentAdminGroupId = parentAdminGroup?.group?.id ?? null;
  const canCreateCuration =
    wave.wave?.authenticated_user_eligible_for_admin === true;
  const canCreateSubwave =
    Boolean(connectedProfile) &&
    !activeProfileProxy &&
    !isDirectMessage &&
    !wave.parent_wave &&
    Boolean(parentAdminGroupId) &&
    wave.wave?.authenticated_user_eligible_for_admin === true;

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
    ? "tw-flex tw-size-11 tw-items-center tw-justify-center tw-rounded-lg tw-border-0 tw-bg-iron-900/80 tw-text-iron-200 tw-ring-1 tw-ring-inset tw-ring-white/10 tw-transition tw-duration-150 desktop-hover:hover:tw-bg-iron-800 desktop-hover:hover:tw-text-white focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-300 focus-visible:tw-ring-offset-2 focus-visible:tw-ring-offset-black motion-reduce:tw-transition-none"
    : "tw-flex tw-h-8 tw-w-8 tw-items-center tw-justify-center tw-rounded-lg tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900 tw-text-iron-200 tw-transition tw-duration-150 hover:tw-border-iron-500 hover:tw-bg-iron-800 hover:tw-text-white";

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
          trigger={<PlusIcon className="tw-h-4 tw-w-4 tw-flex-shrink-0" />}
          triggerClassName={buttonClassName}
          unstyledTrigger
          aria-label={t(locale, "waves.create.actions.openCreateMenu")}
          items={menuItems}
          menuWidthClassName="tw-w-52"
          unstyledMenu
          menuClassName="tailwind-scope tw-z-50 tw-mt-3 tw-rounded-lg tw-bg-iron-950 tw-py-0 tw-shadow-2xl tw-ring-1 tw-ring-iron-700/80 focus:tw-outline-none"
          header={t(locale, "waves.create.actions.createMenuHeader")}
          headerClassName="tw-px-3 tw-pb-2 tw-pt-2 tw-text-xs tw-font-medium tw-uppercase tw-leading-4 tw-tracking-widest tw-text-iron-400"
          itemsWrapperClassName="tw-p-2"
          itemClassName="tw-flex tw-w-full tw-items-center tw-rounded-lg tw-border-0 tw-bg-transparent tw-px-3 tw-py-2 tw-text-left tw-text-sm tw-font-medium tw-leading-6 tw-transition tw-duration-150 tw-ease-out"
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

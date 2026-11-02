"use client";

import {
  COMPACT_ACTION_BUTTON_CLASS,
  COMPACT_ACTION_CONTENT_CLASS,
} from "@/components/utils/button/compactActionButtonStyles";

import { useState } from "react";
import {
  ChatBubbleLeftRightIcon,
  PlusIcon,
  RectangleStackIcon,
} from "@heroicons/react/24/outline";
import { CompactMenu, type CompactMenuItem } from "@/components/compact-menu";
import CompactMenuMobileBottomSheet from "@/components/compact-menu/CompactMenuMobileBottomSheet";
import {
  ACTION_LABEL_CLASSES,
  MOBILE_ACTION_ICON_CLASSES,
  MOBILE_ACTION_ITEM_CLASSES,
} from "@/components/compact-menu/constants";
import { useAuth } from "@/components/auth/Auth";
import CreateWaveModal from "@/components/waves/create-wave/CreateWaveModal";
import type { ApiWave } from "@/generated/models/ApiWave";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import useIsMobileLayoutViewport from "@/hooks/useIsMobileLayoutViewport";
import { t } from "@/i18n/messages";
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
  const isMobileViewport = useIsMobileLayoutViewport();
  const isMobile = variant === "mobile" || isMobileViewport;
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

  const itemClassName =
    "tw-group tw-flex tw-w-full tw-items-start tw-gap-3 tw-rounded-lg tw-border-0 tw-bg-transparent tw-px-2.5 tw-py-2 tw-text-left tw-transition-colors motion-reduce:tw-transition-none";
  const iconClassName = isMobile
    ? MOBILE_ACTION_ICON_CLASSES
    : "tw-flex tw-h-5 tw-shrink-0 tw-items-center tw-justify-center tw-text-iron-400 tw-transition-colors desktop-hover:group-hover:tw-text-white motion-reduce:tw-transition-none";
  const iconSizeClassName = isMobile ? "tw-size-5" : "tw-size-[1.125rem]";

  const actionLabel = (label: string, description: string) => (
    <span className="tw-flex tw-flex-col tw-gap-0.5">
      <span className={ACTION_LABEL_CLASSES}>{label}</span>
      <span className="tw-text-xs tw-font-normal tw-leading-4 tw-text-iron-400">
        {description}
      </span>
    </span>
  );
  const menuItems: CompactMenuItem[] = [
    ...(canCreateCuration
      ? [
          {
            id: "create-curation",
            iconClassName,
            icon: (
              <RectangleStackIcon
                className={iconSizeClassName}
                aria-hidden="true"
              />
            ),
            label: actionLabel(
              t(locale, "waves.create.actions.newCuration"),
              t(locale, "waves.create.actions.curationDescription")
            ),
            onSelect: () => setIsCreateCurationOpen(true),
          },
        ]
      : []),
    ...(canCreateSubwave
      ? [
          {
            id: "create-subwave",
            iconClassName,
            icon: (
              <ChatBubbleLeftRightIcon
                className={iconSizeClassName}
                aria-hidden="true"
              />
            ),
            label: actionLabel(
              t(locale, "waves.create.actions.newSubwave"),
              t(locale, "waves.create.actions.subwaveDescription")
            ),
            onSelect: () => setIsCreateSubwaveOpen(true),
          },
        ]
      : []),
  ];

  if (menuItems.length === 0) {
    return null;
  }

  const buttonClassName = `${COMPACT_ACTION_BUTTON_CLASS} ${isMobile ? "tw-min-h-11" : "tw-h-8"}`;
  const trigger = (
    <span className={COMPACT_ACTION_CONTENT_CLASS}>
      <PlusIcon className="-tw-ml-1 tw-size-4 tw-shrink-0" aria-hidden="true" />
      <span>{t(locale, "waves.create.actions.create")}</span>
    </span>
  );

  return (
    <>
      <span className="tw-inline-flex tw-shrink-0 tw-self-center">
        {isMobile ? (
          <CompactMenuMobileBottomSheet
            title={t(locale, "waves.create.actions.createMenuHeader")}
            ariaLabel={t(locale, "waves.create.actions.openCreateMenu")}
            trigger={trigger}
            triggerClassName={buttonClassName}
            items={menuItems}
            itemClassName={`${MOBILE_ACTION_ITEM_CLASSES} tw-px-0`}
          />
        ) : (
          <CompactMenu
            className="tailwind-scope tw-flex tw-flex-shrink-0"
            trigger={trigger}
            triggerClassName={buttonClassName}
            unstyledTrigger
            autoFocusItem={false}
            aria-label={t(locale, "waves.create.actions.openCreateMenu")}
            items={menuItems}
            menuWidthClassName="tw-w-80"
            unstyledMenu
            menuClassName="tailwind-scope tw-z-50 tw-mt-2 tw-rounded-xl tw-bg-iron-950 tw-py-0 tw-shadow-2xl tw-ring-1 tw-ring-iron-700/80 focus:tw-outline-none"
            header={t(locale, "waves.create.actions.createMenuHeader")}
            headerClassName="tw-px-2.5 tw-py-1 tw-text-sm tw-font-semibold tw-text-iron-100"
            itemsWrapperClassName="tw-p-2"
            itemClassName={`${itemClassName} tw-text-sm`}
            inactiveItemClassName="tw-text-iron-100 desktop-hover:hover:tw-bg-iron-800/70 desktop-hover:hover:tw-text-white"
            focusItemClassName="tw-bg-iron-800/70 tw-text-white"
            unstyledItems
          />
        )}
      </span>

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
          parentWaveName={wave.name}
          parentAdminGroupId={parentAdminGroupId}
          parentViewGroupId={wave.visibility.scope.group?.id ?? null}
        />
      )}
    </>
  );
}

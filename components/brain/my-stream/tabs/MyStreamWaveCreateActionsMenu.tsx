"use client";

import { WAVE_HEADER_TEXT_ACTION_SURFACE_CLASSES } from "@/components/brain/left-sidebar/waves/WaveHeaderActions";
import { COMPACT_ACTION_BUTTON_CLASS } from "@/components/utils/button/compactActionButtonStyles";

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
import CreateWaveModal from "@/components/waves/create-wave/LazyCreateWaveModal";
import type { ApiWave } from "@/generated/models/ApiWave";
import { isWaveDirectMessage } from "@/helpers/waves/wave.helpers";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import useIsMobileLayoutViewport from "@/hooks/useIsMobileLayoutViewport";
import { useWaveCreationPaused } from "@/hooks/useWavesMovePhase";
import { t } from "@/i18n/messages";
import MyStreamWaveCurationCreateDialog from "./MyStreamWaveCurationCreateDialog";

interface MyStreamWaveCreateActionsMenuProps {
  readonly wave: ApiWave;
  readonly onCreated: (curationId: string) => void;
  readonly variant?: "desktop" | "mobile" | undefined;
}

export function useWaveCreateMenuActions({
  wave,
  onCreated,
  mobile,
  includeCuration = true,
}: {
  readonly wave: ApiWave | undefined;
  readonly onCreated?: ((curationId: string) => void) | undefined;
  readonly mobile: boolean;
  readonly includeCuration?: boolean;
}) {
  const { connectedProfile, activeProfileProxy, setToast } = useAuth();
  const locale = useBrowserLocale();
  const [action, setAction] = useState<{
    readonly waveId: string;
    readonly kind: "curation" | "subwave";
  } | null>(null);
  const activeAction = action?.waveId === wave?.id ? action : null;
  if (action && !activeAction) setAction(null);
  const openAction = (kind: "curation" | "subwave") => {
    if (wave) setAction({ waveId: wave.id, kind });
  };
  const closeAction = () => setAction(null);
  const isDirectMessage = wave ? isWaveDirectMessage(wave.id, wave) : false;
  // New subwaves move to the 6529 Network with the other waves.
  const wavesWritesPaused = useWaveCreationPaused();
  const waveConfig = wave?.wave as ApiWave["wave"] | null | undefined;
  const parentAdminGroup = waveConfig?.admin_group as
    | ApiWave["wave"]["admin_group"]
    | null
    | undefined;
  const parentAdminGroupId = parentAdminGroup?.group?.id ?? null;
  const isWaveAdmin =
    waveConfig?.authenticated_user_eligible_for_admin === true;
  const canCreateCuration = includeCuration && isWaveAdmin;
  const mayCreateSubwave =
    isWaveAdmin &&
    Boolean(connectedProfile) &&
    !activeProfileProxy &&
    !isDirectMessage &&
    !wave?.parent_wave &&
    Boolean(parentAdminGroupId);
  const canCreateSubwave = mayCreateSubwave && !wavesWritesPaused;

  const iconClassName = mobile
    ? MOBILE_ACTION_ICON_CLASSES
    : "tw-flex tw-h-5 tw-shrink-0 tw-items-center tw-justify-center tw-text-iron-400 tw-transition-colors desktop-hover:group-hover:tw-text-white motion-reduce:tw-transition-none";
  const iconSizeClassName = mobile ? "tw-size-5" : "tw-size-[1.125rem]";

  const actionLabel = (label: string, description: string) => (
    <span className="tw-flex tw-flex-col tw-gap-0.5">
      <span className={ACTION_LABEL_CLASSES}>{label}</span>
      {!mobile && (
        <span className="tw-text-xs tw-font-normal tw-leading-4 tw-text-iron-400">
          {description}
        </span>
      )}
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
            onSelect: () => openAction("curation"),
            deferUntilClosed: true,
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
            onSelect: () => openAction("subwave"),
            deferUntilClosed: true,
          },
        ]
      : []),
    // While waves move, the item stays, says why it can't open, and says it
    // again when chosen, so keyboard users reach the reason too.
    ...(mayCreateSubwave && wavesWritesPaused
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
            label: (
              <span className="tw-flex tw-flex-col tw-gap-0.5 tw-opacity-60">
                <span className={ACTION_LABEL_CLASSES}>
                  {t(locale, "waves.create.actions.newSubwave")}
                </span>
                <span className="tw-text-xs tw-font-normal tw-leading-4 tw-text-iron-400">
                  {t(locale, "wavesMove.newWavesClosed")}
                </span>
              </span>
            ),
            onSelect: () =>
              setToast({
                message: t(locale, "wavesMove.newWavesClosed"),
                type: "warning",
              }),
          },
        ]
      : []),
  ];

  const dialogs = (
    <>
      {wave && canCreateCuration && activeAction?.kind === "curation" && (
        <MyStreamWaveCurationCreateDialog
          mobileSheet
          wave={wave}
          isOpen
          onClose={closeAction}
          onSaved={(curation) => onCreated?.(curation.id)}
        />
      )}

      {wave && connectedProfile && canCreateSubwave && (
        <CreateWaveModal
          mobileSheet
          isOpen={activeAction?.kind === "subwave"}
          onClose={closeAction}
          profile={connectedProfile}
          parentWaveId={wave.id}
          parentWaveName={wave.name}
          parentAdminGroupId={parentAdminGroupId}
          parentViewGroupId={wave.visibility.scope.group?.id ?? null}
        />
      )}
    </>
  );

  return { items: menuItems, dialogs };
}

export default function MyStreamWaveCreateActionsMenu({
  wave,
  onCreated,
  variant = "desktop",
}: MyStreamWaveCreateActionsMenuProps) {
  const locale = useBrowserLocale();
  const isMobileViewport = useIsMobileLayoutViewport();
  const isMobile = variant === "mobile" || isMobileViewport;
  const { items, dialogs } = useWaveCreateMenuActions({
    wave,
    onCreated,
    mobile: isMobile,
  });

  if (items.length === 0) {
    return null;
  }

  const itemClassName =
    "tw-group tw-flex tw-w-full tw-items-start tw-gap-3 tw-rounded-lg tw-border-0 tw-bg-transparent tw-px-2.5 tw-py-2 tw-text-left tw-transition-colors motion-reduce:tw-transition-none";

  const buttonClassName = `${COMPACT_ACTION_BUTTON_CLASS} ${isMobile ? "tw-min-h-11" : "tw-h-8"}`;
  const trigger = (
    <span className={WAVE_HEADER_TEXT_ACTION_SURFACE_CLASSES}>
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
            items={items}
            itemClassName={`${MOBILE_ACTION_ITEM_CLASSES} tw-px-3`}
          />
        ) : (
          <CompactMenu
            className="tailwind-scope tw-flex tw-flex-shrink-0"
            trigger={trigger}
            triggerClassName={buttonClassName}
            unstyledTrigger
            autoFocusItem={false}
            aria-label={t(locale, "waves.create.actions.openCreateMenu")}
            items={items}
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

      {dialogs}
    </>
  );
}

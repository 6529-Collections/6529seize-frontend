"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Cog6ToothIcon,
  EllipsisVerticalIcon,
} from "@heroicons/react/24/outline";
import { CompactMenu, type CompactMenuItem } from "@/components/compact-menu";
import CompactMenuMobileBottomSheet from "@/components/compact-menu/CompactMenuMobileBottomSheet";
import { useAuth } from "@/components/auth/Auth";
import MobileWrapperConfirmationDialog from "@/components/mobile-wrapper-dialog/MobileWrapperConfirmationDialog";
import Button from "@/components/utils/button/Button";
import type { ApiWave } from "@/generated/models/ApiWave";
import type { ApiWaveCuration } from "@/generated/models/ApiWaveCuration";
import type { DropCurationMembership } from "@/hooks/drops/useDropCurations";
import { getToastErrorDetails } from "@/helpers/toast.helpers";
import { invalidateProfileWaveQueries } from "@/hooks/useProfileWave";
import { getWaveCurationsQueryKey } from "@/hooks/waves/useWaveCurations";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import useIsMobileLayoutViewport from "@/hooks/useIsMobileLayoutViewport";
import { useProfileWaveMutation } from "@/hooks/useProfileWaveMutation";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { commonApiDelete } from "@/services/api/common-api";
import MyStreamWaveCurationCreateDialog from "./MyStreamWaveCurationCreateDialog";

interface MyStreamWaveCurationTabMenuProps {
  readonly wave: ApiWave;
  readonly curation: ApiWaveCuration;
  readonly onDeleted?: (() => Promise<void> | void) | undefined;
  readonly canSetAsProfileCuration?: boolean | undefined;
  readonly isSetAsProfileCurationPending?: boolean | undefined;
  readonly leadingItems?: readonly CompactMenuItem[] | undefined;
  readonly triggerAriaLabel?: string | undefined;
  readonly triggerVariant?: "configuration" | "tabs" | undefined;
  readonly triggerLabel?: string | undefined;
  readonly permissionMode?: "standard" | "profile" | undefined;
  readonly canChooseAnotherCuration?: boolean | undefined;
  readonly onChooseAnotherCuration?: (() => void) | undefined;
  readonly onChooseAnotherSourceWave?: (() => void) | undefined;
  readonly onHideFromProfile?: (() => void) | undefined;
  readonly isProfileActionPending?: boolean | undefined;
}

const EMPTY_MENU_ITEMS: readonly CompactMenuItem[] = [];
const CONFIGURATION_TRIGGER_CLASS_NAME =
  "tw-flex tw-size-11 tw-flex-shrink-0 tw-items-center tw-justify-center tw-rounded-lg tw-border-0 tw-bg-transparent tw-p-0 tw-text-iron-500 tw-transition-all tw-duration-300 tw-ease-out hover:tw-bg-iron-800 focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 desktop-hover:hover:tw-text-iron-300 disabled:tw-cursor-not-allowed disabled:tw-opacity-40 sm:tw-size-7";
const DEFAULT_TRIGGER_CLASS_NAME =
  "tw-inline-flex tw-size-8 tw-flex-shrink-0 tw-items-center tw-justify-center tw-rounded-full tw-border-0 tw-bg-transparent tw-text-iron-400 tw-transition hover:tw-bg-iron-800 hover:tw-text-iron-300 disabled:tw-cursor-not-allowed disabled:tw-opacity-40";

const getTriggerClassName = ({
  isConfiguration,
  hasTriggerLabel,
}: {
  readonly isConfiguration: boolean;
  readonly hasTriggerLabel: boolean;
}): string | undefined => {
  if (isConfiguration) {
    return CONFIGURATION_TRIGGER_CLASS_NAME;
  }

  return hasTriggerLabel ? undefined : DEFAULT_TRIGGER_CLASS_NAME;
};

const getErrorMessage = (error: unknown, fallback: string): string =>
  error instanceof Error ? error.message : fallback;

const getCurationMenuItems = ({
  leadingItems,
  locale,
  hasProfileActions,
  canChooseAnotherCuration,
  canSetAsProfileCuration,
  isProfileActionPending,
  isSettingProfileCuration,
  onChooseAnotherCuration,
  onChooseAnotherSourceWave,
  onHideFromProfile,
  onEdit,
  onSetAsProfileCuration,
  onDelete,
}: {
  readonly leadingItems: readonly CompactMenuItem[];
  readonly locale: SupportedLocale;
  readonly hasProfileActions: boolean;
  readonly canChooseAnotherCuration: boolean;
  readonly canSetAsProfileCuration: boolean;
  readonly isProfileActionPending: boolean;
  readonly isSettingProfileCuration: boolean;
  readonly onChooseAnotherCuration?: (() => void) | undefined;
  readonly onChooseAnotherSourceWave?: (() => void) | undefined;
  readonly onHideFromProfile?: (() => void) | undefined;
  readonly onEdit: () => void;
  readonly onSetAsProfileCuration: () => void;
  readonly onDelete: () => void;
}): CompactMenuItem[] => {
  const items: CompactMenuItem[] = [...leadingItems];

  if (hasProfileActions) {
    items.push({
      id: "profile-actions",
      kind: "section",
      label: t(locale, "profileCuration.manage.profileSection"),
    });

    if (canChooseAnotherCuration && onChooseAnotherCuration) {
      items.push({
        id: "choose-curation",
        label: t(locale, "profileCuration.manage.chooseCuration"),
        onSelect: onChooseAnotherCuration,
        disabled: isProfileActionPending,
      });
    }

    if (onChooseAnotherSourceWave) {
      items.push({
        id: "choose-source-wave",
        label: t(locale, "profileCuration.manage.chooseSourceWave"),
        onSelect: onChooseAnotherSourceWave,
        disabled: isProfileActionPending,
      });
    }

    if (onHideFromProfile) {
      items.push({
        id: "hide-from-profile",
        label: t(locale, "profileCuration.manage.hideFromProfile"),
        onSelect: onHideFromProfile,
        disabled: isProfileActionPending,
      });
    }

    items.push({
      id: "curation-actions",
      kind: "section",
      label: t(locale, "profileCuration.manage.curationSection"),
    });
  }

  items.push({
    id: "edit",
    label: t(locale, "profileCuration.manage.edit"),
    onSelect: onEdit,
  });

  if (canSetAsProfileCuration) {
    items.push({
      id: "set-profile-curation",
      label: t(locale, "profileCuration.manage.showOnProfile"),
      onSelect: onSetAsProfileCuration,
      disabled: isSettingProfileCuration,
    });
  }

  items.push({
    id: "delete",
    label: t(locale, "profileCuration.manage.delete"),
    onSelect: onDelete,
    className: "tw-text-red desktop-hover:hover:tw-text-red",
  });

  return items;
};

export default function MyStreamWaveCurationTabMenu({
  wave,
  curation,
  onDeleted,
  canSetAsProfileCuration = false,
  isSetAsProfileCurationPending = false,
  leadingItems = EMPTY_MENU_ITEMS,
  triggerAriaLabel = "Curation options",
  triggerVariant = "tabs",
  triggerLabel,
  permissionMode = "standard",
  canChooseAnotherCuration = false,
  onChooseAnotherCuration,
  onChooseAnotherSourceWave,
  onHideFromProfile,
  isProfileActionPending = false,
}: MyStreamWaveCurationTabMenuProps) {
  const queryClient = useQueryClient();
  const { connectedProfile, requestAuth, setToast } = useAuth();
  const locale = useBrowserLocale();
  const { updateProfileWave, isPending: isProfileWavePending } =
    useProfileWaveMutation(connectedProfile);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const isMobileLayoutViewport = useIsMobileLayoutViewport();
  const isSettingProfileCuration =
    isSetAsProfileCurationPending || isProfileWavePending;

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const auth = await requestAuth();
      if (!auth.success) {
        throw new Error(
          t(locale, "profileCuration.manage.deleteAuthCancelled")
        );
      }

      await commonApiDelete({
        endpoint: `waves/${wave.id}/curations/${curation.id}`,
      });
    },
    onSuccess: async () => {
      let didProfileCleanupFail = false;
      let profileCleanupError: unknown;
      try {
        await onDeleted?.();
      } catch (error) {
        didProfileCleanupFail = true;
        profileCleanupError = error;
      }

      queryClient.setQueryData<ApiWaveCuration[]>(
        getWaveCurationsQueryKey(wave.id),
        (current) => current?.filter((item) => item.id !== curation.id)
      );
      queryClient.setQueriesData<DropCurationMembership[]>(
        { queryKey: ["drop-curations"] },
        (current) => current?.filter((item) => item.id !== curation.id)
      );
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: getWaveCurationsQueryKey(wave.id),
        }),
        queryClient.invalidateQueries({
          queryKey: ["drop-curations"],
        }),
        invalidateProfileWaveQueries(queryClient, [
          connectedProfile,
          wave.author,
        ]),
      ]);
      setIsDeleteOpen(false);

      if (didProfileCleanupFail) {
        setToast({
          type: "error",
          title: t(locale, "profileCuration.manage.profileCleanupErrorTitle"),
          description: t(
            locale,
            "profileCuration.manage.profileCleanupErrorDescription"
          ),
          details: getToastErrorDetails(
            profileCleanupError,
            getErrorMessage(
              profileCleanupError,
              t(locale, "profileCuration.toast.updateFailed")
            )
          ),
        });
        return;
      }

      setToast({
        type: "success",
        message: t(locale, "profileCuration.manage.deleteSuccess"),
      });
    },
    onError: (error) => {
      setToast({
        type: "error",
        title: t(locale, "profileCuration.manage.deleteErrorTitle"),
        description: t(locale, "profileCuration.manage.deleteErrorDescription"),
        details: getToastErrorDetails(
          error,
          getErrorMessage(
            error,
            t(locale, "profileCuration.manage.deleteErrorFallback")
          )
        ),
      });
    },
  });

  const hasProfileActions =
    onChooseAnotherCuration !== undefined ||
    onChooseAnotherSourceWave !== undefined ||
    onHideFromProfile !== undefined;
  const menuItems = getCurationMenuItems({
    leadingItems,
    locale,
    hasProfileActions,
    canChooseAnotherCuration,
    canSetAsProfileCuration,
    isProfileActionPending,
    isSettingProfileCuration,
    onChooseAnotherCuration,
    onChooseAnotherSourceWave,
    onHideFromProfile,
    onEdit: () => setIsEditOpen(true),
    onSetAsProfileCuration: () => {
      void updateProfileWave(wave.id, curation.id);
    },
    onDelete: () => setIsDeleteOpen(true),
  });
  const shouldUseMobileBottomSheet =
    hasProfileActions && isMobileLayoutViewport;
  const isMenuDisabled =
    deleteMutation.isPending ||
    isSettingProfileCuration ||
    isProfileActionPending;
  const isConfiguration = triggerVariant === "configuration";
  const triggerClassName = getTriggerClassName({
    isConfiguration,
    hasTriggerLabel: Boolean(triggerLabel),
  });
  const triggerContent = isConfiguration ? (
    <Cog6ToothIcon aria-hidden="true" className="tw-size-5" />
  ) : (
    <>
      <EllipsisVerticalIcon className="-tw-ml-1 tw-block tw-size-4 tw-flex-shrink-0" />
      {triggerLabel && <span>{triggerLabel}</span>}
    </>
  );

  return (
    <>
      {shouldUseMobileBottomSheet ? (
        <CompactMenuMobileBottomSheet
          title={triggerLabel ?? t(locale, "profileCuration.header.manage")}
          ariaLabel={t(locale, "profileCuration.manage.menuAria")}
          items={menuItems}
          trigger={triggerContent}
          renderTriggerButton={({
            ariaLabel,
            ariaExpanded,
            disabled,
            onClick,
          }) => (
            <Button
              variant="tertiary"
              size="sm"
              aria-label={ariaLabel}
              aria-haspopup="dialog"
              aria-expanded={ariaExpanded}
              disabled={disabled}
              onClick={onClick}
            >
              {triggerContent}
            </Button>
          )}
          disabled={isMenuDisabled}
        />
      ) : (
        <CompactMenu
          triggerClassName={triggerClassName}
          trigger={
            triggerLabel && !isConfiguration ? (
              <Button variant="tertiary" size="sm">
                {triggerContent}
              </Button>
            ) : (
              triggerContent
            )
          }
          triggerAsChild={!!triggerLabel && !isConfiguration}
          aria-label={
            isConfiguration
              ? triggerAriaLabel
              : t(locale, "profileCuration.manage.menuAria")
          }
          items={menuItems}
          itemsWrapperClassName={hasProfileActions ? "tw-pt-2" : undefined}
          menuWidthClassName={isConfiguration ? "tw-w-52" : "tw-w-64"}
          disabled={isMenuDisabled}
        />
      )}

      {isEditOpen && (
        <MyStreamWaveCurationCreateDialog
          wave={wave}
          isOpen={isEditOpen}
          onClose={() => setIsEditOpen(false)}
          onSaved={() => undefined}
          curation={curation}
          permissionMode={permissionMode}
        />
      )}

      <MobileWrapperConfirmationDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={() => deleteMutation.mutate()}
        title={t(locale, "profileCuration.manage.deleteTitle")}
        message={t(locale, "profileCuration.manage.deleteMessage", {
          curationName: curation.name,
        })}
        confirmText={t(locale, "profileCuration.manage.delete")}
        confirmVariant="destructive"
        isConfirming={deleteMutation.isPending}
      />
    </>
  );
}

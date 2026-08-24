"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { EllipsisVerticalIcon } from "@heroicons/react/24/outline";
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
import useIsMobileLayoutViewport from "@/hooks/useIsMobileLayoutViewport";
import { useProfileWaveMutation } from "@/hooks/useProfileWaveMutation";
import { commonApiDelete } from "@/services/api/common-api";
import MyStreamWaveCurationCreateDialog from "./MyStreamWaveCurationCreateDialog";

interface MyStreamWaveCurationTabMenuProps {
  readonly wave: ApiWave;
  readonly curation: ApiWaveCuration;
  readonly onDeleted?: (() => Promise<void> | void) | undefined;
  readonly canSetAsProfileCuration?: boolean | undefined;
  readonly isSetAsProfileCurationPending?: boolean | undefined;
  readonly triggerLabel?: string | undefined;
  readonly permissionMode?: "standard" | "profile" | undefined;
  readonly canChooseAnotherCuration?: boolean | undefined;
  readonly onChooseAnotherCuration?: (() => void) | undefined;
  readonly onChooseAnotherSourceWave?: (() => void) | undefined;
  readonly onHideFromProfile?: (() => void) | undefined;
  readonly isProfileActionPending?: boolean | undefined;
}

const getErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : "Failed to delete curation.";

const getCurationMenuItems = ({
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
  const items: CompactMenuItem[] = [];

  if (hasProfileActions) {
    items.push({
      id: "profile-actions",
      kind: "section",
      label: "Shown on profile",
    });

    if (canChooseAnotherCuration && onChooseAnotherCuration) {
      items.push({
        id: "choose-curation",
        label: "Choose another Curation",
        onSelect: onChooseAnotherCuration,
        disabled: isProfileActionPending,
      });
    }

    if (onChooseAnotherSourceWave) {
      items.push({
        id: "choose-source-wave",
        label: "Use another source Wave",
        onSelect: onChooseAnotherSourceWave,
        disabled: isProfileActionPending,
      });
    }

    if (onHideFromProfile) {
      items.push({
        id: "hide-from-profile",
        label: "Hide from profile",
        onSelect: onHideFromProfile,
        disabled: isProfileActionPending,
      });
    }

    items.push({
      id: "curation-actions",
      kind: "section",
      label: "This Curation",
    });
  }

  items.push({
    id: "edit",
    label: "Edit Curation",
    onSelect: onEdit,
  });

  if (canSetAsProfileCuration) {
    items.push({
      id: "set-profile-curation",
      label: "Show on profile",
      onSelect: onSetAsProfileCuration,
      disabled: isSettingProfileCuration,
    });
  }

  items.push({
    id: "delete",
    label: "Delete Curation",
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
        throw new Error("Authentication was cancelled.");
      }

      await commonApiDelete({
        endpoint: `waves/${wave.id}/curations/${curation.id}`,
      });
    },
    onSuccess: async () => {
      await onDeleted?.();
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
      setToast({
        type: "success",
        message: "Curation deleted. The source Wave remains.",
      });
      setIsDeleteOpen(false);
    },
    onError: (error) => {
      setToast({
        type: "error",
        title: "Couldn't delete this curation.",
        description: "Please try again.",
        details: getToastErrorDetails(error, getErrorMessage(error)),
      });
    },
  });

  const hasProfileActions =
    onChooseAnotherCuration !== undefined ||
    onChooseAnotherSourceWave !== undefined ||
    onHideFromProfile !== undefined;
  const menuItems = getCurationMenuItems({
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
  const triggerContent = (
    <>
      <EllipsisVerticalIcon className="-tw-ml-1 tw-block tw-size-4 tw-flex-shrink-0" />
      {triggerLabel && <span>{triggerLabel}</span>}
    </>
  );

  return (
    <>
      {shouldUseMobileBottomSheet ? (
        <CompactMenuMobileBottomSheet
          title={triggerLabel ?? "Manage"}
          ariaLabel="Curation options"
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
          triggerClassName={
            triggerLabel
              ? undefined
              : "tw-inline-flex tw-size-8 tw-flex-shrink-0 tw-items-center tw-justify-center tw-rounded-full tw-border-0 tw-bg-transparent tw-text-iron-400 tw-transition hover:tw-bg-iron-800 hover:tw-text-iron-300 disabled:tw-cursor-not-allowed disabled:tw-opacity-40"
          }
          trigger={
            triggerLabel ? (
              <Button variant="tertiary" size="sm">
                {triggerContent}
              </Button>
            ) : (
              triggerContent
            )
          }
          triggerAsChild={!!triggerLabel}
          aria-label="Curation options"
          items={menuItems}
          itemsWrapperClassName={hasProfileActions ? "tw-pt-2" : undefined}
          menuWidthClassName="tw-w-64"
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
        title="Delete Curation?"
        message={`Delete “${curation.name}”? The Curation will be deleted and removed from your profile. Its source Wave and posts will remain.`}
        confirmText="Delete Curation"
        confirmVariant="destructive"
        isConfirming={deleteMutation.isPending}
      />
    </>
  );
}

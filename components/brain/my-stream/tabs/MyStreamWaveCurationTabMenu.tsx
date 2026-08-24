"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Cog6ToothIcon,
  EllipsisVerticalIcon,
} from "@heroicons/react/24/outline";
import { CompactMenu, type CompactMenuItem } from "@/components/compact-menu";
import { useAuth } from "@/components/auth/Auth";
import CommonConfirmationModal from "@/components/utils/modal/CommonConfirmationModal";
import type { ApiWave } from "@/generated/models/ApiWave";
import type { ApiWaveCuration } from "@/generated/models/ApiWaveCuration";
import type { DropCurationMembership } from "@/hooks/drops/useDropCurations";
import { getToastErrorDetails } from "@/helpers/toast.helpers";
import { invalidateProfileWaveQueries } from "@/hooks/useProfileWave";
import { getWaveCurationsQueryKey } from "@/hooks/waves/useWaveCurations";
import { useProfileWaveMutation } from "@/hooks/useProfileWaveMutation";
import { commonApiDelete } from "@/services/api/common-api";
import MyStreamWaveCurationCreateDialog from "./MyStreamWaveCurationCreateDialog";

interface MyStreamWaveCurationTabMenuProps {
  readonly wave: ApiWave;
  readonly curation: ApiWaveCuration;
  readonly onDeleted?: (() => void) | undefined;
  readonly canSetAsProfileCuration?: boolean | undefined;
  readonly isSetAsProfileCurationPending?: boolean | undefined;
  readonly leadingItems?: readonly CompactMenuItem[] | undefined;
  readonly triggerAriaLabel?: string | undefined;
  readonly triggerVariant?: "configuration" | "tabs" | undefined;
}

const EMPTY_MENU_ITEMS: readonly CompactMenuItem[] = [];

const getErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : "Failed to delete curation.";

export default function MyStreamWaveCurationTabMenu({
  wave,
  curation,
  onDeleted,
  canSetAsProfileCuration = false,
  isSetAsProfileCurationPending = false,
  leadingItems = EMPTY_MENU_ITEMS,
  triggerAriaLabel = "Curation options",
  triggerVariant = "tabs",
}: MyStreamWaveCurationTabMenuProps) {
  const queryClient = useQueryClient();
  const { connectedProfile, requestAuth, setToast } = useAuth();
  const { updateProfileWave, isPending: isProfileWavePending } =
    useProfileWaveMutation(connectedProfile);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
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
        message: "Curation deleted.",
      });
      setIsDeleteOpen(false);
      onDeleted?.();
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

  const menuItems: CompactMenuItem[] = [
    ...leadingItems,
    {
      id: "edit",
      label: "Edit curation",
      onSelect: () => setIsEditOpen(true),
    },
    ...(canSetAsProfileCuration
      ? [
          {
            id: "set-profile-curation",
            label: "Set as profile curation",
            onSelect: () => {
              void updateProfileWave(wave.id, curation.id);
            },
            disabled: isSettingProfileCuration,
          },
        ]
      : []),
    {
      id: "delete",
      label: "Delete curation",
      onSelect: () => setIsDeleteOpen(true),
      className: "tw-text-red desktop-hover:hover:tw-text-red",
    },
  ];
  const isConfiguration = triggerVariant === "configuration";
  const triggerClassName = isConfiguration
    ? "tw-flex tw-size-11 tw-flex-shrink-0 tw-items-center tw-justify-center tw-rounded-lg tw-border-0 tw-bg-transparent tw-p-0 tw-text-iron-500 tw-transition-all tw-duration-300 tw-ease-out hover:tw-bg-iron-800 focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 desktop-hover:hover:tw-text-iron-300 disabled:tw-cursor-not-allowed disabled:tw-opacity-40 sm:tw-size-7"
    : "tw-inline-flex tw-h-8 tw-w-4 tw-flex-shrink-0 tw-items-center tw-justify-center tw-border-0 tw-bg-transparent tw-text-iron-400 tw-transition hover:tw-text-iron-300 disabled:tw-cursor-not-allowed disabled:tw-opacity-40";
  const trigger = isConfiguration ? (
    <Cog6ToothIcon aria-hidden="true" className="tw-size-5" />
  ) : (
    <EllipsisVerticalIcon className="tw-mt-0.5 tw-block tw-size-4 tw-flex-shrink-0" />
  );

  return (
    <>
      <CompactMenu
        triggerClassName={triggerClassName}
        trigger={trigger}
        aria-label={triggerAriaLabel}
        items={menuItems}
        menuWidthClassName="tw-w-52"
        disabled={deleteMutation.isPending || isSettingProfileCuration}
      />

      {isEditOpen && (
        <MyStreamWaveCurationCreateDialog
          wave={wave}
          isOpen={isEditOpen}
          onClose={() => setIsEditOpen(false)}
          onSaved={() => undefined}
          curation={curation}
        />
      )}

      <CommonConfirmationModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={() => deleteMutation.mutate()}
        title="Delete curation"
        message={`Delete "${curation.name}" from this wave?`}
        confirmText="Delete"
        isConfirming={deleteMutation.isPending}
      />
    </>
  );
}

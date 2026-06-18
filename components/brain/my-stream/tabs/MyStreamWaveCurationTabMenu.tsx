"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { EllipsisVerticalIcon } from "@heroicons/react/24/outline";
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
}

const getErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : "Failed to delete curation.";

export default function MyStreamWaveCurationTabMenu({
  wave,
  curation,
  onDeleted,
  canSetAsProfileCuration = false,
  isSetAsProfileCurationPending = false,
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
      await queryClient.invalidateQueries({
        queryKey: getWaveCurationsQueryKey(wave.id),
      });
      await queryClient.invalidateQueries({
        queryKey: ["drop-curations"],
      });
      await invalidateProfileWaveQueries(queryClient, [
        connectedProfile,
        wave.author,
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

  return (
    <>
      <CompactMenu
        triggerClassName="tw-inline-flex tw-h-8 tw-w-4 tw-flex-shrink-0 tw-items-center tw-justify-center tw-border-0 tw-bg-transparent tw-text-iron-400 tw-transition hover:tw-text-iron-300 disabled:tw-cursor-not-allowed disabled:tw-opacity-40"
        trigger={
          <EllipsisVerticalIcon className="tw-mt-0.5 tw-block tw-size-4 tw-flex-shrink-0" />
        }
        aria-label="Curation options"
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

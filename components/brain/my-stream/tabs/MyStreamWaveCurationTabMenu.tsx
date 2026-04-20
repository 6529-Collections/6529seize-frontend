"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  EllipsisVerticalIcon,
} from "@heroicons/react/24/outline";
import { CompactMenu, type CompactMenuItem } from "@/components/compact-menu";
import { useAuth } from "@/components/auth/Auth";
import CommonConfirmationModal from "@/components/utils/modal/CommonConfirmationModal";
import type { ApiWave } from "@/generated/models/ApiWave";
import type { ApiWaveCuration } from "@/generated/models/ApiWaveCuration";
import type { DropCurationMembership } from "@/hooks/drops/useDropCurations";
import { getWaveCurationsQueryKey } from "@/hooks/waves/useWaveCurations";
import type { WaveCurationMoveDirection } from "@/hooks/waves/useWaveCurationReorderMutation";
import { commonApiDelete } from "@/services/api/common-api";
import MyStreamWaveCurationCreateDialog from "./MyStreamWaveCurationCreateDialog";

interface MyStreamWaveCurationTabMenuProps {
  readonly wave: ApiWave;
  readonly curation: ApiWaveCuration;
  readonly onDeleted?: (() => void) | undefined;
  readonly onMove?:
    | ((direction: WaveCurationMoveDirection) => void)
    | undefined;
  readonly canMovePrevious?: boolean | undefined;
  readonly canMoveNext?: boolean | undefined;
  readonly isMovePending?: boolean | undefined;
}

const getErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : "Failed to delete curation.";

export default function MyStreamWaveCurationTabMenu({
  wave,
  curation,
  onDeleted,
  onMove,
  canMovePrevious = false,
  canMoveNext = false,
  isMovePending = false,
}: MyStreamWaveCurationTabMenuProps) {
  const queryClient = useQueryClient();
  const { requestAuth, setToast } = useAuth();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

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
        message: getErrorMessage(error),
      });
    },
  });

  const moveItems: CompactMenuItem[] =
    onMove === undefined
      ? []
      : [
          {
            id: "move-left",
            label: "Move left",
            icon: <ArrowLeftIcon className="tw-h-4 tw-w-4" />,
            onSelect: () => onMove("previous"),
            disabled: isMovePending || !canMovePrevious,
          },
          {
            id: "move-right",
            label: "Move right",
            icon: <ArrowRightIcon className="tw-h-4 tw-w-4" />,
            onSelect: () => onMove("next"),
            disabled: isMovePending || !canMoveNext,
          },
        ];

  const menuItems: CompactMenuItem[] = [
    ...moveItems,
    {
      id: "edit",
      label: "Edit curation",
      onSelect: () => setIsEditOpen(true),
    },
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
        triggerClassName="tw-mx-0.5 tw-flex tw-h-8 tw-w-7 tw-items-center tw-justify-center tw-rounded-lg tw-border-0 tw-bg-transparent tw-text-iron-500 tw-transition hover:tw-bg-iron-900 hover:tw-text-iron-200"
        trigger={<EllipsisVerticalIcon className="tw-h-4 tw-w-4" />}
        aria-label={`${curation.name} curation options`}
        items={menuItems}
        menuWidthClassName="tw-w-44"
        disabled={deleteMutation.isPending}
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

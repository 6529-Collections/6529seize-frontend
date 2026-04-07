"use client";

import { useAuth } from "@/components/auth/Auth";
import MobileWrapperDialog from "@/components/mobile-wrapper-dialog/MobileWrapperDialog";
import { getWaveCurationsQueryKey } from "@/hooks/waves/useWaveCurationGroups";
import type { ApiGroupFull } from "@/generated/models/ApiGroupFull";
import type { ApiWave } from "@/generated/models/ApiWave";
import type { ApiWaveCuration } from "@/generated/models/ApiWaveCuration";
import type { ApiWaveCurationRequest } from "@/generated/models/ApiWaveCurationRequest";
import { commonApiPost } from "@/services/api/common-api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import SelectGroupSearchPanel from "@/components/utils/select-group/SelectGroupSearchPanel";

interface MyStreamWaveCurationCreateDialogProps {
  readonly wave: ApiWave;
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onSaved: (curation: ApiWaveCuration) => void;
  readonly curation?: ApiWaveCuration | null | undefined;
  readonly initialGroup?: ApiGroupFull | null | undefined;
}

export default function MyStreamWaveCurationCreateDialog({
  wave,
  isOpen,
  onClose,
  onSaved,
  curation,
  initialGroup,
}: MyStreamWaveCurationCreateDialogProps) {
  const queryClient = useQueryClient();
  const { requestAuth, setToast } = useAuth();
  const isEditMode = !!curation;
  const dialogTitle = isEditMode ? "Edit curation" : "Create curation";
  const fallbackErrorMessage = isEditMode
    ? "Failed to update curation."
    : "Failed to create curation.";
  const [name, setName] = useState(() => curation?.name ?? "");
  const [selectedGroup, setSelectedGroup] = useState<ApiGroupFull | null>(
    () => initialGroup ?? null
  );

  const trimmedName = name.trim();
  const isSubmitDisabled = !selectedGroup || trimmedName.length === 0;

  const handleGroupSelect = (group: ApiGroupFull) => {
    setSelectedGroup(group);
  };

  const handleSubmit = () => {
    if (!selectedGroup || trimmedName.length === 0) {
      return;
    }

    saveMutation.mutate({
      name: trimmedName,
      group_id: selectedGroup.id,
    });
  };

  const saveMutation = useMutation({
    mutationFn: async (body: ApiWaveCurationRequest) => {
      const auth = await requestAuth();
      if (!auth.success) {
        throw new Error("Authentication was cancelled.");
      }

      return await commonApiPost<ApiWaveCurationRequest, ApiWaveCuration>({
        endpoint: isEditMode
          ? `waves/${wave.id}/curations/${curation.id}`
          : `waves/${wave.id}/curations`,
        body,
      });
    },
    onSuccess: (saved) => {
      queryClient.setQueryData<ApiWaveCuration[]>(
        getWaveCurationsQueryKey(wave.id),
        (current) => {
          if (!current) {
            return isEditMode ? current : [saved];
          }

          const hasSavedCuration = current.some((item) => item.id === saved.id);

          if (!hasSavedCuration) {
            return [...current, saved];
          }

          return current.map((item) => (item.id === saved.id ? saved : item));
        }
      );
      void queryClient.invalidateQueries({
        queryKey: getWaveCurationsQueryKey(wave.id),
      });
      setToast({
        type: "success",
        message: isEditMode ? "Curation updated." : "Curation created.",
      });
      onSaved(saved);
      onClose();
    },
    onError: (error) => {
      setToast({
        type: "error",
        message: error instanceof Error ? error.message : fallbackErrorMessage,
      });
    },
  });

  let submitButtonLabel = "Create";
  if (saveMutation.isPending) {
    submitButtonLabel = isEditMode ? "Saving..." : "Creating...";
  } else if (isEditMode) {
    submitButtonLabel = "Save";
  }

  return (
    <MobileWrapperDialog
      title={dialogTitle}
      isOpen={isOpen}
      onClose={onClose}
      tabletModal={true}
      maxWidthClass="md:tw-max-w-lg"
    >
      <div className="tw-flex tw-flex-col tw-gap-5 tw-px-4 sm:tw-px-6">
        <div className="tw-space-y-2">
          <label
            htmlFor="curation-name"
            className="tw-block tw-text-sm tw-font-medium tw-text-iron-200"
          >
            Name
          </label>
          <input
            id="curation-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Curation name"
            className="tw-form-input tw-block tw-h-11 tw-w-full tw-rounded-xl tw-border-0 tw-bg-iron-900 tw-px-4 tw-text-sm tw-text-iron-50 tw-ring-1 tw-ring-inset tw-ring-iron-700 placeholder:tw-text-iron-500 focus:tw-outline-none focus:tw-ring-primary-400"
          />
        </div>

        <div className="tw-space-y-2">
          <span className="tw-block tw-text-sm tw-font-medium tw-text-iron-200">
            Group
          </span>
          <SelectGroupSearchPanel
            onGroupSelect={handleGroupSelect}
            selectedGroupId={selectedGroup?.id ?? null}
            showHeader={false}
            useDefaultContainerStyles={false}
            useDefaultBodyStyles={false}
            containerClassName="tw-rounded-xl tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-950/70 tw-py-4"
            bodyClassName="tw-mt-4 tw-max-h-72 tw-overflow-y-auto tw-px-4 tw-scrollbar-thin tw-scrollbar-track-iron-800 tw-scrollbar-thumb-iron-500 desktop-hover:hover:tw-scrollbar-thumb-iron-300"
          />
        </div>

        <div className="tw-flex tw-justify-end tw-gap-3 tw-pt-2">
          <button
            type="button"
            onClick={onClose}
            className="tw-inline-flex tw-h-10 tw-items-center tw-justify-center tw-rounded-xl tw-border tw-border-solid tw-border-iron-700 tw-bg-transparent tw-px-4 tw-text-sm tw-font-semibold tw-text-iron-300 tw-transition desktop-hover:hover:tw-border-iron-500 desktop-hover:hover:tw-text-white"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isSubmitDisabled || saveMutation.isPending}
            onClick={handleSubmit}
            className="tw-inline-flex tw-h-10 tw-items-center tw-justify-center tw-rounded-xl tw-border-0 tw-bg-primary-500 tw-px-4 tw-text-sm tw-font-semibold tw-text-black tw-transition disabled:tw-cursor-not-allowed disabled:tw-opacity-50 desktop-hover:hover:tw-bg-primary-300"
          >
            {submitButtonLabel}
          </button>
        </div>
      </div>
    </MobileWrapperDialog>
  );
}

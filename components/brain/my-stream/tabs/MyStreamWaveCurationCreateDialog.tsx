"use client";

import { useAuth } from "@/components/auth/Auth";
import MobileWrapperDialog from "@/components/mobile-wrapper-dialog/MobileWrapperDialog";
import PrimaryButton from "@/components/utils/button/PrimaryButton";
import SecondaryButton from "@/components/utils/button/SecondaryButton";
import { getWaveCurationsQueryKey } from "@/hooks/waves/useWaveCurations";
import type { ApiGroupFull } from "@/generated/models/ApiGroupFull";
import type { ApiWave } from "@/generated/models/ApiWave";
import type { ApiWaveCuration } from "@/generated/models/ApiWaveCuration";
import type { ApiWaveCurationRequest } from "@/generated/models/ApiWaveCurationRequest";
import { commonApiPost } from "@/services/api/common-api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import clsx from "clsx";
import { useRef, useState, type ChangeEvent } from "react";
import SelectGroupSearchPanel from "@/components/utils/select-group/SelectGroupSearchPanel";

const CURATION_NAME_PRESETS = [
  "Art",
  "Favourites",
  "Marketplace",
  "Important",
] as const;

const getMatchingPresetLabel = (
  value: string | null | undefined
): string | null => {
  const normalizedValue = value?.trim().toLowerCase();
  if (!normalizedValue) {
    return null;
  }

  const matchingPreset = CURATION_NAME_PRESETS.find(
    (preset) => preset.toLowerCase() === normalizedValue
  );

  return matchingPreset ?? null;
};

interface MyStreamWaveCurationCreateDialogProps {
  readonly wave: Pick<ApiWave, "id">;
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onSaved: (curation: ApiWaveCuration) => void;
  readonly showSuccessToast?: boolean | undefined;
  readonly curation?: ApiWaveCuration | null | undefined;
  readonly initialGroup?: ApiGroupFull | null | undefined;
}

export default function MyStreamWaveCurationCreateDialog({
  wave,
  isOpen,
  onClose,
  onSaved,
  showSuccessToast = true,
  curation,
  initialGroup,
}: MyStreamWaveCurationCreateDialogProps) {
  const queryClient = useQueryClient();
  const { requestAuth, setToast } = useAuth();
  const isEditMode = !!curation;
  const initialName = curation?.name ?? "";
  const dialogTitle = isEditMode ? "Edit curation" : "Create curation";
  const fallbackErrorMessage = isEditMode
    ? "Failed to update curation."
    : "Failed to create curation.";
  const [name, setName] = useState(() => initialName);
  const [selectedGroup, setSelectedGroup] = useState<ApiGroupFull | null>(
    () => initialGroup ?? null
  );
  const nameInputRef = useRef<HTMLInputElement | null>(null);

  const trimmedName = name.trim();
  const selectedPresetLabel = getMatchingPresetLabel(name);
  const isSubmitDisabled = !selectedGroup || trimmedName.length === 0;

  const handleGroupSelect = (group: ApiGroupFull) => {
    setSelectedGroup(group);
  };

  const handlePresetSelect = (presetLabel: string) => {
    setName(presetLabel);
    globalThis.window.requestAnimationFrame(() => {
      nameInputRef.current?.focus();
      nameInputRef.current?.select();
    });
  };

  const handleNameChange = (event: ChangeEvent<HTMLInputElement>) => {
    setName(event.target.value);
  };

  const handleGroupClear = () => {
    setSelectedGroup(null);
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
      if (showSuccessToast) {
        setToast({
          type: "success",
          message: isEditMode ? "Curation updated." : "Curation created.",
        });
      }
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
      noPadding
      tabletModal={true}
      tall={true}
      maxWidthClass="md:tw-max-w-lg"
      headerClassName="tw-mb-0 tw-border-b tw-border-solid tw-border-x-0 tw-border-t-0 tw-border-white/[0.06] tw-pb-4 tw-pt-6"
    >
      <div className="tw-flex tw-min-h-0 tw-flex-1 tw-flex-col">
        <div className="tw-min-h-0 tw-flex-1 tw-overflow-y-auto tw-scrollbar-thin tw-scrollbar-track-iron-800 tw-scrollbar-thumb-iron-500 desktop-hover:hover:tw-scrollbar-thumb-iron-300">
          <div className="tw-flex tw-flex-col tw-gap-8 tw-px-4 tw-py-6 sm:tw-px-6">
            <div className="tw-space-y-4">
              <label className="tw-block tw-text-sm tw-font-medium tw-text-iron-300">
                Name
              </label>
              <div className="tw-flex tw-flex-wrap tw-gap-2.5">
                {CURATION_NAME_PRESETS.map((preset) => {
                  const isSelected = selectedPresetLabel === preset;

                  return (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => handlePresetSelect(preset)}
                      aria-pressed={isSelected}
                      className={clsx(
                        "tw-inline-flex tw-appearance-none tw-items-center tw-justify-center tw-rounded-lg tw-border tw-border-solid tw-px-4 tw-py-2 tw-text-sm tw-font-medium tw-shadow-sm tw-transition-all tw-duration-300 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-white/20",
                        isSelected
                          ? "tw-border-white/20 tw-bg-iron-800 tw-text-iron-100"
                          : "tw-border-white/10 tw-bg-iron-900 tw-text-iron-300 desktop-hover:hover:tw-bg-iron-800 desktop-hover:hover:tw-text-iron-50"
                      )}
                    >
                      {preset}
                    </button>
                  );
                })}
              </div>
              <div className="tw-relative tw-w-full sm:tw-max-w-[260px]">
                <input
                  ref={nameInputRef}
                  id="curation-name"
                  type="text"
                  value={name}
                  onChange={handleNameChange}
                  autoComplete="off"
                  placeholder="Create your own custom..."
                  className="tw-form-input tw-block tw-w-full tw-appearance-none tw-rounded-lg tw-border-0 tw-border-iron-700 tw-bg-iron-900 tw-px-4 tw-py-3 tw-text-sm tw-font-medium tw-text-iron-100 tw-caret-primary-400 tw-shadow-inner tw-ring-1 tw-ring-inset tw-ring-iron-700 tw-transition tw-duration-300 tw-ease-out placeholder:tw-text-sm placeholder:tw-text-iron-500 hover:tw-ring-iron-650 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-400"
                />
              </div>
            </div>

            <div className="tw-space-y-4">
              <span className="tw-block tw-text-sm tw-font-medium tw-text-iron-300">
                Who can curate?
              </span>
              <SelectGroupSearchPanel
                onGroupSelect={handleGroupSelect}
                onGroupClear={handleGroupClear}
                selectedGroupId={selectedGroup?.id ?? null}
                showHeader={false}
                useDefaultContainerStyles={false}
                useDefaultBodyStyles={false}
                containerClassName="tw-rounded-xl tw-border tw-border-solid tw-border-white/[0.06] tw-bg-iron-900/40 tw-shadow-sm"
                bodyClassName="tw-mt-3 tw-max-h-[260px] tw-overflow-y-auto tw-pb-0 tw-pl-4 tw-pr-2 tw-scrollbar-thin tw-scrollbar-track-transparent tw-scrollbar-thumb-white/10 desktop-hover:hover:tw-scrollbar-thumb-white/20"
              />
            </div>
          </div>
        </div>

        <div className="tw-flex-shrink-0 tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-white/[0.06] tw-bg-iron-950 tw-px-5 tw-py-5 sm:tw-px-6">
          <div className="tw-flex tw-justify-end tw-gap-3">
            <SecondaryButton
              onClicked={onClose}
              className="tw-border-white/[0.06] tw-bg-transparent tw-text-iron-400 tw-ring-0 desktop-hover:hover:tw-border-white/[0.06] desktop-hover:hover:tw-bg-white/[0.06] desktop-hover:hover:tw-text-iron-100"
            >
              Cancel
            </SecondaryButton>
            <PrimaryButton
              loading={saveMutation.isPending}
              disabled={isSubmitDisabled}
              onClicked={handleSubmit}
              padding="tw-px-6 tw-py-2.5"
            >
              {submitButtonLabel}
            </PrimaryButton>
          </div>
        </div>
      </div>
    </MobileWrapperDialog>
  );
}

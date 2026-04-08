"use client";

import { useAuth } from "@/components/auth/Auth";
import MobileWrapperDialog from "@/components/mobile-wrapper-dialog/MobileWrapperDialog";
import PrimaryButton from "@/components/utils/button/PrimaryButton";
import SecondaryButton from "@/components/utils/button/SecondaryButton";
import { getWaveCurationsQueryKey } from "@/hooks/waves/useWaveCurationGroups";
import type { ApiGroupFull } from "@/generated/models/ApiGroupFull";
import type { ApiWave } from "@/generated/models/ApiWave";
import type { ApiWaveCuration } from "@/generated/models/ApiWaveCuration";
import type { ApiWaveCurationRequest } from "@/generated/models/ApiWaveCurationRequest";
import { commonApiPost } from "@/services/api/common-api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import clsx from "clsx";
import { useState } from "react";
import SelectGroupSearchPanel from "@/components/utils/select-group/SelectGroupSearchPanel";

const CURATION_NAME_PRESETS = [
  {
    label: "Art",
    baseClassName:
      "tw-border-primary-500/30 tw-bg-primary-500/15 tw-text-primary-200 desktop-hover:hover:tw-border-primary-400/40 desktop-hover:hover:tw-bg-primary-500/20",
    activeClassName:
      "tw-border-primary-300 tw-bg-primary-500/25 tw-text-white tw-shadow-[0_12px_28px_rgba(64,106,254,0.22)]",
  },
  {
    label: "Favourites",
    baseClassName:
      "tw-border-emerald-400/25 tw-bg-emerald-500/12 tw-text-emerald-100 desktop-hover:hover:tw-border-emerald-300/35 desktop-hover:hover:tw-bg-emerald-500/18",
    activeClassName:
      "tw-border-emerald-300/60 tw-bg-emerald-500/22 tw-text-white tw-shadow-[0_12px_28px_rgba(16,185,129,0.18)]",
  },
  {
    label: "Marketplace",
    baseClassName:
      "tw-border-amber-400/25 tw-bg-amber-500/12 tw-text-amber-100 desktop-hover:hover:tw-border-amber-300/35 desktop-hover:hover:tw-bg-amber-500/18",
    activeClassName:
      "tw-border-amber-300/60 tw-bg-amber-500/22 tw-text-white tw-shadow-[0_12px_28px_rgba(245,158,11,0.18)]",
  },
  {
    label: "Important",
    baseClassName:
      "tw-border-fuchsia-400/25 tw-bg-fuchsia-500/12 tw-text-fuchsia-100 desktop-hover:hover:tw-border-fuchsia-300/35 desktop-hover:hover:tw-bg-fuchsia-500/18",
    activeClassName:
      "tw-border-fuchsia-300/60 tw-bg-fuchsia-500/22 tw-text-white tw-shadow-[0_12px_28px_rgba(217,70,239,0.18)]",
  },
] as const;

const getMatchingPresetLabel = (
  value: string | null | undefined
): string | null => {
  const normalizedValue = value?.trim().toLowerCase();
  if (!normalizedValue) {
    return null;
  }

  const matchingPreset = CURATION_NAME_PRESETS.find(
    (preset) => preset.label.toLowerCase() === normalizedValue
  );

  return matchingPreset?.label ?? null;
};

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
  const initialName = curation?.name ?? "";
  const initialPresetLabel = getMatchingPresetLabel(initialName);
  const dialogTitle = isEditMode ? "Edit curation" : "Create curation";
  const fallbackErrorMessage = isEditMode
    ? "Failed to update curation."
    : "Failed to create curation.";
  const [name, setName] = useState(() => initialName);
  const [isCustomName, setIsCustomName] = useState(
    () => initialName.trim().length > 0 && initialPresetLabel === null
  );
  const [selectedGroup, setSelectedGroup] = useState<ApiGroupFull | null>(
    () => initialGroup ?? null
  );

  const trimmedName = name.trim();
  const selectedPresetLabel = getMatchingPresetLabel(name);
  const isSubmitDisabled = !selectedGroup || trimmedName.length === 0;

  const handleGroupSelect = (group: ApiGroupFull) => {
    setSelectedGroup(group);
  };

  const handlePresetSelect = (presetLabel: string) => {
    setName(presetLabel);
    setIsCustomName(false);
  };

  const handleCustomSelect = () => {
    setIsCustomName(true);
    if (selectedPresetLabel) {
      setName("");
    }
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
      noPadding
      tabletModal={true}
      tall={true}
      fixedHeight
      maxWidthClass="md:tw-max-w-lg"
      headerClassName="tw-mb-5 tw-border-b tw-border-solid tw-border-x-0 tw-border-t-0 tw-border-iron-800 tw-pb-3 tw-pt-6"
    >
      <div className="tw-flex tw-min-h-0 tw-flex-1 tw-flex-col">
        <div className="tw-min-h-0 tw-flex-1 tw-overflow-y-auto tw-scrollbar-thin tw-scrollbar-track-iron-800 tw-scrollbar-thumb-iron-500 desktop-hover:hover:tw-scrollbar-thumb-iron-300">
          <div className="tw-flex tw-flex-col tw-gap-5 tw-px-4 tw-pb-6 sm:tw-px-6">
            <div className="tw-space-y-2">
              <label className="tw-block tw-text-sm tw-font-medium tw-text-iron-200">
                Name
              </label>
              <div className="tw-flex tw-flex-wrap tw-gap-2.5">
                {CURATION_NAME_PRESETS.map((preset) => {
                  const isSelected =
                    !isCustomName && selectedPresetLabel === preset.label;

                  return (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => handlePresetSelect(preset.label)}
                      aria-pressed={isSelected}
                      className={clsx(
                        "tw-inline-flex tw-appearance-none tw-items-center tw-justify-center tw-rounded-lg tw-border tw-border-solid tw-bg-transparent tw-px-4 tw-py-2.5 tw-text-sm tw-font-semibold tw-transition tw-duration-300 tw-ease-out focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-white/15",
                        preset.baseClassName,
                        isSelected && preset.activeClassName
                      )}
                    >
                      {preset.label}
                    </button>
                  );
                })}
                <button
                  type="button"
                  onClick={handleCustomSelect}
                  aria-pressed={isCustomName}
                  className={clsx(
                    "tw-inline-flex tw-appearance-none tw-items-center tw-justify-center tw-rounded-lg tw-border tw-border-solid tw-bg-transparent tw-px-4 tw-py-2.5 tw-text-sm tw-font-medium tw-transition tw-duration-300 tw-ease-out focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-white/10",
                    isCustomName
                      ? "tw-border-iron-500 tw-bg-iron-800 tw-text-iron-50"
                      : "tw-border-iron-700 tw-bg-iron-900 tw-text-iron-400 desktop-hover:hover:tw-border-iron-600 desktop-hover:hover:tw-bg-iron-800 desktop-hover:hover:tw-text-iron-200"
                  )}
                >
                  Create your own custom...
                </button>
              </div>
              {isCustomName && (
                <div className="tw-relative tw-w-full">
                  <input
                    id="curation-name"
                    type="text"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    autoComplete="off"
                    autoFocus
                    placeholder=" "
                    className="tw-peer tw-form-input tw-block tw-w-full tw-appearance-none tw-rounded-lg tw-border-0 tw-border-iron-700 tw-bg-iron-900 tw-px-4 tw-pb-3 tw-pt-3 tw-text-sm tw-font-medium tw-text-white tw-caret-primary-300 tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-iron-700 tw-transition tw-duration-300 tw-ease-out placeholder:tw-text-iron-500 hover:tw-ring-iron-650 focus:tw-border-blue-500 focus:tw-bg-iron-900 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-400"
                  />
                  <label
                    htmlFor="curation-name"
                    className="tw-absolute tw-start-1 tw-top-2 tw-z-10 tw-origin-[0] -tw-translate-y-4 tw-scale-75 tw-transform tw-cursor-text tw-rounded-lg tw-bg-iron-900 tw-px-2 tw-text-sm tw-font-medium tw-text-iron-500 tw-duration-300 peer-placeholder-shown:tw-top-1/2 peer-placeholder-shown:-tw-translate-y-1/2 peer-placeholder-shown:tw-scale-100 peer-focus:tw-top-2 peer-focus:-tw-translate-y-4 peer-focus:tw-scale-75 peer-focus:tw-bg-iron-900 peer-focus:tw-px-2 peer-focus:tw-text-primary-400 rtl:peer-focus:tw-left-auto rtl:peer-focus:tw-translate-x-1/4"
                  >
                    Curation name
                  </label>
                </div>
              )}
            </div>

            <div className="tw-space-y-2">
              <span className="tw-block tw-text-sm tw-font-medium tw-text-iron-200">
                Who can curate?
              </span>
              <SelectGroupSearchPanel
                onGroupSelect={handleGroupSelect}
                onGroupClear={handleGroupClear}
                selectedGroupId={selectedGroup?.id ?? null}
                showHeader={false}
                useDefaultContainerStyles={false}
                useDefaultBodyStyles={false}
                containerClassName="tw-rounded-xl tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-900/30"
                bodyClassName="tw-mt-4 tw-max-h-72 tw-overflow-y-auto tw-px-4 tw-scrollbar-thin tw-scrollbar-track-iron-800 tw-scrollbar-thumb-iron-500 desktop-hover:hover:tw-scrollbar-thumb-iron-300 tw-pb-4"
              />
            </div>
          </div>
        </div>

        <div className="tw-flex-shrink-0 tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-iron-800 tw-bg-iron-950 tw-px-4 tw-py-4 sm:tw-px-6">
          <div className="tw-flex tw-justify-end tw-gap-3">
            <SecondaryButton onClicked={onClose}>Cancel</SecondaryButton>
            <PrimaryButton
              loading={saveMutation.isPending}
              disabled={isSubmitDisabled}
              onClicked={handleSubmit}
              padding="tw-px-4 tw-py-2.5"
            >
              {submitButtonLabel}
            </PrimaryButton>
          </div>
        </div>
      </div>
    </MobileWrapperDialog>
  );
}

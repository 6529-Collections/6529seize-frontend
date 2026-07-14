"use client";

import { useAuth } from "@/components/auth/Auth";
import CircleLoader, {
  CircleLoaderSize,
} from "@/components/distribution-plan-tool/common/CircleLoader";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import MobileWrapperDialog from "@/components/mobile-wrapper-dialog/MobileWrapperDialog";
import PrimaryButton from "@/components/utils/button/PrimaryButton";
import SecondaryButton from "@/components/utils/button/SecondaryButton";
import SelectGroupModalSearchName from "@/components/utils/select-group/SelectGroupModalSearchName";
import { getWaveCurationsQueryKey } from "@/hooks/waves/useWaveCurations";
import type { ApiGroupFull } from "@/generated/models/ApiGroupFull";
import type { ApiWave } from "@/generated/models/ApiWave";
import type { ApiWaveCuration } from "@/generated/models/ApiWaveCuration";
import type { ApiWaveCurationRequest } from "@/generated/models/ApiWaveCurationRequest";
import type { ApiWaveMin } from "@/generated/models/ApiWaveMin";
import { getRandomColorWithSeed, getTimeAgo } from "@/helpers/Helpers";
import { ImageScale, getScaledImageUri } from "@/helpers/image.helpers";
import { commonApiFetch, commonApiPost } from "@/services/api/common-api";
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import clsx from "clsx";
import Image from "next/image";
import { useRef, useState, type ReactNode, type ChangeEvent } from "react";

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
  readonly wave:
    | Pick<ApiWave, "id" | "wave">
    | Pick<ApiWaveMin, "id" | "admin_group_id">;
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onSaved: (curation: ApiWaveCuration) => Promise<void> | void;
  readonly showSuccessToast?: boolean | undefined;
  readonly curation?: ApiWaveCuration | null | undefined;
  readonly initialGroup?: ApiGroupFull | null | undefined;
}

const getWaveAdminGroupId = (
  wave: Pick<ApiWave, "id" | "wave"> | Pick<ApiWaveMin, "id" | "admin_group_id">
): string | null => {
  if ("wave" in wave) {
    return wave.wave.admin_group.group?.id ?? null;
  }

  return wave.admin_group_id ?? null;
};

const getGroupCreatorLabel = (group: ApiGroupFull): string =>
  group.created_by.handle
    ? `@${group.created_by.handle}`
    : group.created_by.primary_address;

const getErrorMessage = (error: unknown, fallback: string): string => {
  if (typeof error === "string" && error.trim().length > 0) {
    return error;
  }

  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  return fallback;
};

const getCurationSaveErrorMessage = ({
  error,
  fallbackErrorMessage,
  isEditMode,
}: {
  readonly error: unknown;
  readonly fallbackErrorMessage: string;
  readonly isEditMode: boolean;
}): string => {
  const errorMessage = getErrorMessage(error, fallbackErrorMessage);
  const normalizedMessage = errorMessage.toLowerCase();

  if (
    normalizedMessage.includes("already exists") ||
    normalizedMessage.includes("duplicate") ||
    normalizedMessage.includes("unique constraint")
  ) {
    return "A curation with this name already exists in this wave. Choose another name.";
  }

  if (
    normalizedMessage.includes("permission") ||
    normalizedMessage.includes("forbidden") ||
    normalizedMessage.includes("not authorized") ||
    normalizedMessage.includes("not allowed")
  ) {
    return isEditMode
      ? "You don't have permission to update this curation."
      : "You don't have permission to create a curation with the selected group.";
  }

  return errorMessage;
};

const getInitialSelectedGroupId = ({
  wave,
  curation,
  initialGroup,
  isEditMode,
}: {
  readonly wave:
    | Pick<ApiWave, "id" | "wave">
    | Pick<ApiWaveMin, "id" | "admin_group_id">;
  readonly curation?: ApiWaveCuration | null | undefined;
  readonly initialGroup?: ApiGroupFull | null | undefined;
  readonly isEditMode: boolean;
}): string | null => {
  if (initialGroup?.id) {
    return initialGroup.id;
  }

  if (curation?.group_id) {
    return curation.group_id;
  }

  if (isEditMode) {
    return null;
  }

  return getWaveAdminGroupId(wave);
};

const getSubmitButtonLabel = (
  isPending: boolean,
  isEditMode: boolean
): string => {
  if (isPending) {
    return isEditMode ? "Saving..." : "Creating...";
  }

  if (isEditMode) {
    return "Save";
  }

  return "Create";
};

function CurationGroupRow({
  group,
  onSelect,
  trailingContent,
  isSelected = false,
}: {
  readonly group: ApiGroupFull;
  readonly onSelect?: ((group: ApiGroupFull) => void) | undefined;
  readonly trailingContent?: ReactNode | undefined;
  readonly isSelected?: boolean | undefined;
}) {
  const isInteractive = onSelect !== undefined;
  const avatarAccentStart =
    group.created_by.banner1_color ??
    getRandomColorWithSeed(group.created_by.handle ?? "");
  const avatarAccentEnd =
    group.created_by.banner2_color ??
    getRandomColorWithSeed(group.created_by.handle ?? "");
  const timeAgo = getTimeAgo(new Date(group.created_at).getTime());
  const avatarFallbackLabel = getGroupCreatorLabel(group)
    .charAt(0)
    .toUpperCase();
  const hasTrailingContent =
    trailingContent !== undefined && trailingContent !== null;
  const avatarAlt = group.created_by.handle
    ? `${group.created_by.handle} profile picture`
    : "Group creator profile picture";
  const handleSelect = () => {
    if (onSelect === undefined) {
      return;
    }

    onSelect(group);
  };
  let rowClassName = "tw-border-white/[0.06] tw-bg-iron-900/40";

  if (isInteractive) {
    rowClassName = isSelected
      ? "tw-cursor-pointer tw-border-white/20 tw-bg-iron-900 tw-shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_10px_24px_rgba(0,0,0,0.28),0_0_18px_rgba(255,255,255,0.06)]"
      : "desktop-hover:hover:tw-border-white/12 tw-cursor-pointer tw-border-white/[0.06] tw-bg-iron-950/70 desktop-hover:hover:tw-bg-iron-900/70";
  }

  const selectionIndicatorClassName = isSelected
    ? "tw-border-iron-100 tw-bg-iron-100 tw-shadow-[0_0_10px_rgba(255,255,255,0.2)]"
    : "tw-border-white/10 tw-bg-transparent desktop-hover:group-hover:tw-border-white/30";
  const rowContent = (
    <>
      <div className="tw-flex tw-min-w-0 tw-flex-1 tw-items-center tw-gap-3">
        <div
          className="tw-relative tw-flex tw-h-9 tw-w-9 tw-flex-shrink-0 tw-items-center tw-justify-center tw-overflow-hidden tw-rounded-full tw-shadow-[inset_0_2px_4px_rgba(255,255,255,0.2),0_2px_8px_rgba(0,0,0,0.4)]"
          style={{
            background: `linear-gradient(135deg, ${avatarAccentStart} 0%, ${avatarAccentEnd} 100%)`,
          }}
        >
          {group.created_by.pfp ? (
            <Image
              src={getScaledImageUri(
                group.created_by.pfp,
                ImageScale.W_AUTO_H_50
              )}
              width={40}
              height={40}
              alt={avatarAlt}
              className="tw-h-full tw-w-full tw-object-cover"
            />
          ) : (
            <>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="tw-h-4 tw-w-4 tw-text-iron-50 tw-drop-shadow-md"
                stroke="currentColor"
                strokeWidth="2.5"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
              <span className="tw-sr-only">{avatarFallbackLabel}</span>
            </>
          )}
        </div>
        <div className="tw-min-w-0 tw-flex-1">
          <p className="tw-mt-0 tw-mb-1 tw-truncate tw-text-sm tw-font-semibold tw-text-iron-50">
            {group.name}
          </p>
          <div className="tw-flex tw-min-w-0 tw-items-center tw-gap-1.5 tw-text-[11px]">
            <span className="tw-inline-block tw-min-w-0 tw-max-w-[8rem] tw-truncate tw-font-medium tw-text-iron-400">
              {getGroupCreatorLabel(group)}
            </span>
            {timeAgo && (
              <div className="tw-flex tw-flex-shrink-0 tw-items-center tw-gap-1.5 tw-whitespace-nowrap">
                <span className="tw-leading-none tw-text-iron-600">
                  &middot;
                </span>
                <span className="tw-text-iron-500">
                  <span className="tw-hidden sm:tw-inline">Created </span>
                  {timeAgo}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
      {hasTrailingContent && (
        <div className="tw-flex tw-flex-shrink-0 tw-items-center tw-gap-2">
          {trailingContent}
        </div>
      )}
      {!hasTrailingContent && (
        <div
          className={clsx(
            "tw-flex tw-h-[18px] tw-w-[18px] tw-flex-shrink-0 tw-items-center tw-justify-center tw-rounded-full tw-border tw-border-solid tw-transition-all tw-duration-300",
            selectionIndicatorClassName
          )}
          aria-hidden="true"
        >
          {isSelected && (
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="tw-h-3 tw-w-3 tw-flex-shrink-0 tw-text-iron-950"
              stroke="currentColor"
              strokeWidth="3.5"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          )}
        </div>
      )}
    </>
  );
  const rowClassNames = clsx(
    "tw-group tw-flex tw-items-center tw-justify-between tw-gap-3 tw-rounded-xl tw-border tw-border-solid tw-p-4 tw-transition-all",
    rowClassName
  );

  if (isInteractive) {
    return (
      <button
        type="button"
        onClick={handleSelect}
        aria-pressed={isSelected}
        className={clsx(
          rowClassNames,
          "tw-w-full tw-bg-transparent tw-text-left"
        )}
      >
        {rowContent}
      </button>
    );
  }

  return <div className={rowClassNames}>{rowContent}</div>;
}

function CurationGroupSearchState({
  canCloseGroupSearch,
  onCloseGroupSearch,
  shouldShowDefaultGroupError,
  groupSearchName,
  setGroupSearchName,
  isSearchingGroups,
  isSearchFiltered,
  searchedGroups,
  selectedGroupId,
  onGroupSelect,
}: {
  readonly canCloseGroupSearch: boolean;
  readonly onCloseGroupSearch: () => void;
  readonly shouldShowDefaultGroupError: boolean;
  readonly groupSearchName: string | null;
  readonly setGroupSearchName: (value: string | null) => void;
  readonly isSearchingGroups: boolean;
  readonly isSearchFiltered: boolean;
  readonly searchedGroups: ApiGroupFull[];
  readonly selectedGroupId: string | null;
  readonly onGroupSelect: (group: ApiGroupFull) => void;
}) {
  const loadingMessage = isSearchFiltered
    ? "Searching groups..."
    : "Loading groups...";

  let content: ReactNode;

  if (isSearchingGroups) {
    content = (
      <div className="tw-rounded-xl tw-border tw-border-solid tw-border-white/[0.06] tw-bg-iron-950/60 tw-px-4 tw-py-4">
        <div className="tw-flex tw-items-center tw-gap-3 tw-text-sm tw-text-iron-400">
          <CircleLoader size={CircleLoaderSize.SMALL} />
          <span>{loadingMessage}</span>
        </div>
      </div>
    );
  } else if (searchedGroups.length > 0) {
    content = (
      <div className="tw-grid tw-grid-cols-1 tw-gap-2">
        {searchedGroups.map((group) => (
          <CurationGroupRow
            key={group.id}
            group={group}
            onSelect={onGroupSelect}
            isSelected={selectedGroupId === group.id}
          />
        ))}
      </div>
    );
  } else {
    content = (
      <div className="tw-rounded-xl tw-border tw-border-dashed tw-border-white/[0.08] tw-bg-iron-950/60 tw-px-4 tw-py-5">
        <p className="tw-mb-0 tw-text-sm tw-text-iron-400">No groups found.</p>
      </div>
    );
  }

  return (
    <div className="tw-space-y-3">
      <div className="tw-flex tw-items-center tw-justify-between tw-gap-3">
        <p className="tw-mb-0 tw-text-sm tw-font-medium tw-text-iron-300">
          Choose another group
        </p>
        {canCloseGroupSearch && (
          <button
            type="button"
            onClick={onCloseGroupSearch}
            className="tw-border-0 tw-bg-transparent tw-p-0 tw-text-sm tw-font-medium tw-text-iron-400 tw-transition desktop-hover:hover:tw-text-iron-200"
          >
            Back
          </button>
        )}
      </div>

      {shouldShowDefaultGroupError && (
        <div className="tw-rounded-xl tw-border tw-border-solid tw-border-rose-500/20 tw-bg-rose-500/10 tw-px-4 tw-py-4">
          <p className="tw-mb-0 tw-text-sm tw-text-rose-300">
            Failed to load the current curator group. Choose another group
            below.
          </p>
        </div>
      )}

      <SelectGroupModalSearchName
        filterName={groupSearchName}
        setFilterName={setGroupSearchName}
        autoFocus={true}
      />

      {content}
    </div>
  );
}

function CurationGroupSummaryState({
  selectedGroup,
  isInitialGroupLoading,
  onOpenGroupSearch,
}: {
  readonly selectedGroup: ApiGroupFull | null;
  readonly isInitialGroupLoading: boolean;
  readonly onOpenGroupSearch: () => void;
}) {
  if (selectedGroup === null && isInitialGroupLoading) {
    return (
      <div className="tw-rounded-xl tw-border tw-border-solid tw-border-white/[0.06] tw-bg-iron-950/70 tw-px-4 tw-py-4">
        <p className="tw-mb-0 tw-text-sm tw-text-iron-400">
          Loading selected group...
        </p>
      </div>
    );
  }

  if (selectedGroup !== null) {
    return (
      <CurationGroupRow
        group={selectedGroup}
        trailingContent={
          <SecondaryButton
            onClicked={onOpenGroupSearch}
            size="sm"
            className="tw-whitespace-nowrap"
          >
            Change group
          </SecondaryButton>
        }
      />
    );
  }

  return (
    <div className="tw-rounded-xl tw-border tw-border-solid tw-border-white/[0.06] tw-bg-iron-950/70 tw-px-4 tw-py-4">
      <div className="tw-flex tw-items-center tw-justify-between tw-gap-3">
        <p className="tw-mb-0 tw-text-sm tw-text-iron-400">
          No group selected yet.
        </p>
        <SecondaryButton
          onClicked={onOpenGroupSearch}
          size="sm"
          className="tw-whitespace-nowrap"
        >
          Choose group
        </SecondaryButton>
      </div>
    </div>
  );
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
  const initialSelectedGroupId = getInitialSelectedGroupId({
    wave,
    curation,
    initialGroup,
    isEditMode,
  });
  const [name, setName] = useState(() => initialName);
  const [selectedGroupOverride, setSelectedGroupOverride] =
    useState<ApiGroupFull | null>(initialGroup ?? null);
  const [isGroupSearchOpen, setIsGroupSearchOpen] = useState(
    () => !initialGroup && !initialSelectedGroupId
  );
  const [groupSearchName, setGroupSearchName] = useState<string | null>(null);
  const nameInputRef = useRef<HTMLInputElement | null>(null);
  const {
    data: resolvedInitialGroup,
    isLoading: isInitialGroupLoading,
    isError: isInitialGroupError,
  } = useQuery<ApiGroupFull>({
    queryKey: [QueryKey.GROUP, initialSelectedGroupId],
    queryFn: async () => {
      if (!initialSelectedGroupId) {
        throw new Error("No default group selected.");
      }

      return await commonApiFetch<ApiGroupFull>({
        endpoint: `groups/${initialSelectedGroupId}`,
      });
    },
    enabled: !!initialSelectedGroupId && !initialGroup,
    staleTime: 5 * 60 * 1000,
  });

  const selectedGroup =
    selectedGroupOverride ?? initialGroup ?? resolvedInitialGroup ?? null;
  const trimmedName = name.trim();
  const trimmedGroupSearchName = groupSearchName?.trim() ?? "";
  const isSearchFiltered = trimmedGroupSearchName.length > 0;
  const selectedPresetLabel = getMatchingPresetLabel(name);
  const isSubmitDisabled = selectedGroup === null || trimmedName.length === 0;
  const shouldShowDefaultGroupError =
    selectedGroup === null && !isInitialGroupLoading && isInitialGroupError;
  const canCloseGroupSearch = selectedGroup !== null;
  const isGroupSearchVisible = isGroupSearchOpen || shouldShowDefaultGroupError;
  const groupSearchParams = isSearchFiltered
    ? {
        group_name: trimmedGroupSearchName,
      }
    : undefined;
  const { data: searchedGroups = [], isFetching: isSearchingGroups } = useQuery<
    ApiGroupFull[]
  >({
    queryKey: [QueryKey.GROUPS, { group_name: trimmedGroupSearchName }],
    queryFn: async () =>
      await commonApiFetch<ApiGroupFull[], { group_name?: string }>({
        endpoint: "groups",
        params: groupSearchParams,
      }),
    enabled: isGroupSearchVisible,
    placeholderData: keepPreviousData,
  });

  const handleGroupSelect = (group: ApiGroupFull) => {
    setSelectedGroupOverride(group);
    setGroupSearchName(null);
    setIsGroupSearchOpen(false);
  };

  const handleOpenGroupSearch = () => {
    setGroupSearchName(null);
    setIsGroupSearchOpen(true);
  };

  const handleCloseGroupSearch = () => {
    if (selectedGroup === null) {
      return;
    }

    setGroupSearchName(null);
    setIsGroupSearchOpen(false);
  };

  const handlePresetSelect = (presetLabel: string) => {
    setName(presetLabel);
    globalThis.window.requestAnimationFrame(() => {
      const input = nameInputRef.current;
      if (input === null) {
        return;
      }

      input.focus();
      const caretPosition = presetLabel.length;
      input.setSelectionRange(caretPosition, caretPosition);
    });
  };

  const handleNameChange = (event: ChangeEvent<HTMLInputElement>) => {
    setName(event.target.value);
  };

  const handleSubmit = () => {
    if (selectedGroup === null || trimmedName.length === 0) {
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
        errorMode: "structured",
      });
    },
    onSuccess: async (saved) => {
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
      await queryClient.invalidateQueries({
        queryKey: getWaveCurationsQueryKey(wave.id),
      });
      if (showSuccessToast) {
        setToast({
          type: "success",
          message: isEditMode ? "Curation updated." : "Curation created.",
        });
      }
      await onSaved(saved);
      onClose();
    },
    onError: (error) => {
      setToast({
        type: "error",
        message: getCurationSaveErrorMessage({
          error,
          fallbackErrorMessage,
          isEditMode,
        }),
      });
    },
  });
  const submitButtonLabel = getSubmitButtonLabel(
    saveMutation.isPending,
    isEditMode
  );
  let groupPickerContent: ReactNode;

  if (isGroupSearchVisible) {
    groupPickerContent = (
      <CurationGroupSearchState
        canCloseGroupSearch={canCloseGroupSearch}
        onCloseGroupSearch={handleCloseGroupSearch}
        shouldShowDefaultGroupError={shouldShowDefaultGroupError}
        groupSearchName={groupSearchName}
        setGroupSearchName={setGroupSearchName}
        isSearchingGroups={isSearchingGroups}
        isSearchFiltered={isSearchFiltered}
        searchedGroups={searchedGroups}
        selectedGroupId={selectedGroup?.id ?? null}
        onGroupSelect={handleGroupSelect}
      />
    );
  } else {
    groupPickerContent = (
      <CurationGroupSummaryState
        selectedGroup={selectedGroup}
        isInitialGroupLoading={isInitialGroupLoading}
        onOpenGroupSearch={handleOpenGroupSearch}
      />
    );
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
              <label
                htmlFor="curation-name"
                className="tw-block tw-text-sm tw-font-medium tw-text-iron-300"
              >
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
              <div className="tw-space-y-3.5">{groupPickerContent}</div>
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

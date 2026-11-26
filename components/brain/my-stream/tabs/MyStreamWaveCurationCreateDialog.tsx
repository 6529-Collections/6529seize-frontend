"use client";

import { ChevronDownIcon } from "@heroicons/react/24/outline";
import { useAuth } from "@/components/auth/Auth";
import MobileNavigationView from "@/components/mobile-navigation/MobileNavigationView";
import { MobilePageDraft } from "@/components/mobile-navigation/MobilePageContext";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { PHONE_WAVES_LAYOUT_QUERY } from "@/constants/waves-layout";
import MobileWrapperDialog from "@/components/mobile-wrapper-dialog/MobileWrapperDialog";
import Button from "@/components/utils/button/Button";
import useKeyboardFocusScroll from "@/components/waves/create-wave/hooks/useKeyboardFocusScroll";
import type { ApiCreateGroup } from "@/generated/models/ApiCreateGroup";
import type { ApiWave } from "@/generated/models/ApiWave";
import type { ApiWaveCuration } from "@/generated/models/ApiWaveCuration";
import type { ApiWaveCurationRequest } from "@/generated/models/ApiWaveCurationRequest";
import type { ApiWaveMin } from "@/generated/models/ApiWaveMin";
import { useSavedGroup } from "@/hooks/groups/useGroupCriteria";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { getWaveCurationsQueryKey } from "@/hooks/waves/useWaveCurations";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import {
  commonApiPost,
  getStructuredApiErrorStatus,
} from "@/services/api/common-api";
import { sanitiseGroupPayload } from "@/services/groups/groupMutations";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import clsx from "clsx";
import { useId, useRef, useState, type ChangeEvent } from "react";
import { createPortal } from "react-dom";

import {
  CurationCriteriaEditor,
  CurationCriteriaSummary,
  useCurationCriteriaPreview,
} from "./CurationCriteria";

const CURATION_NAME_PRESETS = [
  "profileCuration.editor.preset.art",
  "profileCuration.editor.preset.favourites",
  "profileCuration.editor.preset.marketplace",
  "profileCuration.editor.preset.important",
] as const;

interface MyStreamWaveCurationCreateDialogProps {
  readonly mobileSheet?: boolean | undefined;
  /** The Wave information panel owns the header, focus trap and dismissal. */
  readonly panelContainer?: HTMLDivElement | null | undefined;
  readonly wave:
    | Pick<ApiWave, "id" | "wave">
    | Pick<ApiWaveMin, "id" | "admin_group_id">;
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onSaved: (curation: ApiWaveCuration) => Promise<void> | void;
  readonly showSuccessToast?: boolean | undefined;
  readonly curation?: ApiWaveCuration | null | undefined;
  readonly permissionMode?: "standard" | "profile" | undefined;
}

const getWaveAdminGroupId = (
  wave: Pick<ApiWave, "id" | "wave"> | Pick<ApiWaveMin, "id" | "admin_group_id">
): string | null => {
  if ("wave" in wave) {
    return wave.wave.admin_group.group?.id ?? null;
  }

  return wave.admin_group_id ?? null;
};

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
  isEditMode,
  locale,
}: {
  readonly error: unknown;
  readonly isEditMode: boolean;
  readonly locale: SupportedLocale;
}): string => {
  const errorMessage = getErrorMessage(
    error,
    t(
      locale,
      isEditMode
        ? "profileCuration.editor.updateFailed"
        : "profileCuration.editor.createFailed"
    )
  );
  const normalizedMessage = errorMessage.toLowerCase();

  if (
    normalizedMessage.includes("already exists") ||
    normalizedMessage.includes("duplicate") ||
    normalizedMessage.includes("unique constraint")
  ) {
    return t(locale, "profileCuration.editor.duplicate");
  }

  if (
    normalizedMessage.includes("permission") ||
    normalizedMessage.includes("forbidden") ||
    normalizedMessage.includes("not authorized") ||
    normalizedMessage.includes("not allowed")
  ) {
    return t(
      locale,
      isEditMode
        ? "profileCuration.editor.updateForbidden"
        : "profileCuration.editor.createForbidden"
    );
  }

  return errorMessage;
};

const getSubmitButtonLabel = (
  locale: SupportedLocale,
  isPending: boolean,
  isEditMode: boolean
): string => {
  if (isPending) {
    return t(
      locale,
      isEditMode
        ? "profileCuration.editor.saving"
        : "profileCuration.editor.creating"
    );
  }

  return t(
    locale,
    isEditMode ? "profileCuration.editor.save" : "waves.create.actions.create"
  );
};

function CurationNameField({
  name,
  onChange,
  isPhone,
}: {
  readonly name: string;
  readonly onChange: (name: string) => void;
  readonly isPhone: boolean;
}) {
  const inputId = useId();
  const nameInputRef = useRef<HTMLInputElement>(null);
  const locale = useBrowserLocale();
  const normalizedName = name.trim().toLocaleLowerCase(locale);

  const handlePresetSelect = (presetLabel: string) => {
    onChange(presetLabel);
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
    onChange(event.target.value);
  };

  const presets = (
    <div
      key="presets"
      className="tw-no-scrollbar tw-order-3 -tw-mx-4 tw-mt-3 tw-flex tw-flex-nowrap tw-gap-2 tw-overflow-x-auto tw-px-4 sm:-tw-mx-6 sm:tw-px-6 md:tw-order-none md:tw-mx-0 md:tw-mt-0 md:tw-flex-wrap md:tw-gap-2.5 md:tw-overflow-visible md:tw-px-0"
    >
      {CURATION_NAME_PRESETS.map((key) => {
        const preset = t(locale, key);
        const isSelected = preset.toLocaleLowerCase(locale) === normalizedName;

        return (
          <button
            key={key}
            type="button"
            onClick={() => handlePresetSelect(preset)}
            aria-pressed={isSelected}
            className={clsx(
              "tw-inline-flex tw-h-8 tw-shrink-0 tw-appearance-none tw-items-center tw-justify-center tw-whitespace-nowrap tw-rounded-lg tw-border tw-border-solid tw-px-2.5 tw-py-0 tw-text-meta tw-font-medium tw-shadow-none tw-transition-all tw-duration-300 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 md:tw-h-auto md:tw-px-4 md:tw-py-2 md:tw-text-sm md:tw-shadow-sm md:group-data-[profile-typography=true]/curation-dialog:tw-text-meta",
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
  );
  const nameInput = (
    <div key="input" className="tw-relative tw-w-full sm:tw-max-w-[260px]">
      <input
        ref={nameInputRef}
        id={inputId}
        type="text"
        value={name}
        onChange={handleNameChange}
        maxLength={50}
        autoComplete="off"
        placeholder={t(locale, "profileCuration.editor.namePlaceholder")}
        className="tw-form-input tw-block tw-h-12 tw-w-full tw-appearance-none tw-rounded-lg tw-border-0 tw-border-iron-700 tw-bg-iron-900 tw-px-4 tw-py-0 tw-text-base tw-font-normal tw-text-iron-100 tw-caret-primary-400 tw-shadow-inner tw-ring-1 tw-ring-inset tw-ring-iron-700 tw-transition tw-duration-300 tw-ease-out placeholder:tw-text-base placeholder:tw-text-iron-500 hover:tw-ring-iron-650 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-400 md:tw-h-auto md:tw-py-3 md:tw-text-sm md:tw-font-medium md:placeholder:tw-text-sm md:group-data-[profile-typography=true]/curation-dialog:tw-text-base md:group-data-[profile-typography=true]/curation-dialog:tw-font-normal md:group-data-[profile-typography=true]/curation-dialog:placeholder:tw-text-base md:desktop-hover:group-data-[profile-typography=true]/curation-dialog:tw-text-sm md:desktop-hover:group-data-[profile-typography=true]/curation-dialog:placeholder:tw-text-sm"
      />
    </div>
  );
  return (
    <div className="tw-flex tw-flex-col md:tw-gap-4">
      <label
        htmlFor={inputId}
        className="tw-mb-3 tw-block tw-text-[15px] tw-font-semibold tw-leading-5 tw-text-iron-50 md:tw-mb-0 md:tw-text-sm md:tw-font-medium md:tw-text-iron-300 md:group-data-[profile-typography=true]/curation-dialog:tw-text-iron-100"
      >
        {t(locale, "profileCuration.editor.name")}
      </label>
      {isPhone ? [nameInput, presets] : [presets, nameInput]}
    </div>
  );
}

export default function MyStreamWaveCurationCreateDialog({
  wave,
  isOpen,
  onClose: closeDialog,
  onSaved,
  showSuccessToast = true,
  curation,
  permissionMode = "standard",
  panelContainer,
  mobileSheet = false,
}: MyStreamWaveCurationCreateDialogProps) {
  const isPhone = useMediaQuery(PHONE_WAVES_LAYOUT_QUERY);
  const showPhoneSheet = isPhone && mobileSheet;
  const [phoneOpen, setPhoneOpen] = useState(true);
  const onClose = () => {
    if (showPhoneSheet) setPhoneOpen(false);
    else closeDialog();
  };
  const isEmbedded = panelContainer !== undefined;
  const queryClient = useQueryClient();
  const locale = useBrowserLocale();
  const { requestAuth, setToast } = useAuth();
  const isEditMode = !!curation;
  const initialName = curation?.name ?? "";
  const dialogTitle = t(
    locale,
    isEditMode
      ? "profileCuration.editor.editTitle"
      : "profileCuration.editor.createTitle"
  );
  const initialGroupId = curation
    ? curation.group_id || null
    : getWaveAdminGroupId(wave);
  const [name, setName] = useState(initialName);
  const [criteriaDraft, setCriteriaDraft] = useState<ApiCreateGroup | null>(
    null
  );
  const [isEditingCriteria, setIsEditingCriteria] = useState(false);
  const [advancedPermissionsOpen, setAdvancedPermissionsOpen] = useState(false);
  const editButtonRef = useRef<HTMLButtonElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  useKeyboardFocusScroll(scrollRef, "nearest");
  const groupQuery = useSavedGroup(
    isOpen && criteriaDraft === null ? initialGroupId : null
  );
  const savedGroup = groupQuery.data ?? null;
  const preview = useCurationCriteriaPreview(criteriaDraft, savedGroup);
  const trimmedName = name.trim();
  const existingGroupId =
    (isEditMode ? initialGroupId : savedGroup?.id) ?? null;
  const isSubmitDisabled =
    trimmedName.length === 0 ||
    (existingGroupId === null && criteriaDraft === null);

  const openCriteria = () => {
    setIsEditingCriteria(true);
    scrollRef.current?.scrollTo({ top: 0 });
  };

  const closeCriteria = () => {
    setIsEditingCriteria(false);
    globalThis.requestAnimationFrame(() => editButtonRef.current?.focus());
  };

  const stageCriteria = (draft: ApiCreateGroup) => {
    setCriteriaDraft(draft);
    closeCriteria();
  };

  const handleSubmit = () => {
    if (isSubmitDisabled) return;

    if (criteriaDraft) {
      const { group, is_private } = sanitiseGroupPayload(
        criteriaDraft,
        criteriaDraft.name
      );
      saveMutation.mutate({
        name: trimmedName,
        criteria: { group, is_private: is_private ?? false },
      });
    } else if (existingGroupId !== null) {
      saveMutation.mutate({ name: trimmedName, group_id: existingGroupId });
    }
  };

  const saveMutation = useMutation({
    mutationFn: async (body: ApiWaveCurationRequest) => {
      const auth = await requestAuth();
      if (!auth.success) {
        throw new Error(t(locale, "profileCuration.editor.authCancelled"));
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
          message: t(
            locale,
            isEditMode
              ? "profileCuration.editor.updated"
              : "profileCuration.editor.created"
          ),
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
          isEditMode,
          locale,
        }),
      });
    },
  });
  const submitButtonLabel = getSubmitButtonLabel(
    locale,
    saveMutation.isPending,
    isEditMode
  );
  let criteriaFallback = t(locale, "profileCuration.editor.criteriaRequired");
  if (groupQuery.isLoading) {
    criteriaFallback = t(
      locale,
      "waves.create.groups.members.criteria.loading"
    );
  } else if (groupQuery.isError) {
    criteriaFallback = t(locale, "profileCuration.editor.criteriaUnavailable");
  }

  const criteriaSummary = (
    <CurationCriteriaSummary
      target={preview}
      membersAppearance={isPhone ? "inline" : "details"}
      fallback={criteriaFallback}
      editButtonRef={editButtonRef}
      disabled={saveMutation.isPending}
      onEdit={openCriteria}
      onRetry={groupQuery.isError ? () => void groupQuery.refetch() : undefined}
    />
  );

  const content = isEditingCriteria ? (
    <div
      ref={scrollRef}
      className="tw-min-h-0 tw-flex-1 tw-overflow-y-auto tw-p-5 sm:tw-p-6"
    >
      <CurationCriteriaEditor
        groupId={initialGroupId}
        draft={criteriaDraft}
        target={preview}
        replaceUnavailable={
          getStructuredApiErrorStatus(groupQuery.error) === 404
        }
        onSave={stageCriteria}
        onCancel={closeCriteria}
      />
    </div>
  ) : (
    <div
      className={clsx(
        "tw-group/curation-dialog tw-flex tw-min-h-0 tw-flex-1 tw-flex-col",
        isEmbedded && "tw-h-full"
      )}
      data-profile-typography={permissionMode === "profile"}
    >
      <div
        ref={scrollRef}
        className="tw-min-h-0 tw-flex-1 tw-overflow-y-auto tw-scrollbar-thin tw-scrollbar-track-iron-800 tw-scrollbar-thumb-iron-500 desktop-hover:hover:tw-scrollbar-thumb-iron-300"
      >
        <div className="tw-flex tw-flex-col tw-gap-7 tw-px-4 tw-pb-6 tw-pt-5 sm:tw-px-6 md:tw-gap-8 md:tw-py-6">
          <CurationNameField name={name} onChange={setName} isPhone={isPhone} />

          {permissionMode === "profile" ? (
            <details
              open={advancedPermissionsOpen}
              onToggle={(event) =>
                setAdvancedPermissionsOpen(event.currentTarget.open)
              }
              className="tw-group/details tw-rounded-xl tw-border tw-border-solid tw-border-white/[0.06] tw-bg-iron-950/60 tw-px-4 tw-py-1 md:tw-py-3"
            >
              <summary className="tw-cursor-pointer tw-text-meta tw-font-medium tw-text-iron-300 group-data-[profile-typography=true]/curation-dialog:tw-text-iron-100 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400 max-md:tw-flex max-md:tw-min-h-11 max-md:tw-list-none max-md:tw-items-center max-md:tw-justify-between max-md:tw-gap-3 max-md:[&::-webkit-details-marker]:tw-hidden">
                {t(locale, "profileCuration.permissions.advanced")}
                <ChevronDownIcon
                  aria-hidden="true"
                  className="tw-size-4 tw-shrink-0 tw-text-iron-400 tw-transition-transform group-open/details:tw-rotate-180 motion-reduce:tw-transition-none md:tw-hidden"
                />
              </summary>
              <div className="tw-mt-1 tw-space-y-4 tw-pb-3 md:tw-mt-4 md:tw-pb-0">
                <p className="tw-mb-0 tw-text-meta tw-font-normal tw-leading-5 tw-text-iron-500">
                  {t(locale, "profileCuration.permissions.description")}
                </p>
                {advancedPermissionsOpen && criteriaSummary}
              </div>
            </details>
          ) : (
            <div className="md:tw-space-y-4">
              <span className="tw-mb-3 tw-block tw-text-[15px] tw-font-semibold tw-leading-5 tw-text-iron-50 md:tw-mb-0 md:tw-text-sm md:tw-font-medium md:tw-text-iron-300 md:group-data-[profile-typography=true]/curation-dialog:tw-text-iron-100">
                {t(locale, "profileCuration.editor.whoCanCurate")}
              </span>
              {criteriaSummary}
            </div>
          )}
        </div>
      </div>

      <div className="tw-flex-shrink-0 tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-white/[0.06] tw-bg-iron-950 tw-px-4 tw-pb-3 tw-pt-3 sm:tw-px-6 md:tw-py-5">
        <div className="tw-flex tw-justify-end tw-gap-3">
          {!isEmbedded && (
            <Button
              onClick={onClose}
              variant="tertiary"
              size="md"
              className="tw-hidden md:tw-inline-flex"
            >
              {t(locale, "waves.create.actions.cancel")}
            </Button>
          )}
          <Button
            loading={saveMutation.isPending}
            disabled={isSubmitDisabled}
            onClick={handleSubmit}
            variant="primary"
            size="md"
            className="tw-px-6 max-md:tw-h-11 max-md:tw-w-full max-md:tw-rounded-xl max-md:tw-text-[15px]"
          >
            {submitButtonLabel}
          </Button>
        </div>
      </div>
    </div>
  );

  if (showPhoneSheet)
    return (
      <MobileNavigationView
        isOpen={isOpen && phoneOpen}
        onAfterLeave={() => {
          setPhoneOpen(true);
          closeDialog();
        }}
        title={
          isEditingCriteria
            ? t(locale, "profileCuration.editor.editCriteria")
            : dialogTitle
        }
        onBack={onClose}
        presentation="form"
      >
        <MobilePageDraft
          dirty={name !== initialName || criteriaDraft !== null}
          busy={saveMutation.isPending}
        >
          {content}
        </MobilePageDraft>
      </MobileNavigationView>
    );

  if (isEmbedded) {
    return isOpen && panelContainer
      ? createPortal(content, panelContainer)
      : null;
  }

  return (
    <MobileWrapperDialog
      title={
        isEditingCriteria
          ? t(locale, "profileCuration.editor.editCriteria")
          : dialogTitle
      }
      titleClassName={
        permissionMode === "profile"
          ? "!tw-text-lg tw-font-semibold !tw-text-iron-100 md:!tw-text-xl"
          : undefined
      }
      isOpen={isOpen}
      onClose={isEditingCriteria ? closeCriteria : onClose}
      noPadding
      tabletModal
      tall
      maxWidthClass={isEditingCriteria ? "md:tw-max-w-5xl" : "md:tw-max-w-lg"}
      headerClassName="tw-mb-0 tw-border-b tw-border-solid tw-border-x-0 tw-border-t-0 tw-border-white/[0.06] tw-py-4"
    >
      {content}
    </MobileWrapperDialog>
  );
}

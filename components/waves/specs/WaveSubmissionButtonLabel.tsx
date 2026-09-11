"use client";

import { useAuth } from "@/components/auth/Auth";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import type { ApiWave } from "@/generated/models/ApiWave";
import type { ApiWaveMetadata } from "@/generated/models/ApiWaveMetadata";
import { ApiWaveType } from "@/generated/models/ApiWaveType";
import { getToastErrorDetails } from "@/helpers/toast.helpers";
import {
  WAVE_SUBMISSION_BUTTON_LABEL_MAX_LENGTH,
  getDefaultWaveSubmissionButtonLabel,
  getWaveSubmissionButtonLabelFromMetadata,
  getWaveSubmissionButtonLabelMetadataDraft,
  getWaveSubmissionButtonLabelMetadataUpdate,
  normalizeWaveSubmissionButtonLabel,
} from "@/helpers/waves/wave-metadata.helpers";
import { resolveWaveSubmissionExperience } from "@/helpers/waves/wave-submission-experience.helpers";
import { canEditWave } from "@/helpers/waves/waves.helpers";
import { useWave } from "@/hooks/useWave";
import { useWaveMetadata } from "@/hooks/waves/useWaveMetadata";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { replaceWaveMetadata } from "@/services/api/wave-metadata-replacement";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo, useState } from "react";
import WaveSettingEditorActions from "./WaveSettingEditorActions";
import WaveSettingRow from "./WaveSettingRow";

interface WaveSubmissionButtonLabelProps {
  readonly wave: ApiWave;
  readonly display?: "configuration" | "settings";
}

const isSubmissionButtonLabelWave = (wave: ApiWave): boolean =>
  wave.wave.type === ApiWaveType.Rank || wave.wave.type === ApiWaveType.Approve;

const getErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);

interface WaveSubmissionButtonLabelEditorProps {
  readonly defaultLabel: string;
  readonly disabled: boolean;
  readonly draft: string;
  readonly normalizedDraftLength: number;
  readonly onCancel: () => void;
  readonly onDraftChange: (draft: string) => void;
  readonly onSave: () => void;
  readonly onUseDefault: () => void;
  readonly saveDisabled: boolean;
  readonly visibleErrorMessage: string | null;
}

function WaveSubmissionButtonLabelEditor({
  defaultLabel,
  disabled,
  draft,
  normalizedDraftLength,
  onCancel,
  onDraftChange,
  onSave,
  onUseDefault,
  saveDisabled,
  visibleErrorMessage,
}: WaveSubmissionButtonLabelEditorProps) {
  const counterId = "wave-submission-button-label-counter";
  const errorId = "wave-submission-button-label-error";
  const describedBy = visibleErrorMessage
    ? `${counterId} ${errorId}`
    : counterId;

  return (
    // react-doctor-disable-next-line react-doctor/no-prevent-default -- This client-authenticated editor needs native Enter-key submission without navigation.
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSave();
      }}
      className="tw-flex tw-flex-col tw-gap-3"
    >
      <label
        htmlFor="wave-submission-button-label"
        className="tw-text-sm tw-font-medium tw-text-iron-100"
      >
        {t(DEFAULT_LOCALE, "waves.submissionButtonLabel.label")}
      </label>
      <input
        id="wave-submission-button-label"
        aria-describedby={describedBy}
        aria-invalid={visibleErrorMessage ? true : undefined}
        autoComplete="off"
        autoFocus
        disabled={disabled}
        maxLength={WAVE_SUBMISSION_BUTTON_LABEL_MAX_LENGTH}
        placeholder={defaultLabel}
        type="text"
        value={draft}
        onChange={(event) => onDraftChange(event.target.value)}
        className="tw-form-input tw-block tw-w-full tw-appearance-none tw-rounded-lg tw-border-0 tw-bg-iron-900 tw-px-3 tw-py-2 tw-text-sm tw-font-medium tw-text-white tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-iron-650 placeholder:tw-text-iron-500 focus:tw-bg-iron-900 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-400"
      />
      <div
        id={counterId}
        aria-live="polite"
        className="tw-flex tw-justify-end tw-text-xs tw-font-medium tw-text-iron-500"
      >
        {t(DEFAULT_LOCALE, "waves.submissionButtonLabel.counter", {
          count: normalizedDraftLength,
          max: WAVE_SUBMISSION_BUTTON_LABEL_MAX_LENGTH,
        })}
      </div>
      {visibleErrorMessage ? (
        <p
          id={errorId}
          role="alert"
          className="tw-mb-0 tw-text-xs tw-font-medium tw-leading-4 tw-text-error"
        >
          {visibleErrorMessage}
        </p>
      ) : null}
      <WaveSettingEditorActions
        disabled={disabled}
        onCancel={onCancel}
        secondaryAction={{
          disabled: draft.length === 0,
          label: t(DEFAULT_LOCALE, "waves.submissionButtonLabel.useDefault"),
          onClick: onUseDefault,
          variant: "neutral",
        }}
        submitDisabled={saveDisabled}
      />
    </form>
  );
}

export default function WaveSubmissionButtonLabel({
  wave,
  display = "settings",
}: WaveSubmissionButtonLabelProps) {
  const queryClient = useQueryClient();
  const { connectedProfile, activeProfileProxy, requestAuth, setToast } =
    useAuth();
  const { isMemesWave, isCurationWave, isQuorumWave } = useWave(wave);
  const submissionExperience = useMemo(
    () =>
      resolveWaveSubmissionExperience({
        isMemesWave,
        isCurationWave,
        isQuorumWave,
        submissionStrategy: wave.participation.submission_strategy ?? null,
      }),
    [
      isCurationWave,
      isMemesWave,
      isQuorumWave,
      wave.participation.submission_strategy,
    ]
  );
  const metadataQuery = useWaveMetadata(wave.id, {
    enabled: isSubmissionButtonLabelWave(wave),
  });
  const metadata = metadataQuery.data ?? null;
  const label = useMemo(
    () =>
      getWaveSubmissionButtonLabelFromMetadata({
        metadata,
        submissionExperience,
      }),
    [metadata, submissionExperience]
  );
  const defaultLabel =
    getDefaultWaveSubmissionButtonLabel(submissionExperience);
  const [draft, setDraft] = useState("");
  const [hasTouched, setHasTouched] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const canEdit =
    !metadataQuery.isLoading &&
    !metadataQuery.isError &&
    canEditWave({ connectedProfile, activeProfileProxy, wave });
  const normalizedDraft = normalizeWaveSubmissionButtonLabel(draft);
  const validationErrorMessage =
    normalizedDraft.length > WAVE_SUBMISSION_BUTTON_LABEL_MAX_LENGTH
      ? t(DEFAULT_LOCALE, "waves.submissionButtonLabel.errorTooLong", {
          max: WAVE_SUBMISSION_BUTTON_LABEL_MAX_LENGTH,
        })
      : null;
  const visibleErrorMessage =
    hasTouched || hasSubmitted ? validationErrorMessage : null;

  const resetEditor = useCallback(() => {
    setDraft(getWaveSubmissionButtonLabelMetadataDraft(metadata));
    setHasTouched(false);
    setHasSubmitted(false);
  }, [metadata]);

  const setTouchedDraft = useCallback((nextDraft: string) => {
    setDraft(nextDraft);
    setHasTouched(true);
  }, []);

  const getUpdate = useCallback(
    (
      metadataSnapshot: readonly ApiWaveMetadata[] | null,
      draftSnapshot: string
    ) =>
      getWaveSubmissionButtonLabelMetadataUpdate({
        metadata: metadataSnapshot,
        buttonLabel: draftSnapshot,
      }),
    []
  );

  const pendingUpdate = useMemo(
    () => getUpdate(metadata, draft),
    [draft, getUpdate, metadata]
  );
  const hasPendingChanges =
    pendingUpdate.create.length > 0 || pendingUpdate.deleteIds.length > 0;
  const saveDisabled =
    Boolean(validationErrorMessage) ||
    !hasPendingChanges ||
    metadataQuery.isLoading ||
    metadataQuery.isError;

  const saveLabel = useCallback(
    (
      closeEditor: () => void,
      metadataSnapshot: readonly ApiWaveMetadata[] | null,
      updateSnapshot: typeof pendingUpdate
    ) => {
      if (!updateSnapshot.create.length && !updateSnapshot.deleteIds.length) {
        closeEditor();
        return;
      }

      void (async () => {
        setIsSaving(true);
        try {
          const { success } = await requestAuth();
          if (!success) {
            setToast({
              type: "error",
              message: t(
                DEFAULT_LOCALE,
                "waves.submissionButtonLabel.toastAuthFailed"
              ),
            });
            return;
          }

          await replaceWaveMetadata({
            waveId: wave.id,
            metadata: metadataSnapshot,
            ...updateSnapshot,
          });
          await queryClient.invalidateQueries({
            queryKey: [QueryKey.WAVE_METADATA, { wave_id: wave.id }],
          });
          closeEditor();
        } catch (error) {
          setToast({
            type: "error",
            title: t(
              DEFAULT_LOCALE,
              "waves.submissionButtonLabel.toastSaveFailedTitle"
            ),
            description: t(
              DEFAULT_LOCALE,
              "waves.submissionButtonLabel.toastRetry"
            ),
            details: getToastErrorDetails(error, getErrorMessage(error)),
          });
        } finally {
          setIsSaving(false);
        }
      })();
    },
    [queryClient, requestAuth, setToast, wave.id]
  );

  const renderEditor = useCallback(
    ({ closeEditor }: { readonly closeEditor: () => void }) => (
      <WaveSubmissionButtonLabelEditor
        defaultLabel={defaultLabel}
        disabled={isSaving}
        draft={draft}
        normalizedDraftLength={normalizedDraft.length}
        onCancel={closeEditor}
        onDraftChange={setTouchedDraft}
        onSave={() => {
          setHasSubmitted(true);
          if (validationErrorMessage) {
            return;
          }
          saveLabel(closeEditor, metadata, pendingUpdate);
        }}
        onUseDefault={() => setTouchedDraft("")}
        saveDisabled={saveDisabled}
        visibleErrorMessage={visibleErrorMessage}
      />
    ),
    [
      defaultLabel,
      draft,
      isSaving,
      metadata,
      normalizedDraft.length,
      pendingUpdate,
      saveDisabled,
      saveLabel,
      setTouchedDraft,
      validationErrorMessage,
      visibleErrorMessage,
    ]
  );

  if (!isSubmissionButtonLabelWave(wave)) {
    return null;
  }

  return (
    <WaveSettingRow
      canEdit={canEdit}
      editIcon={display === "configuration" ? "gear" : "pencil"}
      editLabel={t(DEFAULT_LOCALE, "waves.submissionButtonLabel.editLabel")}
      label={t(DEFAULT_LOCALE, "waves.submissionButtonLabel.rowLabel")}
      onOpen={resetEditor}
      renderEditor={renderEditor}
      valueLabel={label}
    />
  );
}

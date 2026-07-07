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
import {
  createWaveMetadata,
  deleteWaveMetadata,
} from "@/services/api/waves-v2-api";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo, useState } from "react";
import WaveSettingEditorActions from "./WaveSettingEditorActions";
import WaveSettingRow from "./WaveSettingRow";

interface WaveSubmissionButtonLabelProps {
  readonly wave: ApiWave;
}

const isSubmissionButtonLabelWave = (wave: ApiWave): boolean =>
  wave.wave.type === ApiWaveType.Rank || wave.wave.type === ApiWaveType.Approve;

const getErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);

export default function WaveSubmissionButtonLabel({
  wave,
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
        submissionStrategy: wave.participation?.submission_strategy ?? null,
      }),
    [
      isCurationWave,
      isMemesWave,
      isQuorumWave,
      wave.participation?.submission_strategy,
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
      ? `Label must be ${WAVE_SUBMISSION_BUTTON_LABEL_MAX_LENGTH} characters or fewer.`
      : null;
  const visibleErrorMessage =
    hasTouched || hasSubmitted ? validationErrorMessage : null;

  const resetEditor = useCallback(() => {
    setDraft(getWaveSubmissionButtonLabelMetadataDraft(metadata));
    setHasTouched(false);
    setHasSubmitted(false);
  }, [metadata]);

  const setTouchedDraft = (nextDraft: string) => {
    setDraft(nextDraft);
    setHasTouched(true);
  };

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

  const getSaveDisabled = (): boolean => {
    const update = getUpdate(metadata, draft);
    const hasChanges = update.create.length > 0 || update.deleteIds.length > 0;

    return (
      Boolean(validationErrorMessage) ||
      !hasChanges ||
      metadataQuery.isLoading ||
      metadataQuery.isError
    );
  };

  const saveLabel = (
    closeEditor: () => void,
    metadataSnapshot: readonly ApiWaveMetadata[] | null,
    draftSnapshot: string
  ) => {
    const update = getUpdate(metadataSnapshot, draftSnapshot);
    if (!update.create.length && !update.deleteIds.length) {
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
            message:
              "Couldn't authenticate. Reconnect your wallet and try again.",
          });
          return;
        }

        await Promise.all(
          update.deleteIds.map((metadataId) =>
            deleteWaveMetadata({ waveId: wave.id, metadataId })
          )
        );
        await Promise.all(
          update.create.map((body) =>
            createWaveMetadata({ waveId: wave.id, body })
          )
        );
        await queryClient.invalidateQueries({
          queryKey: [QueryKey.WAVE_METADATA, { wave_id: wave.id }],
        });
        closeEditor();
      } catch (error) {
        setToast({
          type: "error",
          title: "Couldn't save this submission button label.",
          description: "Please try again.",
          details: getToastErrorDetails(error, getErrorMessage(error)),
        });
      } finally {
        setIsSaving(false);
      }
    })();
  };

  if (!isSubmissionButtonLabelWave(wave)) {
    return null;
  }

  function WaveSubmissionButtonLabelEditor({
    closeEditor,
  }: {
    readonly closeEditor: () => void;
  }) {
    const counterId = "wave-submission-button-label-counter";
    const errorId = "wave-submission-button-label-error";
    const describedBy = visibleErrorMessage
      ? `${counterId} ${errorId}`
      : counterId;

    return (
      <form
        className="tw-flex tw-flex-col tw-gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          setHasSubmitted(true);
          if (validationErrorMessage) {
            return;
          }
          saveLabel(closeEditor, metadata, draft);
        }}
      >
        <label
          htmlFor="wave-submission-button-label"
          className="tw-text-sm tw-font-medium tw-text-iron-100"
        >
          Submission button label
        </label>
        <input
          id="wave-submission-button-label"
          aria-describedby={describedBy}
          aria-invalid={visibleErrorMessage ? true : undefined}
          autoComplete="off"
          autoFocus
          disabled={isSaving}
          maxLength={WAVE_SUBMISSION_BUTTON_LABEL_MAX_LENGTH}
          placeholder={defaultLabel}
          type="text"
          value={draft}
          onChange={(event) => setTouchedDraft(event.target.value)}
          className="tw-form-input tw-block tw-w-full tw-appearance-none tw-rounded-lg tw-border-0 tw-bg-iron-900 tw-px-3 tw-py-2 tw-text-sm tw-font-medium tw-text-white tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-iron-650 placeholder:tw-text-iron-500 focus:tw-bg-iron-900 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-400"
        />
        <div
          id={counterId}
          aria-live="polite"
          className="tw-flex tw-justify-end tw-text-xs tw-font-medium tw-text-iron-500"
        >
          {normalizedDraft.length}/{WAVE_SUBMISSION_BUTTON_LABEL_MAX_LENGTH}
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
          disabled={isSaving}
          onCancel={closeEditor}
          secondaryAction={{
            disabled: draft.length === 0,
            label: "Use default",
            onClick: () => setTouchedDraft(""),
            variant: "neutral",
          }}
          submitDisabled={getSaveDisabled()}
        />
      </form>
    );
  }

  return (
    <WaveSettingRow
      canEdit={canEdit}
      editLabel="Edit submission button label"
      label="Submission button"
      onOpen={resetEditor}
      renderEditor={WaveSubmissionButtonLabelEditor}
      valueLabel={label}
    />
  );
}

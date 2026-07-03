"use client";

import { useAuth } from "@/components/auth/Auth";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import type { ApiWave } from "@/generated/models/ApiWave";
import type { ApiWaveMetadata } from "@/generated/models/ApiWaveMetadata";
import { getToastErrorDetails } from "@/helpers/toast.helpers";
import {
  WAVE_CUSTOM_RULES_MAX_LENGTH,
  getWaveCustomRulesFromMetadata,
  getWaveCustomRulesMetadataDraft,
  getWaveCustomRulesMetadataUpdate,
  normalizeWaveCustomRules,
} from "@/helpers/waves/wave-metadata.helpers";
import { canEditWave } from "@/helpers/waves/waves.helpers";
import { useWaveMetadata } from "@/hooks/waves/useWaveMetadata";
import {
  createWaveMetadata,
  deleteWaveMetadata,
} from "@/services/api/waves-v2-api";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo, useState } from "react";
import WaveSettingEditorActions from "./WaveSettingEditorActions";
import WaveSettingRow from "./WaveSettingRow";

interface WaveCustomRulesProps {
  readonly wave: ApiWave;
}

interface WaveCustomRulesEditorProps {
  readonly closeEditor: () => void;
  readonly draft: string;
  readonly errorMessage: string | null;
  readonly isSaving: boolean;
  readonly submitDisabled: boolean;
  readonly onDraftChange: (draft: string) => void;
  readonly onSubmit: () => void;
}

const getErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);

function WaveCustomRulesEditor({
  closeEditor,
  draft,
  errorMessage,
  isSaving,
  submitDisabled,
  onDraftChange,
  onSubmit,
}: WaveCustomRulesEditorProps) {
  const normalizedDraft = normalizeWaveCustomRules(draft);
  const counterId = "wave-custom-rules-counter";
  const errorId = "wave-custom-rules-error";
  const describedBy = errorMessage ? `${counterId} ${errorId}` : counterId;

  return (
    <form
      className="tw-flex tw-flex-col tw-gap-3"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <label
        htmlFor="wave-custom-rules"
        className="tw-text-sm tw-font-medium tw-text-iron-100"
      >
        Display-only rules
      </label>
      <textarea
        id="wave-custom-rules"
        aria-describedby={describedBy}
        aria-invalid={errorMessage ? true : undefined}
        autoFocus
        disabled={isSaving}
        maxLength={WAVE_CUSTOM_RULES_MAX_LENGTH}
        rows={5}
        value={draft}
        onChange={(event) => onDraftChange(event.target.value)}
        className="tw-form-textarea tw-block tw-w-full tw-appearance-none tw-rounded-lg tw-border-0 tw-bg-iron-900 tw-px-3 tw-py-2 tw-text-sm tw-font-medium tw-text-white tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-iron-650 placeholder:tw-text-iron-500 focus:tw-bg-iron-900 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-400"
        placeholder="Add optional display-only creator rules..."
      />
      <div
        id={counterId}
        aria-live="polite"
        className="tw-flex tw-justify-end tw-text-xs tw-font-medium tw-text-iron-500"
      >
        {normalizedDraft.length}/{WAVE_CUSTOM_RULES_MAX_LENGTH}
      </div>
      {errorMessage && (
        <p
          id={errorId}
          role="alert"
          className="tw-mb-0 tw-text-xs tw-font-medium tw-leading-4 tw-text-error"
        >
          {errorMessage}
        </p>
      )}
      <WaveSettingEditorActions
        disabled={isSaving}
        onCancel={closeEditor}
        submitDisabled={submitDisabled}
      />
    </form>
  );
}

export default function WaveCustomRules({ wave }: WaveCustomRulesProps) {
  const queryClient = useQueryClient();
  const { connectedProfile, activeProfileProxy, requestAuth, setToast } =
    useAuth();
  const metadataQuery = useWaveMetadata(wave.id, {
    enabled: true,
  });
  const metadata = metadataQuery.data ?? null;
  const customRules = useMemo(
    () => getWaveCustomRulesFromMetadata(metadata),
    [metadata]
  );
  const [draft, setDraft] = useState("");
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const canEdit =
    !metadataQuery.isLoading &&
    !metadataQuery.isError &&
    canEditWave({ connectedProfile, activeProfileProxy, wave });

  const resetEditor = useCallback(() => {
    setDraft(getWaveCustomRulesMetadataDraft(metadata));
    setSaveError(null);
  }, [metadata]);

  const getUpdate = useCallback(
    (
      metadataSnapshot: readonly ApiWaveMetadata[] | null,
      draftSnapshot: string
    ) =>
      getWaveCustomRulesMetadataUpdate({
        metadata: metadataSnapshot,
        customRules: draftSnapshot,
      }),
    []
  );

  const getSaveDisabled = (): boolean => {
    const update = getUpdate(metadata, draft);
    const hasChanges = update.create.length > 0 || update.deleteIds.length > 0;

    return !hasChanges || metadataQuery.isLoading || metadataQuery.isError;
  };

  const saveCustomRules = (
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
      setSaveError(null);
      try {
        const { success } = await requestAuth();
        if (!success) {
          const message =
            "Couldn't authenticate. Reconnect your wallet and try again.";
          setSaveError(message);
          setToast({
            type: "error",
            message,
          });
          return;
        }

        await Promise.all(
          update.create.map((body) =>
            createWaveMetadata({ waveId: wave.id, body })
          )
        );
        await Promise.all(
          update.deleteIds.map((metadataId) =>
            deleteWaveMetadata({ waveId: wave.id, metadataId })
          )
        );
        await queryClient.invalidateQueries({
          queryKey: [QueryKey.WAVE_METADATA, { wave_id: wave.id }],
        });
        closeEditor();
      } catch (error) {
        setSaveError("Couldn't save these custom rules. Please try again.");
        setToast({
          type: "error",
          title: "Couldn't save these custom rules.",
          description: "Please try again.",
          details: getToastErrorDetails(error, getErrorMessage(error)),
        });
      } finally {
        setIsSaving(false);
      }
    })();
  };

  return (
    <WaveSettingRow
      canEdit={canEdit}
      editLabel="Edit custom rules"
      label="Custom rules"
      onOpen={resetEditor}
      renderEditor={({ closeEditor }) => (
        <WaveCustomRulesEditor
          closeEditor={closeEditor}
          draft={draft}
          errorMessage={saveError}
          isSaving={isSaving}
          submitDisabled={getSaveDisabled()}
          onDraftChange={(nextDraft) => {
            setDraft(nextDraft);
            setSaveError(null);
          }}
          onSubmit={() => saveCustomRules(closeEditor, metadata, draft)}
        />
      )}
      valueLabel={customRules ? "Added" : "None"}
    />
  );
}

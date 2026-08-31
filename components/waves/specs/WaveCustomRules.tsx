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
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import { replaceWaveMetadata } from "@/services/api/wave-metadata-replacement";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo, useState, type ReactNode } from "react";
import { waveRightPanelText } from "@/helpers/waves/wave-right-panel.helpers";
import WaveSettingEditorActions from "./WaveSettingEditorActions";
import WaveSettingRow from "./WaveSettingRow";

interface WaveCustomRulesProps {
  readonly wave: ApiWave;
  readonly display?: "configuration" | "settings";
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
  const locale = useBrowserLocale();
  const normalizedDraft = normalizeWaveCustomRules(draft);
  const counterId = "wave-custom-rules-counter";
  const errorId = "wave-custom-rules-error";
  const describedBy = errorMessage ? `${counterId} ${errorId}` : counterId;

  return (
    <div className="tw-flex tw-flex-col tw-gap-3">
      <label
        htmlFor="wave-custom-rules"
        className="tw-text-sm tw-font-medium tw-text-iron-100"
      >
        {t(locale, "waves.create.rules.guidelinesFieldLabel")}
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
        placeholder={t(locale, "waves.create.rules.guidelinesPlaceholder")}
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
        onSubmit={onSubmit}
        submitDisabled={submitDisabled}
      />
    </div>
  );
}

export default function WaveCustomRules({
  wave,
  display = "settings",
}: WaveCustomRulesProps) {
  const locale = useBrowserLocale();
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
  const isConfiguration = display === "configuration";
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
          const message = t(locale, "waves.create.rules.guidelinesAuthError");
          setSaveError(message);
          setToast({
            type: "error",
            message,
          });
          return;
        }

        await replaceWaveMetadata({
          waveId: wave.id,
          metadata: metadataSnapshot,
          ...update,
        });
        closeEditor();
      } catch (error) {
        setSaveError(t(locale, "waves.create.rules.guidelinesSaveError"));
        setToast({
          type: "error",
          title: t(locale, "waves.create.rules.guidelinesSaveErrorTitle"),
          description: t(
            locale,
            "waves.create.rules.guidelinesSaveErrorDescription"
          ),
          details: getToastErrorDetails(error, getErrorMessage(error)),
        });
      } finally {
        await queryClient
          .invalidateQueries({
            queryKey: [QueryKey.WAVE_METADATA, { wave_id: wave.id }],
          })
          .catch(() => undefined);
        setIsSaving(false);
      }
    })();
  };

  let valueLabel: ReactNode;
  if (isConfiguration) {
    valueLabel = customRules ? (
      <p className="tw-mb-0 tw-whitespace-pre-wrap tw-break-words">
        {customRules}
      </p>
    ) : (
      <p className="tw-mb-0 tw-font-light tw-italic tw-text-iron-500">
        {waveRightPanelText("waves.sidebar.rightPanel.rules.emptyGuidelines")}
      </p>
    );
  } else {
    valueLabel = t(
      locale,
      customRules
        ? "waves.create.rules.guidelinesSettingsAdded"
        : "waves.create.rules.guidelinesSettingsNone"
    );
  }

  return (
    <WaveSettingRow
      canEdit={canEdit}
      editIcon={isConfiguration ? "gear" : "pencil"}
      editLabel={t(locale, "waves.create.rules.guidelinesSettingsEditLabel")}
      label={
        isConfiguration
          ? waveRightPanelText("waves.sidebar.rightPanel.rules.guidelinesTitle")
          : t(locale, "waves.create.rules.guidelinesSettingsLabel")
      }
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
      valueLabel={valueLabel}
      variant={isConfiguration ? "content" : "row"}
    />
  );
}

"use client";

import { useAuth } from "@/components/auth/Auth";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import type { ApiWave } from "@/generated/models/ApiWave";
import type { ApiWaveMetadata } from "@/generated/models/ApiWaveMetadata";
import { ApiWaveType } from "@/generated/models/ApiWaveType";
import {
  getWaveOutcomeVisibilityFromMetadata,
  getWaveOutcomeVisibilityMetadataUpdate,
} from "@/helpers/waves/wave-metadata.helpers";
import { canEditWave } from "@/helpers/waves/waves.helpers";
import { waveRightPanelText } from "@/helpers/waves/wave-right-panel.helpers";
import { useWaveMetadata } from "@/hooks/waves/useWaveMetadata";
import { replaceWaveMetadata } from "@/services/api/wave-metadata-replacement";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo, useState } from "react";
import WaveSettingEditorActions from "./WaveSettingEditorActions";
import WaveSettingRow from "./WaveSettingRow";

interface WaveOutcomesVisibilityProps {
  readonly wave: ApiWave;
  readonly display?: "configuration" | "settings";
}

const isOutcomeVisibilityWave = (wave: ApiWave): boolean => {
  // Perpetual rank waves (no decision strategy) never produce outcomes, so
  // there is nothing for the visibility toggle to show or hide.
  if (wave.wave.type === ApiWaveType.Rank) {
    return Boolean(wave.wave.decisions_strategy);
  }
  return wave.wave.type === ApiWaveType.Approve;
};

const getErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);

interface WaveOutcomesVisibilityEditorProps {
  readonly closeEditor: () => void;
  readonly draftVisible: boolean;
  readonly isSaving: boolean;
  readonly onDraftVisibleChange: (visible: boolean) => void;
  readonly onSave: () => void;
  readonly saveDisabled: boolean;
}

function WaveOutcomesVisibilityEditor({
  closeEditor,
  draftVisible,
  isSaving,
  onDraftVisibleChange,
  onSave,
  saveDisabled,
}: WaveOutcomesVisibilityEditorProps) {
  return (
    // react-doctor-disable-next-line react-doctor/no-prevent-default -- This client-authenticated editor needs native Enter-key submission without navigation.
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSave();
      }}
      className="tw-flex tw-flex-col tw-gap-3"
    >
      <label className="tw-flex tw-items-center tw-justify-between tw-gap-3 tw-text-sm tw-font-medium tw-text-iron-100">
        <span>
          {waveRightPanelText(
            "waves.sidebar.rightPanel.configuration.display.outcomes.editorLabel"
          )}
        </span>
        <input
          autoFocus
          checked={draftVisible}
          className="tw-form-checkbox tw-size-5 tw-rounded tw-border tw-border-solid tw-border-iron-500 tw-bg-iron-950 tw-text-primary-500 focus:tw-ring-primary-400"
          disabled={isSaving}
          type="checkbox"
          onChange={(event) => onDraftVisibleChange(event.target.checked)}
        />
      </label>

      <WaveSettingEditorActions
        disabled={isSaving}
        onCancel={closeEditor}
        submitDisabled={saveDisabled}
      />
    </form>
  );
}

export default function WaveOutcomesVisibility({
  wave,
  display = "settings",
}: WaveOutcomesVisibilityProps) {
  const queryClient = useQueryClient();
  const { connectedProfile, activeProfileProxy, requestAuth, setToast } =
    useAuth();
  const metadataQuery = useWaveMetadata(wave.id, {
    enabled: isOutcomeVisibilityWave(wave),
  });
  const metadata = metadataQuery.data ?? null;
  const outcomesVisible = useMemo(
    () => getWaveOutcomeVisibilityFromMetadata(metadata),
    [metadata]
  );
  const [draftVisible, setDraftVisible] = useState(outcomesVisible);
  const [isSaving, setIsSaving] = useState(false);
  const canEdit =
    !metadataQuery.isLoading &&
    !metadataQuery.isError &&
    canEditWave({ connectedProfile, activeProfileProxy, wave });

  const resetEditor = useCallback(() => {
    setDraftVisible(outcomesVisible);
  }, [outcomesVisible]);

  const getUpdate = useCallback(
    (
      metadataSnapshot: readonly ApiWaveMetadata[] | null,
      outcomesVisibleSnapshot: boolean
    ) =>
      getWaveOutcomeVisibilityMetadataUpdate({
        metadata: metadataSnapshot,
        outcomesVisible: outcomesVisibleSnapshot,
      }),
    []
  );

  const getSaveDisabled = (): boolean => {
    const update = getUpdate(metadata, draftVisible);
    const hasChanges = update.create.length > 0 || update.deleteIds.length > 0;

    return !hasChanges || metadataQuery.isLoading || metadataQuery.isError;
  };

  const saveVisibility = (
    closeEditor: () => void,
    metadataSnapshot: readonly ApiWaveMetadata[] | null,
    outcomesVisibleSnapshot: boolean
  ) => {
    const update = getUpdate(metadataSnapshot, outcomesVisibleSnapshot);
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
            message: "Failed to authenticate",
          });
          return;
        }

        await replaceWaveMetadata({
          waveId: wave.id,
          metadata: metadataSnapshot,
          ...update,
        });
        await queryClient.invalidateQueries({
          queryKey: [QueryKey.WAVE_METADATA, { wave_id: wave.id }],
        });
        closeEditor();
      } catch (error) {
        setToast({
          type: "error",
          message: getErrorMessage(error),
        });
      } finally {
        setIsSaving(false);
      }
    })();
  };

  if (!isOutcomeVisibilityWave(wave)) {
    return null;
  }

  const renderEditor = ({
    closeEditor,
  }: {
    readonly closeEditor: () => void;
  }) => (
    <WaveOutcomesVisibilityEditor
      closeEditor={closeEditor}
      draftVisible={draftVisible}
      isSaving={isSaving}
      onDraftVisibleChange={setDraftVisible}
      onSave={() => saveVisibility(closeEditor, metadata, draftVisible)}
      saveDisabled={getSaveDisabled()}
    />
  );
  const isConfiguration = display === "configuration";
  const editLabel = isConfiguration
    ? waveRightPanelText(
        "waves.sidebar.rightPanel.configuration.display.outcomes.edit"
      )
    : "Edit outcome visibility";
  const label = isConfiguration
    ? waveRightPanelText(
        "waves.sidebar.rightPanel.configuration.display.outcomes.label"
      )
    : "Outcomes";
  let valueLabel: string;
  if (isConfiguration) {
    valueLabel = waveRightPanelText(
      outcomesVisible
        ? "waves.sidebar.rightPanel.configuration.display.outcomes.shown"
        : "waves.sidebar.rightPanel.configuration.display.outcomes.hidden"
    );
  } else {
    valueLabel = outcomesVisible ? "Shown" : "Hidden";
  }

  return (
    <WaveSettingRow
      canEdit={canEdit}
      editIcon={isConfiguration ? "gear" : "pencil"}
      editLabel={editLabel}
      label={label}
      onOpen={resetEditor}
      renderEditor={renderEditor}
      valueLabel={valueLabel}
    />
  );
}

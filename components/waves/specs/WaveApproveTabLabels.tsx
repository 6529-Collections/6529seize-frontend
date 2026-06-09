"use client";

import { useAuth } from "@/components/auth/Auth";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import type { ApiWave } from "@/generated/models/ApiWave";
import type { ApiWaveMetadata } from "@/generated/models/ApiWaveMetadata";
import { ApiWaveType } from "@/generated/models/ApiWaveType";
import {
  APPROVE_WAVE_TAB_LABEL_MAX_LENGTH,
  areApproveWaveTabLabelsDuplicate,
  doApproveWaveTabLabelsUseReservedLabels,
  getApproveWaveDisplayMetadataDraft,
  getApproveWaveDisplayMetadataUpdate,
  getApproveWaveTabLabelsFromMetadata,
  normalizeWaveTabLabel,
} from "@/helpers/waves/wave-metadata.helpers";
import { canEditWave } from "@/helpers/waves/waves.helpers";
import { useWaveMetadata } from "@/hooks/waves/useWaveMetadata";
import {
  createWaveMetadata,
  deleteWaveMetadata,
} from "@/services/api/waves-v2-api";
import type { CreateWaveApproveDisplayConfig } from "@/types/waves.types";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo, useState } from "react";
import WaveApproveTabLabelsEditorForm from "./WaveApproveTabLabelsEditorForm";
import WaveSettingRow from "./WaveSettingRow";

interface WaveApproveTabLabelsProps {
  readonly wave: ApiWave;
}

const EMPTY_DISPLAY: CreateWaveApproveDisplayConfig = {
  approvalsTabLabel: "",
  approvedTabLabel: "",
};

const getErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);

const getValidationErrorMessage = (
  display: CreateWaveApproveDisplayConfig
): string | null => {
  const labels = [
    normalizeWaveTabLabel(display.approvalsTabLabel),
    normalizeWaveTabLabel(display.approvedTabLabel),
  ];

  if (labels.some((label) => label.length > APPROVE_WAVE_TAB_LABEL_MAX_LENGTH)) {
    return `Labels must be ${APPROVE_WAVE_TAB_LABEL_MAX_LENGTH} characters or fewer.`;
  }

  if (areApproveWaveTabLabelsDuplicate(display)) {
    return "Use two different tab labels.";
  }

  if (doApproveWaveTabLabelsUseReservedLabels(display)) {
    return "Labels cannot match existing tabs.";
  }

  return null;
};

export default function WaveApproveTabLabels({
  wave,
}: WaveApproveTabLabelsProps) {
  const queryClient = useQueryClient();
  const { connectedProfile, activeProfileProxy, requestAuth, setToast } =
    useAuth();
  const metadataQuery = useWaveMetadata(wave.id, {
    enabled: wave.wave.type === ApiWaveType.Approve,
  });
  const metadata = metadataQuery.data ?? null;
  const labels = useMemo(
    () => getApproveWaveTabLabelsFromMetadata(metadata),
    [metadata]
  );
  const [draft, setDraft] =
    useState<CreateWaveApproveDisplayConfig>(EMPTY_DISPLAY);
  const [hasTouched, setHasTouched] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const canEdit =
    !metadataQuery.isLoading &&
    !metadataQuery.isError &&
    canEditWave({ connectedProfile, activeProfileProxy, wave });
  const operations = useMemo(
    () =>
      getApproveWaveDisplayMetadataUpdate({
        metadata,
        display: draft,
      }),
    [draft, metadata]
  );
  const validationErrorMessage = getValidationErrorMessage(draft);
  const visibleErrorMessage =
    hasTouched || hasSubmitted ? validationErrorMessage : null;
  const hasChanges =
    operations.create.length > 0 || operations.deleteIds.length > 0;
  const saveDisabled =
    Boolean(validationErrorMessage) ||
    !hasChanges ||
    metadataQuery.isLoading ||
    metadataQuery.isError;

  const resetEditor = useCallback(() => {
    setDraft(getApproveWaveDisplayMetadataDraft(metadata));
    setHasTouched(false);
    setHasSubmitted(false);
  }, [metadata]);

  const setTouchedDraft = (display: CreateWaveApproveDisplayConfig) => {
    setDraft(display);
    setHasTouched(true);
  };

  const saveLabels = (
    closeEditor: () => void,
    displaySnapshot: CreateWaveApproveDisplayConfig,
    metadataSnapshot: readonly ApiWaveMetadata[] | null
  ) => {
    const update = getApproveWaveDisplayMetadataUpdate({
      metadata: metadataSnapshot,
      display: displaySnapshot,
    });

    if (!update.create.length && !update.deleteIds.length) {
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

        await Promise.all([
          ...update.deleteIds.map((metadataId) =>
            deleteWaveMetadata({ waveId: wave.id, metadataId })
          ),
          ...update.create.map((body) =>
            createWaveMetadata({ waveId: wave.id, body })
          ),
        ]);
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

  if (wave.wave.type !== ApiWaveType.Approve) {
    return null;
  }

  const valueLabel = (
    <span className="tw-inline-flex tw-flex-wrap tw-items-center tw-justify-end tw-gap-x-1">
      <span>{labels.approvals}</span>
      <span aria-hidden="true">·</span>
      <span>{labels.approved}</span>
    </span>
  );

  const renderEditor = ({
    closeEditor,
  }: {
    readonly closeEditor: () => void;
  }) => (
    <WaveApproveTabLabelsEditorForm
      disabled={isSaving}
      display={draft}
      errorMessage={visibleErrorMessage}
      onCancel={closeEditor}
      onDisplayChange={setTouchedDraft}
      onSave={() => {
        setHasSubmitted(true);
        if (validationErrorMessage) {
          return;
        }
        saveLabels(closeEditor, { ...draft }, metadata);
      }}
      onUseDefaults={() => {
        setTouchedDraft(EMPTY_DISPLAY);
      }}
      saveDisabled={saveDisabled}
    />
  );

  return (
    <WaveSettingRow
      canEdit={canEdit}
      editLabel="Edit tab labels"
      label="Tab labels"
      onOpen={resetEditor}
      renderEditor={renderEditor}
      valueLabel={valueLabel}
    />
  );
}

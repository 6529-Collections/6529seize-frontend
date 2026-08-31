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
  getApproveWaveDisplayMetadataRows,
  getApproveWaveDisplayMetadataUpdate,
  getApproveWaveTabLabelsFromMetadata,
  normalizeWaveTabLabel,
  WAVE_DISPLAY_METADATA_KEYS,
} from "@/helpers/waves/wave-metadata.helpers";
import { canEditWave } from "@/helpers/waves/waves.helpers";
import { getToastErrorDetails } from "@/helpers/toast.helpers";
import { useWaveMetadata } from "@/hooks/waves/useWaveMetadata";
import { replaceWaveMetadata } from "@/services/api/wave-metadata-replacement";
import type { CreateWaveApproveDisplayConfig } from "@/types/waves.types";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo, useState } from "react";
import WaveApproveTabLabelsEditorForm, {
  type ApproveTabLabelField,
} from "./WaveApproveTabLabelsEditorForm";
import WaveSettingRow from "./WaveSettingRow";

interface WaveApproveTabLabelsProps {
  readonly wave: ApiWave;
  readonly display?: "configuration" | "settings" | undefined;
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

  if (
    labels.some((label) => label.length > APPROVE_WAVE_TAB_LABEL_MAX_LENGTH)
  ) {
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

const getMetadataKeyForField = (field: ApproveTabLabelField): string =>
  field === "approvals"
    ? WAVE_DISPLAY_METADATA_KEYS.approvalsTabLabel
    : WAVE_DISPLAY_METADATA_KEYS.approvedTabLabel;

const getApproveWaveDisplayMetadataFieldUpdate = ({
  metadata,
  display,
  field,
}: {
  readonly metadata: readonly ApiWaveMetadata[] | null | undefined;
  readonly display: CreateWaveApproveDisplayConfig;
  readonly field: ApproveTabLabelField;
}) => {
  const dataKey = getMetadataKeyForField(field);
  const fieldMetadataIds = new Set(
    getApproveWaveDisplayMetadataRows({ metadata, dataKey }).map(
      (item) => item.id
    )
  );
  const update = getApproveWaveDisplayMetadataUpdate({ metadata, display });

  return {
    create: update.create.filter((body) => body.data_key === dataKey),
    deleteIds: update.deleteIds.filter((metadataId) =>
      fieldMetadataIds.has(metadataId)
    ),
  };
};

interface WaveApproveTabLabelsFieldEditorProps {
  readonly disabled: boolean;
  readonly display: CreateWaveApproveDisplayConfig;
  readonly errorMessage: string | null;
  readonly field: ApproveTabLabelField;
  readonly onDisplayChange: (display: CreateWaveApproveDisplayConfig) => void;
  readonly onSave: () => void;
  readonly onUseDefault: () => void;
  readonly saveDisabled: boolean;
  readonly closeEditor: () => void;
}

function WaveApproveTabLabelsFieldEditor({
  closeEditor,
  disabled,
  display,
  errorMessage,
  field,
  onDisplayChange,
  onSave,
  onUseDefault,
  saveDisabled,
}: WaveApproveTabLabelsFieldEditorProps) {
  return (
    <WaveApproveTabLabelsEditorForm
      disabled={disabled}
      display={display}
      errorMessage={errorMessage}
      field={field}
      onCancel={closeEditor}
      onDisplayChange={onDisplayChange}
      onSave={onSave}
      onUseDefault={onUseDefault}
      saveDisabled={saveDisabled}
    />
  );
}

export default function WaveApproveTabLabels({
  wave,
  display = "settings",
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
  const validationErrorMessage = getValidationErrorMessage(draft);
  const visibleErrorMessage =
    hasTouched || hasSubmitted ? validationErrorMessage : null;
  const editIcon = display === "configuration" ? "gear" : "pencil";

  const resetEditor = useCallback(() => {
    setDraft(getApproveWaveDisplayMetadataDraft(metadata));
    setHasTouched(false);
    setHasSubmitted(false);
  }, [metadata]);

  const setTouchedDraft = (nextDisplay: CreateWaveApproveDisplayConfig) => {
    setDraft(nextDisplay);
    setHasTouched(true);
  };

  const saveLabels = (
    closeEditor: () => void,
    field: ApproveTabLabelField,
    displaySnapshot: CreateWaveApproveDisplayConfig,
    metadataSnapshot: readonly ApiWaveMetadata[] | null
  ) => {
    const update = getApproveWaveDisplayMetadataFieldUpdate({
      metadata: metadataSnapshot,
      display: displaySnapshot,
      field,
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
            message:
              "Couldn't authenticate. Reconnect your wallet and try again.",
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
          title: "Couldn't save these tab labels.",
          description: "Please try again.",
          details: getToastErrorDetails(error, getErrorMessage(error)),
        });
      } finally {
        setIsSaving(false);
      }
    })();
  };

  if (wave.wave.type !== ApiWaveType.Approve) {
    return null;
  }

  const getSaveDisabled = (field: ApproveTabLabelField): boolean => {
    const update = getApproveWaveDisplayMetadataFieldUpdate({
      metadata,
      display: draft,
      field,
    });
    const hasChanges = update.create.length > 0 || update.deleteIds.length > 0;

    return (
      Boolean(validationErrorMessage) ||
      !hasChanges ||
      metadataQuery.isLoading ||
      metadataQuery.isError
    );
  };

  const renderFieldEditor = (
    field: ApproveTabLabelField,
    closeEditor: () => void
  ) => (
    <WaveApproveTabLabelsFieldEditor
      closeEditor={closeEditor}
      disabled={isSaving}
      display={draft}
      errorMessage={visibleErrorMessage}
      field={field}
      onDisplayChange={setTouchedDraft}
      onSave={() => {
        setHasSubmitted(true);
        if (validationErrorMessage) {
          return;
        }
        saveLabels(closeEditor, field, { ...draft }, metadata);
      }}
      onUseDefault={() => {
        setTouchedDraft(
          field === "approvals"
            ? { ...draft, approvalsTabLabel: "" }
            : { ...draft, approvedTabLabel: "" }
        );
      }}
      saveDisabled={getSaveDisabled(field)}
    />
  );

  const renderApprovalsEditor = ({
    closeEditor,
  }: {
    readonly closeEditor: () => void;
  }) => renderFieldEditor("approvals", closeEditor);
  const renderApprovedEditor = ({
    closeEditor,
  }: {
    readonly closeEditor: () => void;
  }) => renderFieldEditor("approved", closeEditor);

  return (
    <>
      <WaveSettingRow
        canEdit={canEdit}
        editIcon={editIcon}
        editLabel="Edit approvals tab label"
        label="Approvals tab"
        onOpen={resetEditor}
        renderEditor={renderApprovalsEditor}
        valueLabel={labels.approvals}
      />
      <WaveSettingRow
        canEdit={canEdit}
        editIcon={editIcon}
        editLabel="Edit approved tab label"
        label="Approved tab"
        onOpen={resetEditor}
        renderEditor={renderApprovedEditor}
        valueLabel={labels.approved}
      />
    </>
  );
}

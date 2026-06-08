import type { ApiCreateWaveMetadataRequest } from "@/generated/models/ApiCreateWaveMetadataRequest";
import type { ApiWaveMetadata } from "@/generated/models/ApiWaveMetadata";
import type { CreateWaveApproveDisplayConfig } from "@/types/waves.types";

export const APPROVE_WAVE_TAB_LABEL_MAX_LENGTH = 24;

export const DEFAULT_APPROVE_WAVE_TAB_LABELS = {
  approvals: "Approvals",
  approved: "Approved",
} as const;

export const RESERVED_APPROVE_WAVE_TAB_LABELS = [
  "Chat",
  "Sales",
  "Outcome",
  "My Votes",
  "About",
] as const;

export const WAVE_DISPLAY_METADATA_KEYS = {
  approvalsTabLabel: "wave_display.approve.tabs.approvals_label",
  approvedTabLabel: "wave_display.approve.tabs.approved_label",
} as const;

interface ApproveWaveLabelInput {
  readonly approvalsTabLabel?: string | null | undefined;
  readonly approvedTabLabel?: string | null | undefined;
}

export interface ApproveWaveTabLabels {
  readonly approvals: string;
  readonly approved: string;
}

export const normalizeWaveTabLabel = (
  value: string | null | undefined
): string => value?.trim() ?? "";

const normalizeComparableWaveTabLabel = (
  value: string | null | undefined
): string => normalizeWaveTabLabel(value).toLowerCase();

export const isValidCustomWaveTabLabel = (value: string): boolean =>
  value.length > 0 && value.length <= APPROVE_WAVE_TAB_LABEL_MAX_LENGTH;

export const isReservedApproveWaveTabLabel = (
  value: string | null | undefined
): boolean => {
  const normalizedValue = normalizeComparableWaveTabLabel(value);
  if (!normalizedValue) {
    return false;
  }

  return RESERVED_APPROVE_WAVE_TAB_LABELS.some(
    (label) => normalizeComparableWaveTabLabel(label) === normalizedValue
  );
};

const getEffectiveTabLabel = ({
  customLabel,
  defaultLabel,
}: {
  readonly customLabel: string | null | undefined;
  readonly defaultLabel: string;
}): string => {
  const normalized = normalizeWaveTabLabel(customLabel);
  if (!isValidCustomWaveTabLabel(normalized)) {
    return defaultLabel;
  }
  return normalized;
};

export const getEffectiveApproveWaveTabLabels = (
  labels?: ApproveWaveLabelInput | null
): ApproveWaveTabLabels => ({
  approvals: getEffectiveTabLabel({
    customLabel: labels?.approvalsTabLabel,
    defaultLabel: DEFAULT_APPROVE_WAVE_TAB_LABELS.approvals,
  }),
  approved: getEffectiveTabLabel({
    customLabel: labels?.approvedTabLabel,
    defaultLabel: DEFAULT_APPROVE_WAVE_TAB_LABELS.approved,
  }),
});

export const areApproveWaveTabLabelsDuplicate = (
  labels?: ApproveWaveLabelInput | null
): boolean => {
  const effectiveLabels = getEffectiveApproveWaveTabLabels(labels);
  return (
    normalizeComparableWaveTabLabel(effectiveLabels.approvals) ===
    normalizeComparableWaveTabLabel(effectiveLabels.approved)
  );
};

export const doApproveWaveTabLabelsUseReservedLabels = (
  labels?: ApproveWaveLabelInput | null
): boolean =>
  [
    labels?.approvalsTabLabel,
    labels?.approvedTabLabel,
  ].some((label) => isReservedApproveWaveTabLabel(label));

const getMetadataRequest = ({
  dataKey,
  dataValue,
  defaultValue,
}: {
  readonly dataKey: string;
  readonly dataValue: string;
  readonly defaultValue: string;
}): ApiCreateWaveMetadataRequest | null => {
  const normalizedValue = normalizeWaveTabLabel(dataValue);
  if (
    !isValidCustomWaveTabLabel(normalizedValue) ||
    normalizedValue === defaultValue
  ) {
    return null;
  }

  return {
    data_key: dataKey,
    data_value: normalizedValue,
  };
};

export const getCreateWaveDisplayMetadataRequests = (
  display: CreateWaveApproveDisplayConfig | null | undefined
): ApiCreateWaveMetadataRequest[] => {
  if (!display) {
    return [];
  }

  return [
    getMetadataRequest({
      dataKey: WAVE_DISPLAY_METADATA_KEYS.approvalsTabLabel,
      dataValue: display.approvalsTabLabel,
      defaultValue: DEFAULT_APPROVE_WAVE_TAB_LABELS.approvals,
    }),
    getMetadataRequest({
      dataKey: WAVE_DISPLAY_METADATA_KEYS.approvedTabLabel,
      dataValue: display.approvedTabLabel,
      defaultValue: DEFAULT_APPROVE_WAVE_TAB_LABELS.approved,
    }),
  ].filter(
    (request): request is ApiCreateWaveMetadataRequest => request !== null
  );
};

const getLatestMetadataValue = ({
  metadata,
  dataKey,
}: {
  readonly metadata: readonly ApiWaveMetadata[] | null | undefined;
  readonly dataKey: string;
}): string | null => {
  if (!metadata?.length) {
    return null;
  }

  let latest: ApiWaveMetadata | null = null;
  for (const item of metadata) {
    if (item.data_key !== dataKey) {
      continue;
    }
    if (latest === null || item.id > latest.id) {
      latest = item;
    }
  }

  return latest?.data_value ?? null;
};

export const getApproveWaveTabLabelsFromMetadata = (
  metadata: readonly ApiWaveMetadata[] | null | undefined
): ApproveWaveTabLabels => {
  const labels = getEffectiveApproveWaveTabLabels({
    approvalsTabLabel: getLatestMetadataValue({
      metadata,
      dataKey: WAVE_DISPLAY_METADATA_KEYS.approvalsTabLabel,
    }),
    approvedTabLabel: getLatestMetadataValue({
      metadata,
      dataKey: WAVE_DISPLAY_METADATA_KEYS.approvedTabLabel,
    }),
  });

  if (
    normalizeComparableWaveTabLabel(labels.approvals) ===
      normalizeComparableWaveTabLabel(labels.approved) ||
    [labels.approvals, labels.approved].some((label) =>
      isReservedApproveWaveTabLabel(label)
    )
  ) {
    return DEFAULT_APPROVE_WAVE_TAB_LABELS;
  }

  return labels;
};

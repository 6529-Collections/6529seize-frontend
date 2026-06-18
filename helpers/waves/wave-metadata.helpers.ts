import type { ApiCreateWaveMetadataRequest } from "@/generated/models/ApiCreateWaveMetadataRequest";
import type { ApiWaveMetadata } from "@/generated/models/ApiWaveMetadata";
import { ApiWaveType } from "@/generated/models/ApiWaveType";
import type {
  CreateWaveApproveDisplayConfig,
  CreateWaveDisplayConfig,
} from "@/types/waves.types";

export const APPROVE_WAVE_TAB_LABEL_MAX_LENGTH = 24;

export const DEFAULT_APPROVE_WAVE_TAB_LABELS = {
  approvals: "Proposals",
  approved: "Approved",
} as const;

const RESERVED_APPROVE_WAVE_TAB_LABELS = [
  "Chat",
  "Sales",
  "Outcome",
  "My Votes",
  "About",
] as const;

export const WAVE_DISPLAY_METADATA_KEYS = {
  approvalsTabLabel: "wave_display.approve.tabs.approvals_label",
  approvedTabLabel: "wave_display.approve.tabs.approved_label",
  outcomesVisible: "wave_display.outcomes.visible",
} as const;

const HIDDEN_OUTCOME_VISIBILITY_METADATA_VALUE = "false";

type ApproveWaveDisplayMetadataField = {
  readonly displayKey: keyof CreateWaveApproveDisplayConfig;
  readonly dataKey: string;
  readonly defaultValue: string;
};

const APPROVE_WAVE_DISPLAY_METADATA_FIELDS: readonly ApproveWaveDisplayMetadataField[] =
  [
    {
      displayKey: "approvalsTabLabel",
      dataKey: WAVE_DISPLAY_METADATA_KEYS.approvalsTabLabel,
      defaultValue: DEFAULT_APPROVE_WAVE_TAB_LABELS.approvals,
    },
    {
      displayKey: "approvedTabLabel",
      dataKey: WAVE_DISPLAY_METADATA_KEYS.approvedTabLabel,
      defaultValue: DEFAULT_APPROVE_WAVE_TAB_LABELS.approved,
    },
  ];

interface ApproveWaveLabelInput {
  readonly approvalsTabLabel?: string | null | undefined;
  readonly approvedTabLabel?: string | null | undefined;
}

interface ApproveWaveTabLabels {
  readonly approvals: string;
  readonly approved: string;
}

interface ApproveWaveDisplayMetadataUpdate {
  readonly create: ApiCreateWaveMetadataRequest[];
  readonly deleteIds: number[];
}

interface WaveOutcomeVisibilityMetadataUpdate {
  readonly create: ApiCreateWaveMetadataRequest[];
  readonly deleteIds: number[];
}

export const normalizeWaveTabLabel = (
  value: string | null | undefined
): string => value?.trim() ?? "";

const normalizeComparableWaveTabLabel = (
  value: string | null | undefined
): string => normalizeWaveTabLabel(value).toLowerCase();

const isValidCustomWaveTabLabel = (value: string): boolean =>
  value.length > 0 && value.length <= APPROVE_WAVE_TAB_LABEL_MAX_LENGTH;

const isReservedApproveWaveTabLabel = (
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
  [labels?.approvalsTabLabel, labels?.approvedTabLabel].some((label) =>
    isReservedApproveWaveTabLabel(label)
  );

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

export const getCreateWaveDisplayMetadataRequests = ({
  display,
  waveType,
}: {
  readonly display: CreateWaveDisplayConfig | null | undefined;
  readonly waveType: ApiWaveType;
}): ApiCreateWaveMetadataRequest[] => {
  if (!display || waveType === ApiWaveType.Chat) {
    return [];
  }

  const outcomeVisibilityRequest = getOutcomeVisibilityMetadataRequest(
    display.outcomesVisible
  );
  const requests: ApiCreateWaveMetadataRequest[] = outcomeVisibilityRequest
    ? [outcomeVisibilityRequest]
    : [];

  if (waveType !== ApiWaveType.Approve) {
    return requests;
  }

  const approveRequests = [
    getMetadataRequest({
      dataKey: WAVE_DISPLAY_METADATA_KEYS.approvalsTabLabel,
      dataValue: display.approve.approvalsTabLabel,
      defaultValue: DEFAULT_APPROVE_WAVE_TAB_LABELS.approvals,
    }),
    getMetadataRequest({
      dataKey: WAVE_DISPLAY_METADATA_KEYS.approvedTabLabel,
      dataValue: display.approve.approvedTabLabel,
      defaultValue: DEFAULT_APPROVE_WAVE_TAB_LABELS.approved,
    }),
  ].filter(
    (request): request is ApiCreateWaveMetadataRequest => request !== null
  );

  return [...requests, ...approveRequests];
};

export const getApproveWaveDisplayMetadataRows = ({
  metadata,
  dataKey,
}: {
  readonly metadata: readonly ApiWaveMetadata[] | null | undefined;
  readonly dataKey: string;
}): ApiWaveMetadata[] =>
  metadata?.filter((item) => item.data_key === dataKey) ?? [];

const getLatestMetadataItem = ({
  metadata,
  dataKey,
}: {
  readonly metadata: readonly ApiWaveMetadata[] | null | undefined;
  readonly dataKey: string;
}): ApiWaveMetadata | null => {
  const rows = getApproveWaveDisplayMetadataRows({ metadata, dataKey });
  if (!rows.length) {
    return null;
  }

  return rows.reduce((latest, item) => (item.id > latest.id ? item : latest));
};

const getLatestMetadataValue = ({
  metadata,
  dataKey,
}: {
  readonly metadata: readonly ApiWaveMetadata[] | null | undefined;
  readonly dataKey: string;
}): string | null => {
  return getLatestMetadataItem({ metadata, dataKey })?.data_value ?? null;
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

export const getApproveWaveDisplayMetadataDraft = (
  metadata: readonly ApiWaveMetadata[] | null | undefined
): CreateWaveApproveDisplayConfig => {
  const getDraftValue = ({
    dataKey,
    defaultValue,
  }: {
    readonly dataKey: string;
    readonly defaultValue: string;
  }): string => {
    const value = normalizeWaveTabLabel(
      getLatestMetadataValue({ metadata, dataKey })
    );

    return value === defaultValue ? "" : value;
  };

  return {
    approvalsTabLabel: getDraftValue({
      dataKey: WAVE_DISPLAY_METADATA_KEYS.approvalsTabLabel,
      defaultValue: DEFAULT_APPROVE_WAVE_TAB_LABELS.approvals,
    }),
    approvedTabLabel: getDraftValue({
      dataKey: WAVE_DISPLAY_METADATA_KEYS.approvedTabLabel,
      defaultValue: DEFAULT_APPROVE_WAVE_TAB_LABELS.approved,
    }),
  };
};

export const getApproveWaveDisplayMetadataUpdate = ({
  metadata,
  display,
}: {
  readonly metadata: readonly ApiWaveMetadata[] | null | undefined;
  readonly display: CreateWaveApproveDisplayConfig;
}): ApproveWaveDisplayMetadataUpdate => {
  const create: ApiCreateWaveMetadataRequest[] = [];
  const deleteIds: number[] = [];

  for (const field of APPROVE_WAVE_DISPLAY_METADATA_FIELDS) {
    const rows = getApproveWaveDisplayMetadataRows({
      metadata,
      dataKey: field.dataKey,
    });
    const latestValue = normalizeWaveTabLabel(
      getLatestMetadataValue({ metadata, dataKey: field.dataKey })
    );
    const request = getMetadataRequest({
      dataKey: field.dataKey,
      dataValue: display[field.displayKey],
      defaultValue: field.defaultValue,
    });

    if (request === null) {
      deleteIds.push(...rows.map((row) => row.id));
      continue;
    }

    if (latestValue !== request.data_value) {
      create.push(request);
    }
  }

  return { create, deleteIds };
};

const getOutcomeVisibilityMetadataRequest = (
  outcomesVisible: boolean | null | undefined
): ApiCreateWaveMetadataRequest | null => {
  if (outcomesVisible !== false) {
    return null;
  }

  return {
    data_key: WAVE_DISPLAY_METADATA_KEYS.outcomesVisible,
    data_value: HIDDEN_OUTCOME_VISIBILITY_METADATA_VALUE,
  };
};

const parseOutcomeVisibilityMetadataValue = (
  value: string | null | undefined
): boolean => {
  const normalized = value?.trim().toLowerCase();
  if (normalized === HIDDEN_OUTCOME_VISIBILITY_METADATA_VALUE) {
    return false;
  }

  return true;
};

export const getWaveOutcomeVisibilityFromMetadata = (
  metadata: readonly ApiWaveMetadata[] | null | undefined
): boolean =>
  parseOutcomeVisibilityMetadataValue(
    getLatestMetadataValue({
      metadata,
      dataKey: WAVE_DISPLAY_METADATA_KEYS.outcomesVisible,
    })
  );

export const getWaveOutcomeVisibilityMetadataUpdate = ({
  metadata,
  outcomesVisible,
}: {
  readonly metadata: readonly ApiWaveMetadata[] | null | undefined;
  readonly outcomesVisible: boolean;
}): WaveOutcomeVisibilityMetadataUpdate => {
  const rows = getApproveWaveDisplayMetadataRows({
    metadata,
    dataKey: WAVE_DISPLAY_METADATA_KEYS.outcomesVisible,
  });
  const latestValue = getLatestMetadataValue({
    metadata,
    dataKey: WAVE_DISPLAY_METADATA_KEYS.outcomesVisible,
  });
  const request = getOutcomeVisibilityMetadataRequest(outcomesVisible);

  if (request === null) {
    return {
      create: [],
      deleteIds: rows.map((row) => row.id),
    };
  }

  if (
    latestValue?.trim().toLowerCase() ===
    HIDDEN_OUTCOME_VISIBILITY_METADATA_VALUE
  ) {
    return { create: [], deleteIds: [] };
  }

  return { create: [request], deleteIds: [] };
};

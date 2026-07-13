import type { ApiCreateWaveMetadataRequest } from "@/generated/models/ApiCreateWaveMetadataRequest";
import type { ApiWaveMetadata } from "@/generated/models/ApiWaveMetadata";
import { ApiWaveType } from "@/generated/models/ApiWaveType";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import type {
  CreateWaveApproveDisplayConfig,
  CreateWaveDisplayConfig,
} from "@/types/waves.types";
import { WaveSubmissionExperience } from "./wave-submission-experience.helpers";

export const APPROVE_WAVE_TAB_LABEL_MAX_LENGTH = 24;
export const WAVE_SUBMISSION_BUTTON_LABEL_MAX_LENGTH = 24;
export const WAVE_CUSTOM_RULES_MAX_LENGTH = 2000;

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
  submissionButtonLabel: "wave_display.submission.button_label",
  customRules: "wave_display.rules.custom",
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

interface WaveCustomRulesMetadataUpdate {
  readonly create: ApiCreateWaveMetadataRequest[];
  readonly deleteIds: number[];
}

interface WaveSubmissionButtonLabelMetadataUpdate {
  readonly create: ApiCreateWaveMetadataRequest[];
  readonly deleteIds: number[];
}

export const normalizeWaveTabLabel = (
  value: string | null | undefined
): string => value?.trim() ?? "";

export const normalizeWaveSubmissionButtonLabel = (
  value: string | null | undefined
): string => value?.trim() ?? "";

export const normalizeWaveCustomRules = (
  value: string | null | undefined
): string => value?.trim() ?? "";

const normalizeComparableWaveTabLabel = (
  value: string | null | undefined
): string => normalizeWaveTabLabel(value).toLowerCase();

const isValidCustomWaveTabLabel = (value: string): boolean =>
  value.length > 0 && value.length <= APPROVE_WAVE_TAB_LABEL_MAX_LENGTH;

const isValidWaveSubmissionButtonLabel = (value: string): boolean =>
  value.length > 0 && value.length <= WAVE_SUBMISSION_BUTTON_LABEL_MAX_LENGTH;

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

const getCustomRulesMetadataRequest = (
  customRules: string | null | undefined
): ApiCreateWaveMetadataRequest | null => {
  const normalizedRules = normalizeWaveCustomRules(customRules);
  if (!normalizedRules) {
    return null;
  }

  return {
    data_key: WAVE_DISPLAY_METADATA_KEYS.customRules,
    data_value: normalizedRules.slice(0, WAVE_CUSTOM_RULES_MAX_LENGTH),
  };
};

const getSubmissionButtonLabelMetadataRequest = (
  buttonLabel: string | null | undefined
): ApiCreateWaveMetadataRequest | null => {
  const normalizedLabel = normalizeWaveSubmissionButtonLabel(buttonLabel);
  if (!isValidWaveSubmissionButtonLabel(normalizedLabel)) {
    return null;
  }

  return {
    data_key: WAVE_DISPLAY_METADATA_KEYS.submissionButtonLabel,
    data_value: normalizedLabel,
  };
};

export const getCreateWaveDisplayMetadataRequests = ({
  display,
  waveType,
  ongoingRanking = false,
}: {
  readonly display: CreateWaveDisplayConfig | null | undefined;
  readonly waveType: ApiWaveType;
  readonly ongoingRanking?: boolean;
}): ApiCreateWaveMetadataRequest[] => {
  if (!display) {
    return [];
  }

  // A perpetual rank wave never has outcomes to show, so its outcomes tab is
  // always submitted as hidden. The stored preference stays in config (so it
  // is restored if the user switches back to scheduled announcements).
  const isPerpetualRank = waveType === ApiWaveType.Rank && ongoingRanking;
  let outcomeVisibilityRequest: ApiCreateWaveMetadataRequest | null;
  if (waveType === ApiWaveType.Chat) {
    outcomeVisibilityRequest = null;
  } else if (isPerpetualRank) {
    outcomeVisibilityRequest = getOutcomeVisibilityMetadataRequest(false);
  } else {
    outcomeVisibilityRequest = getOutcomeVisibilityMetadataRequest(
      display.outcomesVisible
    );
  }
  const customRulesRequest = getCustomRulesMetadataRequest(display.customRules);
  const submissionButtonLabelRequest =
    waveType === ApiWaveType.Chat
      ? null
      : getSubmissionButtonLabelMetadataRequest(display.submissionButtonLabel);
  const requests = [
    outcomeVisibilityRequest,
    customRulesRequest,
    submissionButtonLabelRequest,
  ].filter(
    (request): request is ApiCreateWaveMetadataRequest => request !== null
  );

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
  return normalized !== HIDDEN_OUTCOME_VISIBILITY_METADATA_VALUE;
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

export const getWaveCustomRulesFromMetadata = (
  metadata: readonly ApiWaveMetadata[] | null | undefined
): string | null => {
  const rules = normalizeWaveCustomRules(
    getLatestMetadataValue({
      metadata,
      dataKey: WAVE_DISPLAY_METADATA_KEYS.customRules,
    })
  );

  return rules || null;
};

export const getWaveCustomRulesMetadataDraft = (
  metadata: readonly ApiWaveMetadata[] | null | undefined
): string => getWaveCustomRulesFromMetadata(metadata) ?? "";

export const getWaveCustomRulesMetadataUpdate = ({
  metadata,
  customRules,
}: {
  readonly metadata: readonly ApiWaveMetadata[] | null | undefined;
  readonly customRules: string | null | undefined;
}): WaveCustomRulesMetadataUpdate => {
  const rows = getApproveWaveDisplayMetadataRows({
    metadata,
    dataKey: WAVE_DISPLAY_METADATA_KEYS.customRules,
  });
  const latestValue = normalizeWaveCustomRules(
    getLatestMetadataValue({
      metadata,
      dataKey: WAVE_DISPLAY_METADATA_KEYS.customRules,
    })
  );
  const request = getCustomRulesMetadataRequest(customRules);

  if (request === null) {
    return {
      create: [],
      deleteIds: rows.map((row) => row.id),
    };
  }

  if (latestValue === request.data_value) {
    return { create: [], deleteIds: [] };
  }

  return { create: [request], deleteIds: rows.map((row) => row.id) };
};

export const getDefaultWaveSubmissionButtonLabel = (
  submissionExperience: WaveSubmissionExperience
): string => {
  switch (submissionExperience) {
    case WaveSubmissionExperience.QUORUM_PROPOSAL:
      return t(
        DEFAULT_LOCALE,
        "waves.submissionButtonLabel.defaultCreateProposal"
      );
    case WaveSubmissionExperience.CURATION_LEGACY:
      return t(DEFAULT_LOCALE, "waves.submissionButtonLabel.defaultDropArt");
    case WaveSubmissionExperience.MEMES_LEGACY:
      return t(DEFAULT_LOCALE, "waves.submissionButtonLabel.defaultDrop");
    case WaveSubmissionExperience.DEFAULT:
    case WaveSubmissionExperience.IDENTITY:
      return t(DEFAULT_LOCALE, "waves.submissionButtonLabel.defaultDrop");
    default:
      return t(DEFAULT_LOCALE, "waves.submissionButtonLabel.defaultDrop");
  }
};

export const getWaveSubmissionButtonLabelOverrideFromMetadata = (
  metadata: readonly ApiWaveMetadata[] | null | undefined
): string | null => {
  const label = normalizeWaveSubmissionButtonLabel(
    getLatestMetadataValue({
      metadata,
      dataKey: WAVE_DISPLAY_METADATA_KEYS.submissionButtonLabel,
    })
  );

  return isValidWaveSubmissionButtonLabel(label) ? label : null;
};

export const getWaveSubmissionButtonLabelFromMetadata = ({
  metadata,
  submissionExperience,
}: {
  readonly metadata: readonly ApiWaveMetadata[] | null | undefined;
  readonly submissionExperience: WaveSubmissionExperience;
}): string =>
  getWaveSubmissionButtonLabelOverrideFromMetadata(metadata) ??
  getDefaultWaveSubmissionButtonLabel(submissionExperience);

export const getWaveSubmissionButtonLabelMetadataDraft = (
  metadata: readonly ApiWaveMetadata[] | null | undefined
): string => getWaveSubmissionButtonLabelOverrideFromMetadata(metadata) ?? "";

export const getWaveSubmissionButtonLabelMetadataUpdate = ({
  metadata,
  buttonLabel,
}: {
  readonly metadata: readonly ApiWaveMetadata[] | null | undefined;
  readonly buttonLabel: string | null | undefined;
}): WaveSubmissionButtonLabelMetadataUpdate => {
  const rows = getApproveWaveDisplayMetadataRows({
    metadata,
    dataKey: WAVE_DISPLAY_METADATA_KEYS.submissionButtonLabel,
  });
  const latestValue = normalizeWaveSubmissionButtonLabel(
    getLatestMetadataValue({
      metadata,
      dataKey: WAVE_DISPLAY_METADATA_KEYS.submissionButtonLabel,
    })
  );
  const request = getSubmissionButtonLabelMetadataRequest(buttonLabel);

  if (request === null) {
    return {
      create: [],
      deleteIds: rows.map((row) => row.id),
    };
  }

  if (latestValue === request.data_value) {
    return { create: [], deleteIds: [] };
  }

  return { create: [request], deleteIds: rows.map((row) => row.id) };
};

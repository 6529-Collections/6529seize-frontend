import {
  DEFAULT_APPROVE_WAVE_TAB_LABELS,
  WAVE_DISPLAY_METADATA_KEYS,
  getApproveWaveDisplayMetadataDraft,
  getApproveWaveDisplayMetadataUpdate,
  getApproveWaveTabLabelsFromMetadata,
  getCreateWaveDisplayMetadataRequests,
  getWaveOutcomeVisibilityFromMetadata,
  getWaveOutcomeVisibilityMetadataUpdate,
} from "@/helpers/waves/wave-metadata.helpers";
import { ApiWaveType } from "@/generated/models/ApiWaveType";

describe("wave-metadata.helpers", () => {
  const defaultDisplay = {
    outcomesVisible: true,
    approve: {
      approvalsTabLabel: "",
      approvedTabLabel: "",
    },
  };

  it("does not create metadata for default or empty labels", () => {
    expect(
      getCreateWaveDisplayMetadataRequests({
        waveType: ApiWaveType.Approve,
        display: {
          ...defaultDisplay,
          approve: {
            approvalsTabLabel: "",
            approvedTabLabel: DEFAULT_APPROVE_WAVE_TAB_LABELS.approved,
          },
        },
      })
    ).toEqual([]);
  });

  it("creates metadata requests for changed labels and trims values", () => {
    expect(
      getCreateWaveDisplayMetadataRequests({
        waveType: ApiWaveType.Approve,
        display: {
          ...defaultDisplay,
          approve: {
            approvalsTabLabel: " Candidates ",
            approvedTabLabel: "Selected",
          },
        },
      })
    ).toEqual([
      {
        data_key: WAVE_DISPLAY_METADATA_KEYS.approvalsTabLabel,
        data_value: "Candidates",
      },
      {
        data_key: WAVE_DISPLAY_METADATA_KEYS.approvedTabLabel,
        data_value: "Selected",
      },
    ]);
  });

  it("creates hidden outcome metadata for rank waves only when hidden", () => {
    expect(
      getCreateWaveDisplayMetadataRequests({
        waveType: ApiWaveType.Rank,
        display: {
          ...defaultDisplay,
          outcomesVisible: false,
        },
      })
    ).toEqual([
      {
        data_key: WAVE_DISPLAY_METADATA_KEYS.outcomesVisible,
        data_value: "false",
      },
    ]);
  });

  it("does not create display metadata for chat waves", () => {
    expect(
      getCreateWaveDisplayMetadataRequests({
        waveType: ApiWaveType.Chat,
        display: {
          ...defaultDisplay,
          outcomesVisible: false,
          approve: {
            approvalsTabLabel: "Candidates",
            approvedTabLabel: "Selected",
          },
        },
      })
    ).toEqual([]);
  });

  it("extracts editable draft values from latest metadata", () => {
    expect(
      getApproveWaveDisplayMetadataDraft([
        {
          id: 1,
          data_key: WAVE_DISPLAY_METADATA_KEYS.approvalsTabLabel,
          data_value: "Old",
        },
        {
          id: 2,
          data_key: WAVE_DISPLAY_METADATA_KEYS.approvalsTabLabel,
          data_value: " Candidates ",
        },
        {
          id: 3,
          data_key: WAVE_DISPLAY_METADATA_KEYS.approvedTabLabel,
          data_value: DEFAULT_APPROVE_WAVE_TAB_LABELS.approved,
        },
      ])
    ).toEqual({
      approvalsTabLabel: "Candidates",
      approvedTabLabel: "",
    });
  });

  it("computes create operations for changed custom labels", () => {
    expect(
      getApproveWaveDisplayMetadataUpdate({
        metadata: [],
        display: {
          approvalsTabLabel: " Candidates ",
          approvedTabLabel: "",
        },
      })
    ).toEqual({
      create: [
        {
          data_key: WAVE_DISPLAY_METADATA_KEYS.approvalsTabLabel,
          data_value: "Candidates",
        },
      ],
      deleteIds: [],
    });
  });

  it("deletes all existing rows when labels reset to defaults", () => {
    expect(
      getApproveWaveDisplayMetadataUpdate({
        metadata: [
          {
            id: 1,
            data_key: WAVE_DISPLAY_METADATA_KEYS.approvalsTabLabel,
            data_value: "Old",
          },
          {
            id: 2,
            data_key: WAVE_DISPLAY_METADATA_KEYS.approvalsTabLabel,
            data_value: "Candidates",
          },
          {
            id: 3,
            data_key: WAVE_DISPLAY_METADATA_KEYS.approvedTabLabel,
            data_value: "Selected",
          },
        ],
        display: {
          approvalsTabLabel: "",
          approvedTabLabel: "Selected",
        },
      })
    ).toEqual({
      create: [],
      deleteIds: [1, 2],
    });
  });

  it("does not create or delete unchanged metadata", () => {
    expect(
      getApproveWaveDisplayMetadataUpdate({
        metadata: [
          {
            id: 1,
            data_key: WAVE_DISPLAY_METADATA_KEYS.approvalsTabLabel,
            data_value: "Candidates",
          },
          {
            id: 2,
            data_key: WAVE_DISPLAY_METADATA_KEYS.approvedTabLabel,
            data_value: "Selected",
          },
        ],
        display: {
          approvalsTabLabel: "Candidates",
          approvedTabLabel: "Selected",
        },
      })
    ).toEqual({
      create: [],
      deleteIds: [],
    });
  });

  it("uses the highest metadata id for duplicate keys", () => {
    const labels = getApproveWaveTabLabelsFromMetadata([
      {
        id: 1,
        data_key: WAVE_DISPLAY_METADATA_KEYS.approvalsTabLabel,
        data_value: "Old",
      },
      {
        id: 2,
        data_key: WAVE_DISPLAY_METADATA_KEYS.approvalsTabLabel,
        data_value: "New",
      },
    ]);

    expect(labels).toEqual({
      approvals: "New",
      approved: "Approved",
    });
  });

  it("falls back to defaults for invalid metadata values", () => {
    const labels = getApproveWaveTabLabelsFromMetadata([
      {
        id: 1,
        data_key: WAVE_DISPLAY_METADATA_KEYS.approvalsTabLabel,
        data_value: "A".repeat(25),
      },
      {
        id: 2,
        data_key: WAVE_DISPLAY_METADATA_KEYS.approvedTabLabel,
        data_value: "Selected",
      },
    ]);

    expect(labels).toEqual({
      approvals: "Proposals",
      approved: "Selected",
    });
  });

  it("falls back to defaults for duplicate metadata labels", () => {
    const labels = getApproveWaveTabLabelsFromMetadata([
      {
        id: 1,
        data_key: WAVE_DISPLAY_METADATA_KEYS.approvalsTabLabel,
        data_value: "Selected",
      },
      {
        id: 2,
        data_key: WAVE_DISPLAY_METADATA_KEYS.approvedTabLabel,
        data_value: "Selected",
      },
    ]);

    expect(labels).toEqual({
      approvals: "Proposals",
      approved: "Approved",
    });
  });

  it("falls back to defaults for reserved metadata labels", () => {
    const labels = getApproveWaveTabLabelsFromMetadata([
      {
        id: 1,
        data_key: WAVE_DISPLAY_METADATA_KEYS.approvalsTabLabel,
        data_value: "Chat",
      },
      {
        id: 2,
        data_key: WAVE_DISPLAY_METADATA_KEYS.approvedTabLabel,
        data_value: "Selected",
      },
    ]);

    expect(labels).toEqual({
      approvals: "Proposals",
      approved: "Approved",
    });
  });

  it("defaults outcome visibility to shown when metadata is missing", () => {
    expect(getWaveOutcomeVisibilityFromMetadata([])).toBe(true);
  });

  it("hides outcomes when latest metadata value is false", () => {
    expect(
      getWaveOutcomeVisibilityFromMetadata([
        {
          id: 1,
          data_key: WAVE_DISPLAY_METADATA_KEYS.outcomesVisible,
          data_value: "true",
        },
        {
          id: 2,
          data_key: WAVE_DISPLAY_METADATA_KEYS.outcomesVisible,
          data_value: "false",
        },
      ])
    ).toBe(false);
  });

  it("defaults outcome visibility to shown for invalid metadata values", () => {
    expect(
      getWaveOutcomeVisibilityFromMetadata([
        {
          id: 1,
          data_key: WAVE_DISPLAY_METADATA_KEYS.outcomesVisible,
          data_value: "hidden",
        },
      ])
    ).toBe(true);
  });

  it("uses the highest outcome visibility metadata id", () => {
    expect(
      getWaveOutcomeVisibilityFromMetadata([
        {
          id: 1,
          data_key: WAVE_DISPLAY_METADATA_KEYS.outcomesVisible,
          data_value: "false",
        },
        {
          id: 2,
          data_key: WAVE_DISPLAY_METADATA_KEYS.outcomesVisible,
          data_value: "true",
        },
      ])
    ).toBe(true);
  });

  it("creates hidden outcome metadata and deletes rows when reset to shown", () => {
    expect(
      getWaveOutcomeVisibilityMetadataUpdate({
        metadata: [],
        outcomesVisible: false,
      })
    ).toEqual({
      create: [
        {
          data_key: WAVE_DISPLAY_METADATA_KEYS.outcomesVisible,
          data_value: "false",
        },
      ],
      deleteIds: [],
    });

    expect(
      getWaveOutcomeVisibilityMetadataUpdate({
        metadata: [
          {
            id: 1,
            data_key: WAVE_DISPLAY_METADATA_KEYS.outcomesVisible,
            data_value: "false",
          },
          {
            id: 2,
            data_key: WAVE_DISPLAY_METADATA_KEYS.outcomesVisible,
            data_value: "hidden",
          },
        ],
        outcomesVisible: true,
      })
    ).toEqual({
      create: [],
      deleteIds: [1, 2],
    });
  });
});

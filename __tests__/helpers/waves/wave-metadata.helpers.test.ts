import {
  DEFAULT_APPROVE_WAVE_TAB_LABELS,
  WAVE_DISPLAY_METADATA_KEYS,
  getApproveWaveDisplayMetadataDraft,
  getApproveWaveDisplayMetadataUpdate,
  getApproveWaveTabLabelsFromMetadata,
  getCreateWaveDisplayMetadataRequests,
} from "@/helpers/waves/wave-metadata.helpers";

describe("wave-metadata.helpers", () => {
  it("does not create metadata for default or empty labels", () => {
    expect(
      getCreateWaveDisplayMetadataRequests({
        approvalsTabLabel: "",
        approvedTabLabel: DEFAULT_APPROVE_WAVE_TAB_LABELS.approved,
      })
    ).toEqual([]);
  });

  it("creates metadata requests for changed labels and trims values", () => {
    expect(
      getCreateWaveDisplayMetadataRequests({
        approvalsTabLabel: " Candidates ",
        approvedTabLabel: "Selected",
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
      approvals: "Approvals",
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
      approvals: "Approvals",
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
      approvals: "Approvals",
      approved: "Approved",
    });
  });
});

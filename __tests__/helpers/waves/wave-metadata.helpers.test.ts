import {
  DEFAULT_APPROVE_WAVE_TAB_LABELS,
  WAVE_DISPLAY_METADATA_KEYS,
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
});

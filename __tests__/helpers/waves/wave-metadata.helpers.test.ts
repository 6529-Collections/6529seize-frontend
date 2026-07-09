import {
  DEFAULT_APPROVE_WAVE_TAB_LABELS,
  WAVE_DISPLAY_METADATA_KEYS,
  getApproveWaveDisplayMetadataDraft,
  getApproveWaveDisplayMetadataUpdate,
  getApproveWaveTabLabelsFromMetadata,
  getCreateWaveDisplayMetadataRequests,
  getDefaultWaveSubmissionButtonLabel,
  getWaveCustomRulesFromMetadata,
  getWaveCustomRulesMetadataUpdate,
  getWaveOutcomeVisibilityFromMetadata,
  getWaveOutcomeVisibilityMetadataUpdate,
  getWaveSubmissionButtonLabelFromMetadata,
  getWaveSubmissionButtonLabelMetadataDraft,
  getWaveSubmissionButtonLabelMetadataUpdate,
  getWaveSubmissionButtonLabelOverrideFromMetadata,
} from "@/helpers/waves/wave-metadata.helpers";
import { ApiWaveType } from "@/generated/models/ApiWaveType";
import { WaveSubmissionExperience } from "@/helpers/waves/wave-submission-experience.helpers";

describe("wave-metadata.helpers", () => {
  const defaultDisplay = {
    customRules: null,
    outcomesVisible: true,
    submissionButtonLabel: null,
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

  it("never hides outcomes for perpetual rank waves", () => {
    expect(
      getCreateWaveDisplayMetadataRequests({
        waveType: ApiWaveType.Rank,
        ongoingRanking: true,
        display: {
          ...defaultDisplay,
          outcomesVisible: false,
        },
      })
    ).toEqual([]);
  });

  it("still hides outcomes for approve waves with a stray ongoing flag", () => {
    expect(
      getCreateWaveDisplayMetadataRequests({
        waveType: ApiWaveType.Approve,
        ongoingRanking: true,
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

  it("creates custom rules metadata for rank and approve waves", () => {
    expect(
      getCreateWaveDisplayMetadataRequests({
        waveType: ApiWaveType.Rank,
        display: {
          ...defaultDisplay,
          customRules: "  Use one submission per artist.  ",
        },
      })
    ).toEqual([
      {
        data_key: WAVE_DISPLAY_METADATA_KEYS.customRules,
        data_value: "Use one submission per artist.",
      },
    ]);
  });

  it("creates submission button label metadata for non-chat waves and trims values", () => {
    expect(
      getCreateWaveDisplayMetadataRequests({
        waveType: ApiWaveType.Rank,
        display: {
          ...defaultDisplay,
          submissionButtonLabel: "  Apply  ",
        },
      })
    ).toEqual([
      {
        data_key: WAVE_DISPLAY_METADATA_KEYS.submissionButtonLabel,
        data_value: "Apply",
      },
    ]);
  });

  it("creates custom rules metadata for chat waves without outcome or approve metadata", () => {
    expect(
      getCreateWaveDisplayMetadataRequests({
        waveType: ApiWaveType.Chat,
        display: {
          ...defaultDisplay,
          customRules: "  Keep chat respectful.  ",
          outcomesVisible: false,
          submissionButtonLabel: "Apply",
          approve: {
            approvalsTabLabel: "Candidates",
            approvedTabLabel: "Selected",
          },
        },
      })
    ).toEqual([
      {
        data_key: WAVE_DISPLAY_METADATA_KEYS.customRules,
        data_value: "Keep chat respectful.",
      },
    ]);
  });

  it("returns default submission button labels by submission experience", () => {
    expect(
      getDefaultWaveSubmissionButtonLabel(WaveSubmissionExperience.DEFAULT)
    ).toBe("Drop");
    expect(
      getDefaultWaveSubmissionButtonLabel(WaveSubmissionExperience.IDENTITY)
    ).toBe("Drop");
    expect(
      getDefaultWaveSubmissionButtonLabel(
        WaveSubmissionExperience.QUORUM_PROPOSAL
      )
    ).toBe("Create Proposal");
    expect(
      getDefaultWaveSubmissionButtonLabel(
        WaveSubmissionExperience.CURATION_LEGACY
      )
    ).toBe("Drop Art");
  });

  it("extracts submission button label metadata with fallback defaults", () => {
    expect(
      getWaveSubmissionButtonLabelFromMetadata({
        metadata: [],
        submissionExperience: WaveSubmissionExperience.DEFAULT,
      })
    ).toBe("Drop");
    expect(
      getWaveSubmissionButtonLabelFromMetadata({
        metadata: [],
        submissionExperience: WaveSubmissionExperience.QUORUM_PROPOSAL,
      })
    ).toBe("Create Proposal");
    expect(
      getWaveSubmissionButtonLabelFromMetadata({
        metadata: [
          {
            id: 1,
            data_key: WAVE_DISPLAY_METADATA_KEYS.submissionButtonLabel,
            data_value: "  Apply  ",
          },
        ],
        submissionExperience: WaveSubmissionExperience.QUORUM_PROPOSAL,
      })
    ).toBe("Apply");
  });

  it("ignores empty or invalid submission button label metadata", () => {
    expect(
      getWaveSubmissionButtonLabelOverrideFromMetadata([
        {
          id: 1,
          data_key: WAVE_DISPLAY_METADATA_KEYS.submissionButtonLabel,
          data_value: "   ",
        },
      ])
    ).toBeNull();
    expect(
      getWaveSubmissionButtonLabelFromMetadata({
        metadata: [
          {
            id: 1,
            data_key: WAVE_DISPLAY_METADATA_KEYS.submissionButtonLabel,
            data_value: "A".repeat(25),
          },
        ],
        submissionExperience: WaveSubmissionExperience.DEFAULT,
      })
    ).toBe("Drop");
  });

  it("uses the latest submission button label metadata as the editable draft", () => {
    const metadata = [
      {
        id: 1,
        data_key: WAVE_DISPLAY_METADATA_KEYS.submissionButtonLabel,
        data_value: "Old",
      },
      {
        id: 2,
        data_key: WAVE_DISPLAY_METADATA_KEYS.submissionButtonLabel,
        data_value: " Current ",
      },
    ];

    expect(getWaveSubmissionButtonLabelMetadataDraft(metadata)).toBe("Current");
  });

  it("creates, replaces, and deletes submission button label metadata updates", () => {
    expect(
      getWaveSubmissionButtonLabelMetadataUpdate({
        metadata: [],
        buttonLabel: "  Apply  ",
      })
    ).toEqual({
      create: [
        {
          data_key: WAVE_DISPLAY_METADATA_KEYS.submissionButtonLabel,
          data_value: "Apply",
        },
      ],
      deleteIds: [],
    });

    expect(
      getWaveSubmissionButtonLabelMetadataUpdate({
        metadata: [
          {
            id: 1,
            data_key: WAVE_DISPLAY_METADATA_KEYS.submissionButtonLabel,
            data_value: "Old",
          },
          {
            id: 2,
            data_key: WAVE_DISPLAY_METADATA_KEYS.submissionButtonLabel,
            data_value: "Apply",
          },
        ],
        buttonLabel: "Submit",
      })
    ).toEqual({
      create: [
        {
          data_key: WAVE_DISPLAY_METADATA_KEYS.submissionButtonLabel,
          data_value: "Submit",
        },
      ],
      deleteIds: [1, 2],
    });

    expect(
      getWaveSubmissionButtonLabelMetadataUpdate({
        metadata: [
          {
            id: 1,
            data_key: WAVE_DISPLAY_METADATA_KEYS.submissionButtonLabel,
            data_value: "Apply",
          },
        ],
        buttonLabel: "",
      })
    ).toEqual({
      create: [],
      deleteIds: [1],
    });
  });

  it("extracts the latest custom rules metadata value", () => {
    expect(
      getWaveCustomRulesFromMetadata([
        {
          id: 1,
          data_key: WAVE_DISPLAY_METADATA_KEYS.customRules,
          data_value: "Old rule",
        },
        {
          id: 2,
          data_key: WAVE_DISPLAY_METADATA_KEYS.customRules,
          data_value: " Current rule ",
        },
      ])
    ).toBe("Current rule");
  });

  it("creates, replaces, and deletes custom rules metadata updates", () => {
    expect(
      getWaveCustomRulesMetadataUpdate({
        metadata: [],
        customRules: "  New rule  ",
      })
    ).toEqual({
      create: [
        {
          data_key: WAVE_DISPLAY_METADATA_KEYS.customRules,
          data_value: "New rule",
        },
      ],
      deleteIds: [],
    });

    expect(
      getWaveCustomRulesMetadataUpdate({
        metadata: [
          {
            id: 1,
            data_key: WAVE_DISPLAY_METADATA_KEYS.customRules,
            data_value: "Old",
          },
          {
            id: 2,
            data_key: WAVE_DISPLAY_METADATA_KEYS.customRules,
            data_value: "Current",
          },
        ],
        customRules: "Replacement",
      })
    ).toEqual({
      create: [
        {
          data_key: WAVE_DISPLAY_METADATA_KEYS.customRules,
          data_value: "Replacement",
        },
      ],
      deleteIds: [1, 2],
    });

    expect(
      getWaveCustomRulesMetadataUpdate({
        metadata: [
          {
            id: 1,
            data_key: WAVE_DISPLAY_METADATA_KEYS.customRules,
            data_value: "Old",
          },
          {
            id: 2,
            data_key: WAVE_DISPLAY_METADATA_KEYS.customRules,
            data_value: "New",
          },
        ],
        customRules: "",
      })
    ).toEqual({
      create: [],
      deleteIds: [1, 2],
    });
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

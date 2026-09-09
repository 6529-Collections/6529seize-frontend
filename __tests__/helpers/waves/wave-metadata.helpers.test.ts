import {
  DEFAULT_APPROVE_WAVE_TAB_LABELS,
  INITIAL_COMPACT_PROPOSAL_CARD_WAVE_IDS,
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
  getWaveProposalCardConfigFromMetadata,
  getWaveProposalCardMetadataRequest,
  getWaveProposalCardMetadataUpdate,
  getWaveProposalCardRecipeFromMetadata,
  getWaveProposalCardsEnabledFromMetadata,
  getWaveSubmissionButtonLabelFromMetadata,
  getWaveSubmissionButtonLabelMetadataDraft,
  getWaveSubmissionButtonLabelMetadataUpdate,
  getWaveSubmissionButtonLabelOverrideFromMetadata,
} from "@/helpers/waves/wave-metadata.helpers";
import { ApiWaveType } from "@/generated/models/ApiWaveType";
import { WaveSubmissionExperience } from "@/helpers/waves/wave-submission-experience.helpers";
import type { CreateWaveDisplayConfig } from "@/types/waves.types";

const INITIAL_PROPOSAL_CARD_WAVE_ID = [
  ...INITIAL_COMPACT_PROPOSAL_CARD_WAVE_IDS,
][0]!;

describe("wave-metadata.helpers", () => {
  const defaultDisplay: CreateWaveDisplayConfig = {
    proposalCards: {
      mode: "standard",
      excerptMaxCharacters: 360,
      showMediaThumbnail: true,
    },
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

  it("always hides outcomes for perpetual rank waves", () => {
    expect(
      getCreateWaveDisplayMetadataRequests({
        waveType: ApiWaveType.Rank,
        ongoingRanking: true,
        display: {
          ...defaultDisplay,
          // Even a stored "visible" preference is not submitted: a perpetual
          // wave has no outcomes to show.
          outcomesVisible: true,
        },
      })
    ).toEqual([
      {
        data_key: WAVE_DISPLAY_METADATA_KEYS.outcomesVisible,
        data_value: "false",
      },
    ]);
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

  it("persists a versioned proposal-card recipe only for custom non-chat waves", () => {
    expect(
      getCreateWaveDisplayMetadataRequests({
        waveType: ApiWaveType.Approve,
        display: {
          ...defaultDisplay,
          proposalCards: {
            mode: "custom",
            excerptMaxCharacters: 420,
            showMediaThumbnail: false,
          },
        },
      })
    ).toContainEqual({
      data_key: WAVE_DISPLAY_METADATA_KEYS.proposalCardRecipe,
      data_value:
        '{"version":1,"layout":"summary","excerpt_max_characters":420,"show_media_thumbnail":false}',
    });

    expect(
      getCreateWaveDisplayMetadataRequests({
        waveType: ApiWaveType.Chat,
        display: {
          ...defaultDisplay,
          proposalCards: {
            mode: "custom",
            excerptMaxCharacters: 420,
            showMediaThumbnail: false,
          },
        },
      })
    ).toEqual([]);
  });

  it("reads and normalizes the versioned proposal-card recipe", () => {
    expect(
      getWaveProposalCardRecipeFromMetadata("custom-wave", [
        {
          id: 1,
          data_key: WAVE_DISPLAY_METADATA_KEYS.proposalCardRecipe,
          data_value:
            '{"version":1,"layout":"summary","excerpt_max_characters":80,"show_media_thumbnail":false}',
        },
      ])
    ).toEqual({
      version: 1,
      layout: "summary",
      excerptMaxCharacters: 120,
      showMediaThumbnail: false,
    });
  });

  it("fails closed for malformed or unsupported explicit recipes", () => {
    expect(
      getWaveProposalCardRecipeFromMetadata(INITIAL_PROPOSAL_CARD_WAVE_ID, [
        {
          id: 1,
          data_key: WAVE_DISPLAY_METADATA_KEYS.proposalCardRecipe,
          data_value: '{"version":2,"layout":"summary"}',
        },
      ])
    ).toBeNull();
  });

  it("lets explicit full presentation override the Network Museum fallback", () => {
    const metadata = [
      {
        id: 1,
        data_key: WAVE_DISPLAY_METADATA_KEYS.proposalCardRecipe,
        data_value: '{"version":1,"layout":"full"}',
      },
    ];

    expect(
      getWaveProposalCardConfigFromMetadata(
        INITIAL_PROPOSAL_CARD_WAVE_ID,
        metadata
      )
    ).toEqual({
      mode: "standard",
      excerptMaxCharacters: 360,
      showMediaThumbnail: true,
    });
    expect(
      getWaveProposalCardRecipeFromMetadata(
        INITIAL_PROPOSAL_CARD_WAVE_ID,
        metadata
      )
    ).toBeNull();
  });

  it("creates explicit metadata updates for existing wave settings", () => {
    const summaryConfig = {
      mode: "custom" as const,
      excerptMaxCharacters: 240,
      showMediaThumbnail: false,
    };

    expect(getWaveProposalCardMetadataRequest(summaryConfig)).toEqual({
      data_key: WAVE_DISPLAY_METADATA_KEYS.proposalCardRecipe,
      data_value:
        '{"version":1,"layout":"summary","excerpt_max_characters":240,"show_media_thumbnail":false}',
    });
    expect(
      getWaveProposalCardMetadataUpdate({
        waveId: INITIAL_PROPOSAL_CARD_WAVE_ID,
        metadata: [],
        proposalCards: {
          mode: "standard",
          excerptMaxCharacters: 360,
          showMediaThumbnail: true,
        },
      })
    ).toEqual({
      create: [
        {
          data_key: WAVE_DISPLAY_METADATA_KEYS.proposalCardRecipe,
          data_value: '{"version":1,"layout":"full"}',
        },
      ],
      deleteIds: [],
    });
  });

  it("replaces legacy proposal-card metadata and skips unchanged recipes", () => {
    const legacyMetadata = [
      {
        id: 7,
        data_key: WAVE_DISPLAY_METADATA_KEYS.compactProposalCards,
        data_value: "true",
      },
    ];
    const defaultSummary = {
      mode: "custom" as const,
      excerptMaxCharacters: 360,
      showMediaThumbnail: true,
    };

    expect(
      getWaveProposalCardMetadataUpdate({
        waveId: "legacy-wave",
        metadata: legacyMetadata,
        proposalCards: defaultSummary,
      })
    ).toEqual({ create: [], deleteIds: [] });
    expect(
      getWaveProposalCardMetadataUpdate({
        waveId: "legacy-wave",
        metadata: legacyMetadata,
        proposalCards: {
          ...defaultSummary,
          excerptMaxCharacters: 240,
        },
      })
    ).toEqual({
      create: [
        {
          data_key: WAVE_DISPLAY_METADATA_KEYS.proposalCardRecipe,
          data_value:
            '{"version":1,"layout":"summary","excerpt_max_characters":240,"show_media_thumbnail":true}',
        },
      ],
      deleteIds: [7],
    });
  });

  it("rolls compact cards out only to Network Museum when metadata is absent", () => {
    expect(
      getWaveProposalCardsEnabledFromMetadata(INITIAL_PROPOSAL_CARD_WAVE_ID, [])
    ).toBe(true);
    expect(
      getWaveProposalCardsEnabledFromMetadata("another-standard-wave", [])
    ).toBe(false);
  });

  it("respects explicit proposal-card metadata without changing malformed defaults", () => {
    expect(
      getWaveProposalCardsEnabledFromMetadata("another-standard-wave", [
        {
          id: 1,
          data_key: WAVE_DISPLAY_METADATA_KEYS.compactProposalCards,
          data_value: " true ",
        },
      ])
    ).toBe(true);
    expect(
      getWaveProposalCardsEnabledFromMetadata(INITIAL_PROPOSAL_CARD_WAVE_ID, [
        {
          id: 2,
          data_key: WAVE_DISPLAY_METADATA_KEYS.compactProposalCards,
          data_value: "false",
        },
      ])
    ).toBe(false);
    expect(
      getWaveProposalCardsEnabledFromMetadata("another-standard-wave", [
        {
          id: 3,
          data_key: WAVE_DISPLAY_METADATA_KEYS.compactProposalCards,
          data_value: "compact",
        },
      ])
    ).toBe(false);
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

  it("replaces existing custom labels", () => {
    expect(
      getApproveWaveDisplayMetadataUpdate({
        metadata: [
          {
            id: 1,
            data_key: WAVE_DISPLAY_METADATA_KEYS.approvalsTabLabel,
            data_value: "Candidates",
          },
        ],
        display: {
          approvalsTabLabel: "Nominees",
          approvedTabLabel: "",
        },
      })
    ).toEqual({
      create: [
        {
          data_key: WAVE_DISPLAY_METADATA_KEYS.approvalsTabLabel,
          data_value: "Nominees",
        },
      ],
      deleteIds: [1],
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

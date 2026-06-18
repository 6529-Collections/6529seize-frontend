import {
  getCreateWaveValidationErrors,
  CREATE_WAVE_VALIDATION_ERROR,
} from "@/helpers/waves/create-wave.validation";
import { ApiWaveType } from "@/generated/models/ApiWaveType";
import { ApiWaveCreditType } from "@/generated/models/ApiWaveCreditType";
import { CreateWaveStep } from "@/types/waves.types";
import { Time } from "@/helpers/time";
import { MEMES_CONTRACT } from "@/constants/constants";

describe("create-wave.validation", () => {
  const HOUR_IN_MS = 60 * 60 * 1000;

  const baseConfig: any = {
    overview: { type: ApiWaveType.Rank, name: "name", image: null },
    groups: {
      canView: null,
      canDrop: null,
      canVote: null,
      canChat: null,
      admin: null,
    },
    dates: {
      submissionStartDate: 1,
      votingStartDate: 1,
      endDate: 2,
      firstDecisionTime: 0,
      subsequentDecisions: [],
      isRolling: false,
    },
    drops: {
      noOfApplicationsAllowedPerParticipant: null,
      requiredTypes: [],
      requiredMetadata: [],
      submissionStrategy: null,
      terms: null,
      signatureRequired: false,
      adminCanDeleteDrops: false,
    },
    chat: { enabled: true },
    voting: {
      type: ApiWaveCreditType.Rep,
      category: "cat",
      profileId: "id",
      maxVotesPerIdentityPerDrop: null,
      winningThreshold: null,
      timeWeighted: {
        enabled: false,
        averagingInterval: 10,
        averagingIntervalUnit: "minutes",
      },
    },
    outcomes: [{ id: 1 }],
    approval: { threshold: null, thresholdTimeMs: null, maxWinners: null },
    display: {
      outcomesVisible: true,
      approve: {
        approvalsTabLabel: "",
        approvedTabLabel: "",
      },
    },
  };

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("validates overview name required", () => {
    const config = {
      ...baseConfig,
      overview: { ...baseConfig.overview, name: "" },
    };
    const errors = getCreateWaveValidationErrors({
      step: CreateWaveStep.OVERVIEW,
      config,
    });
    expect(errors).toContain(CREATE_WAVE_VALIDATION_ERROR.NAME_REQUIRED);
  });

  it("allows approve display labels under the limit", () => {
    const config = {
      ...baseConfig,
      overview: { ...baseConfig.overview, type: ApiWaveType.Approve },
      display: {
        ...baseConfig.display,
        approve: {
          approvalsTabLabel: "Candidates",
          approvedTabLabel: "Selected",
        },
      },
    };

    const errors = getCreateWaveValidationErrors({
      step: CreateWaveStep.OVERVIEW,
      config,
    });

    expect(errors).not.toContain(
      CREATE_WAVE_VALIDATION_ERROR.APPROVE_WAVE_TAB_LABEL_TOO_LONG
    );
    expect(errors).not.toContain(
      CREATE_WAVE_VALIDATION_ERROR.APPROVE_WAVE_TAB_LABELS_DUPLICATE
    );
    expect(errors).not.toContain(
      CREATE_WAVE_VALIDATION_ERROR.APPROVE_WAVE_TAB_LABEL_RESERVED
    );
  });

  it("rejects approve display labels over the limit after trimming", () => {
    const config = {
      ...baseConfig,
      overview: { ...baseConfig.overview, type: ApiWaveType.Approve },
      display: {
        ...baseConfig.display,
        approve: {
          approvalsTabLabel: "A".repeat(25),
          approvedTabLabel: "",
        },
      },
    };

    const errors = getCreateWaveValidationErrors({
      step: CreateWaveStep.OVERVIEW,
      config,
    });

    expect(errors).toContain(
      CREATE_WAVE_VALIDATION_ERROR.APPROVE_WAVE_TAB_LABEL_TOO_LONG
    );
  });

  it("rejects duplicate effective approve display labels", () => {
    const config = {
      ...baseConfig,
      overview: { ...baseConfig.overview, type: ApiWaveType.Approve },
      display: {
        ...baseConfig.display,
        approve: {
          approvalsTabLabel: "",
          approvedTabLabel: "Proposals",
        },
      },
    };

    const errors = getCreateWaveValidationErrors({
      step: CreateWaveStep.OVERVIEW,
      config,
    });

    expect(errors).toContain(
      CREATE_WAVE_VALIDATION_ERROR.APPROVE_WAVE_TAB_LABELS_DUPLICATE
    );
  });

  it.each(["Chat", " chat ", "MY VOTES"])(
    "rejects reserved approve display label %s",
    (label) => {
      const config = {
        ...baseConfig,
        overview: { ...baseConfig.overview, type: ApiWaveType.Approve },
        display: {
          ...baseConfig.display,
          approve: {
            approvalsTabLabel: label,
            approvedTabLabel: "Selected",
          },
        },
      };

      const errors = getCreateWaveValidationErrors({
        step: CreateWaveStep.OVERVIEW,
        config,
      });

      expect(errors).toContain(
        CREATE_WAVE_VALIDATION_ERROR.APPROVE_WAVE_TAB_LABEL_RESERVED
      );
    }
  );

  it("allows recurring rank waves without an end date", () => {
    const now = 1_000;
    jest.spyOn(Time, "currentMillis").mockReturnValue(now);
    const config = {
      ...baseConfig,
      dates: {
        ...baseConfig.dates,
        submissionStartDate: now,
        votingStartDate: now,
        firstDecisionTime: now + 1,
        endDate: null,
        subsequentDecisions: [100],
        isRolling: true,
      },
    };
    const errors = getCreateWaveValidationErrors({
      step: CreateWaveStep.DATES,
      config,
    });
    expect(errors).toEqual([]);
  });

  it("rejects rank dates when first decision and end date are not in the future", () => {
    const now = 1_000;
    jest.spyOn(Time, "currentMillis").mockReturnValue(now);
    const config = {
      ...baseConfig,
      dates: {
        ...baseConfig.dates,
        submissionStartDate: now,
        votingStartDate: now,
        firstDecisionTime: now,
        endDate: now,
        subsequentDecisions: [],
        isRolling: false,
      },
    };

    const errors = getCreateWaveValidationErrors({
      step: CreateWaveStep.DATES,
      config,
    });

    expect(errors).toContain(
      CREATE_WAVE_VALIDATION_ERROR.RANK_DECISION_TIME_MUST_BE_IN_FUTURE
    );
  });

  it("allows rank dates with future first decision and future fixed effective end date", () => {
    const now = 1_000;
    jest.spyOn(Time, "currentMillis").mockReturnValue(now);
    const config = {
      ...baseConfig,
      dates: {
        ...baseConfig.dates,
        submissionStartDate: now,
        votingStartDate: now,
        firstDecisionTime: now + 1,
        endDate: now,
        subsequentDecisions: [100],
        isRolling: false,
      },
    };

    const errors = getCreateWaveValidationErrors({
      step: CreateWaveStep.DATES,
      config,
    });

    expect(errors).not.toContain(
      CREATE_WAVE_VALIDATION_ERROR.RANK_DECISION_TIME_MUST_BE_IN_FUTURE
    );
  });

  it("allows fixed rank dates without a user-selected end date", () => {
    const now = 1_000;
    jest.spyOn(Time, "currentMillis").mockReturnValue(now);
    const config = {
      ...baseConfig,
      dates: {
        ...baseConfig.dates,
        submissionStartDate: now,
        votingStartDate: now,
        firstDecisionTime: now + 1,
        endDate: null,
        subsequentDecisions: [100],
        isRolling: false,
      },
    };

    const errors = getCreateWaveValidationErrors({
      step: CreateWaveStep.DATES,
      config,
    });

    expect(errors).not.toContain(
      CREATE_WAVE_VALIDATION_ERROR.END_DATE_REQUIRED
    );
    expect(errors).not.toContain(
      CREATE_WAVE_VALIDATION_ERROR.RANK_DECISION_TIME_MUST_BE_IN_FUTURE
    );
  });

  it("checks the configured end date for rolling rank dates", () => {
    const now = 1_000;
    jest.spyOn(Time, "currentMillis").mockReturnValue(now);
    const config = {
      ...baseConfig,
      dates: {
        ...baseConfig.dates,
        submissionStartDate: now,
        votingStartDate: now,
        firstDecisionTime: now + 1,
        endDate: now,
        subsequentDecisions: [100],
        isRolling: true,
      },
    };

    const errors = getCreateWaveValidationErrors({
      step: CreateWaveStep.DATES,
      config,
    });

    expect(errors).toContain(
      CREATE_WAVE_VALIDATION_ERROR.RANK_DECISION_TIME_MUST_BE_IN_FUTURE
    );
  });

  it("keeps explicit rolling rank end-before-voting validation", () => {
    jest.spyOn(Time, "currentMillis").mockReturnValue(0);
    const config = {
      ...baseConfig,
      dates: {
        ...baseConfig.dates,
        submissionStartDate: 10,
        votingStartDate: 10,
        firstDecisionTime: 20,
        endDate: 9,
        subsequentDecisions: [5],
        isRolling: true,
      },
    };

    const errors = getCreateWaveValidationErrors({
      step: CreateWaveStep.DATES,
      config,
    });

    expect(errors).toContain(
      CREATE_WAVE_VALIDATION_ERROR.END_DATE_MUST_BE_AFTER_VOTING_START_DATE
    );
  });

  it("rejects fixed rank dates when the effective end is before voting starts", () => {
    jest.spyOn(Time, "currentMillis").mockReturnValue(0);
    const config = {
      ...baseConfig,
      dates: {
        ...baseConfig.dates,
        submissionStartDate: 10,
        votingStartDate: 30,
        firstDecisionTime: 20,
        endDate: null,
        subsequentDecisions: [5],
        isRolling: false,
      },
    };

    const errors = getCreateWaveValidationErrors({
      step: CreateWaveStep.DATES,
      config,
    });

    expect(errors).toContain(
      CREATE_WAVE_VALIDATION_ERROR.END_DATE_MUST_BE_AFTER_VOTING_START_DATE
    );
  });

  it("rejects rolling rank dates when the first decision is before voting starts", () => {
    const now = 1_000;
    jest.spyOn(Time, "currentMillis").mockReturnValue(now);
    const config = {
      ...baseConfig,
      dates: {
        ...baseConfig.dates,
        submissionStartDate: now,
        votingStartDate: now + HOUR_IN_MS * 2,
        firstDecisionTime: now + HOUR_IN_MS,
        endDate: null,
        subsequentDecisions: [HOUR_IN_MS],
        isRolling: true,
      },
    };

    const errors = getCreateWaveValidationErrors({
      step: CreateWaveStep.DATES,
      config,
    });

    expect(errors).toContain(
      CREATE_WAVE_VALIDATION_ERROR.RANK_FIRST_DECISION_TIME_MUST_BE_AFTER_OR_EQUAL_TO_VOTING_START_DATE
    );
    expect(errors).not.toContain(
      CREATE_WAVE_VALIDATION_ERROR.END_DATE_REQUIRED
    );
    expect(errors).not.toContain(
      CREATE_WAVE_VALIDATION_ERROR.RANK_DECISION_TIME_MUST_BE_IN_FUTURE
    );
  });

  it("uses the first-decision error when a fixed final announcement is after voting starts", () => {
    const now = 1_000;
    jest.spyOn(Time, "currentMillis").mockReturnValue(now);
    const config = {
      ...baseConfig,
      dates: {
        ...baseConfig.dates,
        submissionStartDate: now,
        votingStartDate: now + HOUR_IN_MS * 3,
        firstDecisionTime: now + HOUR_IN_MS * 2,
        endDate: null,
        subsequentDecisions: [HOUR_IN_MS * 2],
        isRolling: false,
      },
    };

    const errors = getCreateWaveValidationErrors({
      step: CreateWaveStep.DATES,
      config,
    });

    expect(errors).toContain(
      CREATE_WAVE_VALIDATION_ERROR.RANK_FIRST_DECISION_TIME_MUST_BE_AFTER_OR_EQUAL_TO_VOTING_START_DATE
    );
    expect(errors).not.toContain(
      CREATE_WAVE_VALIDATION_ERROR.END_DATE_MUST_BE_AFTER_VOTING_START_DATE
    );
  });

  it("allows first rank decision at the voting start time", () => {
    const now = 1_000;
    const votingStartDate = now + HOUR_IN_MS;
    jest.spyOn(Time, "currentMillis").mockReturnValue(now);
    const config = {
      ...baseConfig,
      dates: {
        ...baseConfig.dates,
        submissionStartDate: now,
        votingStartDate,
        firstDecisionTime: votingStartDate,
        endDate: null,
        subsequentDecisions: [],
        isRolling: false,
      },
    };

    const errors = getCreateWaveValidationErrors({
      step: CreateWaveStep.DATES,
      config,
    });

    expect(errors).not.toContain(
      CREATE_WAVE_VALIDATION_ERROR.RANK_FIRST_DECISION_TIME_MUST_BE_AFTER_OR_EQUAL_TO_VOTING_START_DATE
    );
  });

  it("chat waves cannot have voting", () => {
    const chatConfig = {
      ...baseConfig,
      overview: { type: ApiWaveType.Chat, name: "n", image: null },
      voting: {
        type: ApiWaveCreditType.Rep,
        category: "c",
        profileId: "p",
        timeWeighted: {
          enabled: false,
          averagingInterval: 5,
          averagingIntervalUnit: "minutes",
        },
      },
    };
    const errors = getCreateWaveValidationErrors({
      step: CreateWaveStep.VOTING,
      config: chatConfig,
    });
    expect(errors).toContain(
      CREATE_WAVE_VALIDATION_ERROR.CHAT_WAVE_CANNOT_HAVE_VOTING
    );
  });

  it("chat waves cannot have a vote cap", () => {
    const chatConfig = {
      ...baseConfig,
      overview: { type: ApiWaveType.Chat, name: "n", image: null },
      voting: {
        type: null,
        category: null,
        profileId: null,
        maxVotesPerIdentityPerDrop: 1,
        timeWeighted: {
          enabled: false,
          averagingInterval: 5,
          averagingIntervalUnit: "minutes",
        },
      },
    };
    const errors = getCreateWaveValidationErrors({
      step: CreateWaveStep.VOTING,
      config: chatConfig,
    });
    expect(errors).toContain(
      CREATE_WAVE_VALIDATION_ERROR.CHAT_WAVE_CANNOT_HAVE_VOTING
    );
  });

  it("approval threshold required for approve waves on voting step", () => {
    const approveConfig = {
      ...baseConfig,
      overview: { type: ApiWaveType.Approve, name: "n", image: null },
      approval: { threshold: null, thresholdTimeMs: null, maxWinners: null },
    };
    const errors = getCreateWaveValidationErrors({
      step: CreateWaveStep.VOTING,
      config: approveConfig,
    });
    expect(errors).toContain(
      CREATE_WAVE_VALIDATION_ERROR.APPROVAL_THRESHOLD_REQUIRED
    );
  });

  it("allows blank approve threshold hold time", () => {
    const startDate = 1_000;
    const approveConfig = {
      ...baseConfig,
      overview: { type: ApiWaveType.Approve, name: "n", image: null },
      dates: {
        ...baseConfig.dates,
        submissionStartDate: startDate,
        votingStartDate: startDate,
        endDate: startDate + HOUR_IN_MS,
      },
      approval: { threshold: 1, thresholdTimeMs: null, maxWinners: null },
    };

    const errors = getCreateWaveValidationErrors({
      step: CreateWaveStep.VOTING,
      config: approveConfig,
    });

    expect(errors).not.toContain(
      CREATE_WAVE_VALIDATION_ERROR.APPROVAL_THRESHOLD_TIME_INVALID
    );
    expect(errors).not.toContain(
      CREATE_WAVE_VALIDATION_ERROR.APPROVAL_THRESHOLD_TIME_EXCEEDS_WAVE_DURATION
    );
  });

  it("allows positive whole approve threshold hold time", () => {
    const startDate = 1_000;
    const approveConfig = {
      ...baseConfig,
      overview: { type: ApiWaveType.Approve, name: "n", image: null },
      dates: {
        ...baseConfig.dates,
        submissionStartDate: startDate,
        votingStartDate: startDate,
        endDate: startDate + HOUR_IN_MS,
      },
      approval: {
        threshold: 1,
        thresholdTimeMs: HOUR_IN_MS,
        maxWinners: null,
      },
    };

    const errors = getCreateWaveValidationErrors({
      step: CreateWaveStep.VOTING,
      config: approveConfig,
    });

    expect(errors).not.toContain(
      CREATE_WAVE_VALIDATION_ERROR.APPROVAL_THRESHOLD_TIME_INVALID
    );
    expect(errors).not.toContain(
      CREATE_WAVE_VALIDATION_ERROR.APPROVAL_THRESHOLD_TIME_EXCEEDS_WAVE_DURATION
    );
  });

  it("allows approve waves with threshold hold time and time weighted voting enabled", () => {
    const approveConfig = {
      ...baseConfig,
      overview: { type: ApiWaveType.Approve, name: "n", image: null },
      dates: {
        ...baseConfig.dates,
        submissionStartDate: 1_000,
        votingStartDate: 1_000,
        endDate: 1_000 + HOUR_IN_MS,
      },
      approval: {
        threshold: 1,
        thresholdTimeMs: HOUR_IN_MS,
        maxWinners: null,
      },
      voting: {
        ...baseConfig.voting,
        timeWeighted: {
          enabled: true,
          averagingInterval: 1,
          averagingIntervalUnit: "hours",
        },
      },
    };

    const errors = getCreateWaveValidationErrors({
      step: CreateWaveStep.VOTING,
      config: approveConfig,
    });

    expect(errors).toEqual([]);
  });

  it("rejects invalid approve threshold hold time", () => {
    for (const thresholdTimeMs of [0, -60_000, 1.5, HOUR_IN_MS + 1]) {
      const approveConfig = {
        ...baseConfig,
        overview: { type: ApiWaveType.Approve, name: "n", image: null },
        approval: {
          threshold: 1,
          thresholdTimeMs,
          maxWinners: null,
        },
      };

      const errors = getCreateWaveValidationErrors({
        step: CreateWaveStep.VOTING,
        config: approveConfig,
      });

      expect(errors).toContain(
        CREATE_WAVE_VALIDATION_ERROR.APPROVAL_THRESHOLD_TIME_INVALID
      );
    }
  });

  it("rejects approve threshold hold time longer than the wave duration", () => {
    const startDate = 1_000;
    const approveConfig = {
      ...baseConfig,
      overview: { type: ApiWaveType.Approve, name: "n", image: null },
      dates: {
        ...baseConfig.dates,
        submissionStartDate: startDate,
        votingStartDate: startDate,
        endDate: startDate + HOUR_IN_MS,
      },
      approval: {
        threshold: 1,
        thresholdTimeMs: HOUR_IN_MS * 2,
        maxWinners: null,
      },
    };

    const errors = getCreateWaveValidationErrors({
      step: CreateWaveStep.VOTING,
      config: approveConfig,
    });

    expect(errors).toContain(
      CREATE_WAVE_VALIDATION_ERROR.APPROVAL_THRESHOLD_TIME_EXCEEDS_WAVE_DURATION
    );
  });

  it("allows approve threshold hold time without an end date", () => {
    const approveConfig = {
      ...baseConfig,
      overview: { type: ApiWaveType.Approve, name: "n", image: null },
      dates: {
        ...baseConfig.dates,
        submissionStartDate: 1_000,
        votingStartDate: 1_000,
        endDate: null,
      },
      approval: {
        threshold: 1,
        thresholdTimeMs: HOUR_IN_MS * 48,
        maxWinners: null,
      },
    };

    const errors = getCreateWaveValidationErrors({
      step: CreateWaveStep.VOTING,
      config: approveConfig,
    });

    expect(errors).not.toContain(
      CREATE_WAVE_VALIDATION_ERROR.APPROVAL_THRESHOLD_TIME_EXCEEDS_WAVE_DURATION
    );
  });

  it("detects duplicate required metadata", () => {
    const drops = {
      ...baseConfig.drops,
      requiredMetadata: [
        { key: "a", type: "t" },
        { key: "a", type: "t2" },
      ],
    };
    const config = { ...baseConfig, drops };
    const errors = getCreateWaveValidationErrors({
      step: CreateWaveStep.DROPS,
      config,
    });
    expect(errors).toContain(
      CREATE_WAVE_VALIDATION_ERROR.DROPS_REQUIRED_METADATA_NON_UNIQUE
    );
  });

  it("rejects reserved identity metadata keys for identity nomination waves", () => {
    const config = {
      ...baseConfig,
      drops: {
        ...baseConfig.drops,
        requiredMetadata: [{ key: " Identity ", type: "t" }],
        submissionStrategy: {
          type: "IDENTITY",
          config: {
            duplicates: "NEVER_ALLOW",
            who_can_be_submitted: "EVERYONE",
          },
        },
      },
    };
    const errors = getCreateWaveValidationErrors({
      step: CreateWaveStep.DROPS,
      config,
    });
    expect(errors).toContain(
      CREATE_WAVE_VALIDATION_ERROR.DROPS_REQUIRED_METADATA_RESERVED_IDENTITY_KEY
    );
  });

  it("allows identity metadata keys for standard drop waves", () => {
    const config = {
      ...baseConfig,
      drops: {
        ...baseConfig.drops,
        requiredMetadata: [{ key: "IDENTITY", type: "t" }],
        submissionStrategy: null,
      },
    };
    const errors = getCreateWaveValidationErrors({
      step: CreateWaveStep.DROPS,
      config,
    });
    expect(errors).not.toContain(
      CREATE_WAVE_VALIDATION_ERROR.DROPS_REQUIRED_METADATA_RESERVED_IDENTITY_KEY
    );
  });

  it("chat waves cannot have submission strategy", () => {
    const config = {
      ...baseConfig,
      overview: { type: ApiWaveType.Chat, name: "n", image: null },
      drops: {
        ...baseConfig.drops,
        submissionStrategy: {
          type: "IDENTITY",
          config: {
            duplicates: "NEVER_ALLOW",
            who_can_be_submitted: "EVERYONE",
          },
        },
      },
    };
    const errors = getCreateWaveValidationErrors({
      step: CreateWaveStep.DROPS,
      config,
    });
    expect(errors).toContain(
      CREATE_WAVE_VALIDATION_ERROR.DROPS_SUBMISSION_STRATEGY_INVALID
    );
  });

  it("validates time weighted interval for approve waves", () => {
    const config = {
      ...baseConfig,
      overview: { ...baseConfig.overview, type: ApiWaveType.Approve },
      approval: { ...baseConfig.approval, threshold: 1 },
      voting: {
        ...baseConfig.voting,
        winningThreshold: 1,
        timeWeighted: {
          enabled: true,
          averagingInterval: 1,
          averagingIntervalUnit: "minutes",
        },
      },
    };
    const errors = getCreateWaveValidationErrors({
      step: CreateWaveStep.VOTING,
      config,
    });
    expect(errors).toContain(
      CREATE_WAVE_VALIDATION_ERROR.TIME_WEIGHTED_VOTING_INTERVAL_TOO_SMALL
    );
  });

  it("rejects approve time weighted intervals longer than the wave duration", () => {
    const startDate = 1_000;
    const config = {
      ...baseConfig,
      overview: { ...baseConfig.overview, type: ApiWaveType.Approve },
      approval: { ...baseConfig.approval, threshold: 1 },
      dates: {
        ...baseConfig.dates,
        submissionStartDate: startDate,
        votingStartDate: startDate,
        endDate: startDate + HOUR_IN_MS,
      },
      voting: {
        ...baseConfig.voting,
        winningThreshold: 1,
        timeWeighted: {
          enabled: true,
          averagingInterval: 2,
          averagingIntervalUnit: "hours",
        },
      },
    };

    const errors = getCreateWaveValidationErrors({
      step: CreateWaveStep.VOTING,
      config,
    });

    expect(errors).toContain(
      CREATE_WAVE_VALIDATION_ERROR.TIME_WEIGHTED_VOTING_INTERVAL_EXCEEDS_WAVE_DURATION
    );
  });

  it("allows approve time weighted intervals equal to the wave duration", () => {
    const startDate = 1_000;
    const config = {
      ...baseConfig,
      overview: { ...baseConfig.overview, type: ApiWaveType.Approve },
      approval: { ...baseConfig.approval, threshold: 1 },
      dates: {
        ...baseConfig.dates,
        submissionStartDate: startDate,
        votingStartDate: startDate,
        endDate: startDate + HOUR_IN_MS,
      },
      voting: {
        ...baseConfig.voting,
        winningThreshold: 1,
        timeWeighted: {
          enabled: true,
          averagingInterval: 1,
          averagingIntervalUnit: "hours",
        },
      },
    };

    const errors = getCreateWaveValidationErrors({
      step: CreateWaveStep.VOTING,
      config,
    });

    expect(errors).not.toContain(
      CREATE_WAVE_VALIDATION_ERROR.TIME_WEIGHTED_VOTING_INTERVAL_EXCEEDS_WAVE_DURATION
    );
  });

  it("does not apply approve duration validation to rank waves", () => {
    const startDate = 1_000;
    const config = {
      ...baseConfig,
      overview: { ...baseConfig.overview, type: ApiWaveType.Rank },
      dates: {
        ...baseConfig.dates,
        submissionStartDate: startDate,
        votingStartDate: startDate,
        endDate: startDate + HOUR_IN_MS,
      },
      voting: {
        ...baseConfig.voting,
        timeWeighted: {
          enabled: true,
          averagingInterval: 2,
          averagingIntervalUnit: "hours",
        },
      },
    };

    const errors = getCreateWaveValidationErrors({
      step: CreateWaveStep.VOTING,
      config,
    });

    expect(errors).not.toContain(
      CREATE_WAVE_VALIDATION_ERROR.TIME_WEIGHTED_VOTING_INTERVAL_EXCEEDS_WAVE_DURATION
    );
  });

  it("allows approve time weighted voting without an end date", () => {
    const config = {
      ...baseConfig,
      overview: { ...baseConfig.overview, type: ApiWaveType.Approve },
      approval: { ...baseConfig.approval, threshold: 1 },
      dates: {
        ...baseConfig.dates,
        submissionStartDate: 1_000,
        votingStartDate: 1_000,
        endDate: null,
      },
      voting: {
        ...baseConfig.voting,
        winningThreshold: 1,
        timeWeighted: {
          enabled: true,
          averagingInterval: 2,
          averagingIntervalUnit: "hours",
        },
      },
    };

    const errors = getCreateWaveValidationErrors({
      step: CreateWaveStep.VOTING,
      config,
    });

    expect(errors).toEqual([]);
  });

  it("allows approve waves without an end date", () => {
    const config = {
      ...baseConfig,
      overview: { type: ApiWaveType.Approve, name: "n", image: null },
      dates: {
        submissionStartDate: 1,
        votingStartDate: 1,
        endDate: null,
        firstDecisionTime: 0,
        subsequentDecisions: [],
        isRolling: false,
      },
    };
    const errors = getCreateWaveValidationErrors({
      step: CreateWaveStep.DATES,
      config,
    });
    expect(errors).not.toContain(
      CREATE_WAVE_VALIDATION_ERROR.END_DATE_REQUIRED
    );
    expect(errors).not.toContain(
      CREATE_WAVE_VALIDATION_ERROR.END_DATE_MUST_BE_AFTER_VOTING_START_DATE
    );
  });

  it("approve waves require end date after start", () => {
    const config = {
      ...baseConfig,
      overview: { type: ApiWaveType.Approve, name: "n", image: null },
      dates: {
        submissionStartDate: 1,
        votingStartDate: 1,
        endDate: 1,
        firstDecisionTime: 0,
        subsequentDecisions: [],
        isRolling: false,
      },
    };
    const errors = getCreateWaveValidationErrors({
      step: CreateWaveStep.DATES,
      config,
    });
    expect(errors).toContain(
      CREATE_WAVE_VALIDATION_ERROR.END_DATE_MUST_BE_AFTER_VOTING_START_DATE
    );
  });

  it("time weighted interval outside range", () => {
    const config = {
      ...baseConfig,
      voting: {
        type: ApiWaveCreditType.Rep,
        category: "c",
        profileId: "p",
        timeWeighted: {
          enabled: true,
          averagingInterval: 1,
          averagingIntervalUnit: "minutes",
        },
      },
    };
    const errors = getCreateWaveValidationErrors({
      step: CreateWaveStep.VOTING,
      config,
    });
    expect(errors).toContain(
      CREATE_WAVE_VALIDATION_ERROR.TIME_WEIGHTED_VOTING_INTERVAL_TOO_SMALL
    );
  });

  it("allows blank max votes per identity per drop", () => {
    const config = {
      ...baseConfig,
      voting: {
        ...baseConfig.voting,
        maxVotesPerIdentityPerDrop: null,
      },
    };
    const errors = getCreateWaveValidationErrors({
      step: CreateWaveStep.VOTING,
      config,
    });
    expect(errors).not.toContain(
      CREATE_WAVE_VALIDATION_ERROR.MAX_VOTES_PER_IDENTITY_PER_DROP_INVALID
    );
  });

  it("rejects invalid max votes per identity per drop", () => {
    for (const maxVotesPerIdentityPerDrop of [0, -1, 1.5]) {
      const config = {
        ...baseConfig,
        voting: {
          ...baseConfig.voting,
          maxVotesPerIdentityPerDrop,
        },
      };
      const errors = getCreateWaveValidationErrors({
        step: CreateWaveStep.VOTING,
        config,
      });
      expect(errors).toContain(
        CREATE_WAVE_VALIDATION_ERROR.MAX_VOTES_PER_IDENTITY_PER_DROP_INVALID
      );
    }
  });

  it("tdh voting cannot have category or profile id", () => {
    const config = {
      ...baseConfig,
      voting: {
        type: ApiWaveCreditType.Tdh,
        category: "c",
        profileId: "p",
        timeWeighted: {
          enabled: false,
          averagingInterval: 5,
          averagingIntervalUnit: "minutes",
        },
      },
    };
    const errors = getCreateWaveValidationErrors({
      step: CreateWaveStep.VOTING,
      config,
    });
    expect(errors).toContain(
      CREATE_WAVE_VALIDATION_ERROR.TDH_VOTING_CANNOT_HAVE_CATEGORY
    );
    expect(errors).toContain(
      CREATE_WAVE_VALIDATION_ERROR.TDH_VOTING_CANNOT_HAVE_PROFILE_ID
    );
  });

  it("rep voting requires category and profile id", () => {
    const config = {
      ...baseConfig,
      voting: {
        type: ApiWaveCreditType.Rep,
        category: null,
        profileId: null,
        timeWeighted: {
          enabled: false,
          averagingInterval: 5,
          averagingIntervalUnit: "minutes",
        },
      },
    };
    const errors = getCreateWaveValidationErrors({
      step: CreateWaveStep.VOTING,
      config,
    });
    expect(errors).toContain(
      CREATE_WAVE_VALIDATION_ERROR.VOTING_CATEGORY_CANNOT_BE_EMPTY
    );
    expect(errors).toContain(
      CREATE_WAVE_VALIDATION_ERROR.VOTING_PROFILE_ID_CANNOT_BE_EMPTY
    );
  });

  it("rep voting passes with category only", () => {
    const config = {
      ...baseConfig,
      voting: {
        type: ApiWaveCreditType.Rep,
        category: "cat-only",
        profileId: null,
        timeWeighted: {
          enabled: false,
          averagingInterval: 5,
          averagingIntervalUnit: "minutes",
        },
      },
    };
    const errors = getCreateWaveValidationErrors({
      step: CreateWaveStep.VOTING,
      config,
    });
    expect(errors).not.toContain(
      CREATE_WAVE_VALIDATION_ERROR.VOTING_CATEGORY_CANNOT_BE_EMPTY
    );
    expect(errors).not.toContain(
      CREATE_WAVE_VALIDATION_ERROR.VOTING_PROFILE_ID_CANNOT_BE_EMPTY
    );
  });

  it("rep voting passes with profile only", () => {
    const config = {
      ...baseConfig,
      voting: {
        type: ApiWaveCreditType.Rep,
        category: null,
        profileId: "profile-only",
        timeWeighted: {
          enabled: false,
          averagingInterval: 5,
          averagingIntervalUnit: "minutes",
        },
      },
    };
    const errors = getCreateWaveValidationErrors({
      step: CreateWaveStep.VOTING,
      config,
    });
    expect(errors).not.toContain(
      CREATE_WAVE_VALIDATION_ERROR.VOTING_CATEGORY_CANNOT_BE_EMPTY
    );
    expect(errors).not.toContain(
      CREATE_WAVE_VALIDATION_ERROR.VOTING_PROFILE_ID_CANNOT_BE_EMPTY
    );
  });

  it("card set TDH requires at least one Meme card and loaded Meme count", () => {
    const config = {
      ...baseConfig,
      voting: {
        type: ApiWaveCreditType.CardSetTdh,
        category: null,
        profileId: null,
        creditNfts: [],
        creditNftMemeCount: null,
        maxVotesPerIdentityPerDrop: null,
        winningThreshold: null,
        timeWeighted: {
          enabled: false,
          averagingInterval: 5,
          averagingIntervalUnit: "minutes",
        },
      },
    };

    const errors = getCreateWaveValidationErrors({
      step: CreateWaveStep.VOTING,
      config,
    });

    expect(errors).toContain(
      CREATE_WAVE_VALIDATION_ERROR.CARD_SET_TDH_VOTING_NFTS_REQUIRED
    );
    expect(errors).toContain(
      CREATE_WAVE_VALIDATION_ERROR.CARD_SET_TDH_VOTING_MEME_COUNT_UNAVAILABLE
    );
  });

  it("card set TDH rejects non-Meme contracts", () => {
    const config = {
      ...baseConfig,
      voting: {
        type: ApiWaveCreditType.CardSetTdh,
        category: null,
        profileId: null,
        creditNfts: [{ contract: "0xnotmemes", token_id: 1 }],
        creditNftMemeCount: 100,
        maxVotesPerIdentityPerDrop: null,
        winningThreshold: null,
        timeWeighted: {
          enabled: false,
          averagingInterval: 5,
          averagingIntervalUnit: "minutes",
        },
      },
    };

    const errors = getCreateWaveValidationErrors({
      step: CreateWaveStep.VOTING,
      config,
    });

    expect(errors).toContain(
      CREATE_WAVE_VALIDATION_ERROR.CARD_SET_TDH_VOTING_NFTS_CONTRACT_INVALID
    );
  });

  it("card set TDH rejects full Meme set selection", () => {
    const config = {
      ...baseConfig,
      voting: {
        type: ApiWaveCreditType.CardSetTdh,
        category: null,
        profileId: null,
        creditNfts: [
          { contract: MEMES_CONTRACT, token_id: 1 },
          { contract: MEMES_CONTRACT, token_id: 2 },
          { contract: MEMES_CONTRACT, token_id: 3 },
        ],
        creditNftMemeCount: 3,
        maxVotesPerIdentityPerDrop: null,
        winningThreshold: null,
        timeWeighted: {
          enabled: false,
          averagingInterval: 5,
          averagingIntervalUnit: "minutes",
        },
      },
    };

    const errors = getCreateWaveValidationErrors({
      step: CreateWaveStep.VOTING,
      config,
    });

    expect(errors).toContain(
      CREATE_WAVE_VALIDATION_ERROR.CARD_SET_TDH_VOTING_FULL_SET_NOT_ALLOWED
    );
  });

  it("approve wave requires equal submission and voting dates", () => {
    const cfg = {
      ...baseConfig,
      overview: { type: ApiWaveType.Approve, name: "n", image: null },
      dates: {
        submissionStartDate: 1,
        votingStartDate: 2,
        endDate: 3,
        firstDecisionTime: 0,
        subsequentDecisions: [],
        isRolling: false,
      },
    };
    const errors = getCreateWaveValidationErrors({
      step: CreateWaveStep.DATES,
      config: cfg,
    });
    expect(errors).toContain(
      CREATE_WAVE_VALIDATION_ERROR.VOTING_START_DATE_MUST_BE_AFTER_OR_EQUAL_TO_SUBMISSION_START_DATE
    );
  });

  it("chat groups cannot have canDrop/canVote", () => {
    const cfg = {
      ...baseConfig,
      overview: { type: ApiWaveType.Chat, name: "n", image: null },
      groups: { canDrop: true, canVote: true },
    };
    const errors = getCreateWaveValidationErrors({
      step: CreateWaveStep.GROUPS,
      config: cfg,
    });
    expect(errors).toContain(
      CREATE_WAVE_VALIDATION_ERROR.CHAT_WAVE_CANNOT_HAVE_VOTING
    );
  });
});

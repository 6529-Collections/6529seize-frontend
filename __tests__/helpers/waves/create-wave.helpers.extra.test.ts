import { getCreateNewWaveBody } from "@/helpers/waves/create-wave.helpers";
import { ApiWaveType } from "@/generated/models/ApiWaveType";
import { ApiWaveMetadataType } from "@/generated/models/ApiWaveMetadataType";
import { CREATE_WAVE_VALIDATION_ERROR } from "@/helpers/waves/create-wave.validation";

const HOUR_IN_MS = 60 * 60 * 1000;

describe("create-wave.helpers extra", () => {
  it("clamps time weighted lock duration", () => {
    const config: any = {
      overview: { type: ApiWaveType.Rank, name: "Wave" },
      groups: {
        canView: "1",
        canDrop: "2",
        canVote: "3",
        canChat: "4",
        admin: "5",
      },
      dates: {
        submissionStartDate: 1,
        votingStartDate: 2,
        endDate: null,
        firstDecisionTime: 2,
        subsequentDecisions: [3],
        isRolling: false,
      },
      drops: {
        noOfApplicationsAllowedPerParticipant: 1,
        requiredTypes: [],
        requiredMetadata: [],
        submissionStrategy: null,
        terms: null,
        signatureRequired: false,
        adminCanDeleteDrops: false,
      },
      chat: { enabled: true },
      voting: {
        type: null,
        category: null,
        profileId: null,
        winningThreshold: null,
        timeWeighted: {
          enabled: true,
          averagingInterval: 1,
          averagingIntervalUnit: "minutes",
        },
      },
      outcomes: [],
    };
    const drop: any = {
      parts: [],
      referenced_nfts: [],
      mentioned_users: [],
      metadata: [],
    };
    const body = getCreateNewWaveBody({ drop, picture: null, config });
    expect(body.wave.time_lock_ms).toBe(300000); // clamped to min 5 minutes
  });

  it("sends null periods when rolling rank has no end date", () => {
    const config: any = {
      overview: { type: ApiWaveType.Rank, name: "W" },
      groups: {
        canView: "1",
        canDrop: "2",
        canVote: "3",
        canChat: "4",
        admin: "5",
      },
      dates: {
        submissionStartDate: 1,
        votingStartDate: 2,
        endDate: null,
        firstDecisionTime: 2,
        subsequentDecisions: [3],
        isRolling: true,
      },
      drops: {
        noOfApplicationsAllowedPerParticipant: 1,
        requiredTypes: [],
        requiredMetadata: [{ key: "k", type: ApiWaveMetadataType.String }],
        submissionStrategy: null,
        terms: null,
        signatureRequired: false,
        adminCanDeleteDrops: false,
      },
      chat: { enabled: false },
      voting: {
        type: null,
        category: null,
        profileId: null,
        winningThreshold: null,
        timeWeighted: {
          enabled: false,
          averagingInterval: 5,
          averagingIntervalUnit: "minutes",
        },
      },
      outcomes: [],
    };
    const drop: any = {
      parts: [],
      referenced_nfts: [],
      mentioned_users: [],
      metadata: [],
    };
    const body = getCreateNewWaveBody({ drop, picture: null, config });
    expect(body.participation.period.max).toBeNull();
    expect(body.voting.period.max).toBeNull();
  });

  it("uses the last fixed rank decision as the period max", () => {
    const config: any = {
      overview: { type: ApiWaveType.Rank, name: "W" },
      groups: {
        canView: "1",
        canDrop: "2",
        canVote: "3",
        canChat: "4",
        admin: "5",
      },
      dates: {
        submissionStartDate: 1,
        votingStartDate: 10,
        endDate: null,
        firstDecisionTime: 10,
        subsequentDecisions: [5, 7],
        isRolling: false,
      },
      drops: {
        noOfApplicationsAllowedPerParticipant: 1,
        requiredTypes: [],
        requiredMetadata: [],
        submissionStrategy: null,
        terms: null,
        signatureRequired: false,
        adminCanDeleteDrops: false,
      },
      chat: { enabled: false },
      voting: {
        type: null,
        category: null,
        profileId: null,
        winningThreshold: null,
        timeWeighted: {
          enabled: false,
          averagingInterval: 5,
          averagingIntervalUnit: "minutes",
        },
      },
      outcomes: [],
    };
    const drop: any = {
      parts: [],
      referenced_nfts: [],
      mentioned_users: [],
      metadata: [],
    };

    const body = getCreateNewWaveBody({ drop, picture: null, config });

    expect(body.participation.period.max).toBe(22);
    expect(body.voting.period.max).toBe(22);
  });
});
it("calculates rolling end date correctly", () => {
  const config: any = {
    overview: { type: ApiWaveType.Rank, name: "Wave" },
    groups: {
      canView: "1",
      canDrop: "2",
      canVote: "3",
      canChat: "4",
      admin: "5",
    },
    dates: {
      submissionStartDate: 0,
      votingStartDate: 0,
      endDate: 65,
      firstDecisionTime: 0,
      subsequentDecisions: [10, 20],
      isRolling: true,
    },
    drops: {
      noOfApplicationsAllowedPerParticipant: 1,
      requiredTypes: [],
      requiredMetadata: [],
      submissionStrategy: null,
      terms: null,
      signatureRequired: false,
      adminCanDeleteDrops: false,
    },
    chat: { enabled: false },
    voting: {
      type: null,
      category: null,
      profileId: null,
      winningThreshold: null,
      timeWeighted: {
        enabled: false,
        averagingInterval: 5,
        averagingIntervalUnit: "minutes",
      },
    },
    outcomes: [],
  };
  const drop: any = {
    parts: [],
    referenced_nfts: [],
    mentioned_users: [],
    metadata: [],
  };
  const body = getCreateNewWaveBody({ drop, picture: null, config });
  expect(body.participation.period.max).toBe(60);
  expect(body.voting.period.max).toBe(60); // last decision before 65
});

it("sets max votes per identity per drop", () => {
  const config: any = {
    overview: { type: ApiWaveType.Rank, name: "Wave" },
    groups: {
      canView: "1",
      canDrop: "2",
      canVote: "3",
      canChat: "4",
      admin: "5",
    },
    dates: {
      submissionStartDate: 0,
      votingStartDate: 0,
      endDate: 10,
      firstDecisionTime: 0,
      subsequentDecisions: [],
      isRolling: false,
    },
    drops: {
      noOfApplicationsAllowedPerParticipant: 1,
      requiredTypes: [],
      requiredMetadata: [],
      submissionStrategy: null,
      terms: null,
      signatureRequired: false,
      adminCanDeleteDrops: false,
    },
    chat: { enabled: false },
    voting: {
      type: null,
      category: null,
      profileId: null,
      maxVotesPerIdentityPerDrop: 1,
      winningThreshold: null,
      timeWeighted: {
        enabled: false,
        averagingInterval: 5,
        averagingIntervalUnit: "minutes",
      },
    },
    outcomes: [],
  };
  const drop: any = {
    parts: [],
    referenced_nfts: [],
    mentioned_users: [],
    metadata: [],
  };
  const body = getCreateNewWaveBody({ drop, picture: null, config });
  expect(body.wave.max_votes_per_identity_to_drop).toBe(1);
});

it("keeps winning_threshold for approve waves", () => {
  const config: any = {
    overview: { type: ApiWaveType.Approve, name: "A" },
    groups: {
      canView: "1",
      canDrop: "2",
      canVote: "3",
      canChat: "4",
      admin: "5",
    },
    dates: {
      submissionStartDate: 1,
      votingStartDate: 2,
      endDate: null,
      firstDecisionTime: 2,
      subsequentDecisions: [],
      isRolling: false,
    },
    drops: {
      noOfApplicationsAllowedPerParticipant: 1,
      requiredTypes: [],
      requiredMetadata: [],
      submissionStrategy: null,
      terms: null,
      signatureRequired: false,
      adminCanDeleteDrops: false,
    },
    chat: { enabled: false },
    voting: {
      type: null,
      category: null,
      profileId: null,
      winningThreshold: 99,
      timeWeighted: {
        enabled: false,
        averagingInterval: 5,
        averagingIntervalUnit: "minutes",
      },
    },
    outcomes: [],
    approval: { threshold: 3, thresholdTimeMs: 60000, maxWinners: null },
  };
  const drop: any = {
    parts: [],
    referenced_nfts: [],
    mentioned_users: [],
    metadata: [],
  };
  const body = getCreateNewWaveBody({ drop, picture: null, config });
  expect(body.wave.winning_threshold).toBe(config.approval.threshold);
});

it("sets winning_threshold to null for non-approve waves", () => {
  const config: any = {
    overview: { type: ApiWaveType.Rank, name: "R" },
    groups: {
      canView: "1",
      canDrop: "2",
      canVote: "3",
      canChat: "4",
      admin: "5",
    },
    dates: {
      submissionStartDate: 1,
      votingStartDate: 2,
      endDate: null,
      firstDecisionTime: 2,
      subsequentDecisions: [],
      isRolling: false,
    },
    drops: {
      noOfApplicationsAllowedPerParticipant: 1,
      requiredTypes: [],
      requiredMetadata: [],
      submissionStrategy: null,
      terms: null,
      signatureRequired: false,
      adminCanDeleteDrops: false,
    },
    chat: { enabled: false },
    voting: {
      type: null,
      category: null,
      profileId: null,
      timeWeighted: {
        enabled: false,
        averagingInterval: 5,
        averagingIntervalUnit: "minutes",
      },
    },
    outcomes: [],
    approval: { threshold: 3, thresholdTimeMs: 60000, maxWinners: null },
  };
  const drop: any = {
    parts: [],
    referenced_nfts: [],
    mentioned_users: [],
    metadata: [],
  };
  const body = getCreateNewWaveBody({ drop, picture: null, config });
  expect(body.wave.winning_threshold).toBeNull();
});

it("sets time lock for approve waves when time weighted voting is enabled", () => {
  const config: any = {
    overview: { type: ApiWaveType.Approve, name: "A" },
    groups: {
      canView: "1",
      canDrop: "2",
      canVote: "3",
      canChat: "4",
      admin: "5",
    },
    dates: {
      submissionStartDate: 1,
      votingStartDate: 1,
      endDate: 1 + 3 * HOUR_IN_MS,
      firstDecisionTime: 2,
      subsequentDecisions: [],
      isRolling: false,
    },
    drops: {
      noOfApplicationsAllowedPerParticipant: 1,
      requiredTypes: [],
      requiredMetadata: [],
      submissionStrategy: null,
      terms: null,
      signatureRequired: false,
      adminCanDeleteDrops: false,
    },
    chat: { enabled: false },
    voting: {
      type: null,
      category: null,
      profileId: null,
      timeWeighted: {
        enabled: true,
        averagingInterval: 2,
        averagingIntervalUnit: "hours",
      },
    },
    outcomes: [],
    approval: { threshold: 3, thresholdTimeMs: null, maxWinners: null },
  };
  const drop: any = {
    parts: [],
    referenced_nfts: [],
    mentioned_users: [],
    metadata: [],
  };
  const body = getCreateNewWaveBody({ drop, picture: null, config });
  expect(body.wave.time_lock_ms).toBe(2 * 60 * 60 * 1000);
});

it("allows approve time lock equal to the wave duration", () => {
  const config: any = {
    overview: { type: ApiWaveType.Approve, name: "A" },
    groups: {
      canView: "1",
      canDrop: "2",
      canVote: "3",
      canChat: "4",
      admin: "5",
    },
    dates: {
      submissionStartDate: 1,
      votingStartDate: 1,
      endDate: 1 + HOUR_IN_MS,
      firstDecisionTime: 2,
      subsequentDecisions: [],
      isRolling: false,
    },
    drops: {
      noOfApplicationsAllowedPerParticipant: 1,
      requiredTypes: [],
      requiredMetadata: [],
      submissionStrategy: null,
      terms: null,
      signatureRequired: false,
      adminCanDeleteDrops: false,
    },
    chat: { enabled: false },
    voting: {
      type: null,
      category: null,
      profileId: null,
      timeWeighted: {
        enabled: true,
        averagingInterval: 1,
        averagingIntervalUnit: "hours",
      },
    },
    outcomes: [],
    approval: { threshold: 3, thresholdTimeMs: null, maxWinners: null },
  };
  const drop: any = {
    parts: [],
    referenced_nfts: [],
    mentioned_users: [],
    metadata: [],
  };
  const body = getCreateNewWaveBody({ drop, picture: null, config });
  expect(body.wave.time_lock_ms).toBe(HOUR_IN_MS);
});

it("throws when approve time lock exceeds approve wave duration", () => {
  const config: any = {
    overview: { type: ApiWaveType.Approve, name: "A" },
    groups: {
      canView: "1",
      canDrop: "2",
      canVote: "3",
      canChat: "4",
      admin: "5",
    },
    dates: {
      submissionStartDate: 1,
      votingStartDate: 1,
      endDate: 1 + HOUR_IN_MS,
      firstDecisionTime: 2,
      subsequentDecisions: [],
      isRolling: false,
    },
    drops: {
      noOfApplicationsAllowedPerParticipant: 1,
      requiredTypes: [],
      requiredMetadata: [],
      submissionStrategy: null,
      terms: null,
      signatureRequired: false,
      adminCanDeleteDrops: false,
    },
    chat: { enabled: false },
    voting: {
      type: null,
      category: null,
      profileId: null,
      timeWeighted: {
        enabled: true,
        averagingInterval: 2,
        averagingIntervalUnit: "hours",
      },
    },
    outcomes: [],
    approval: { threshold: 3, thresholdTimeMs: null, maxWinners: null },
  };
  const drop: any = {
    parts: [],
    referenced_nfts: [],
    mentioned_users: [],
    metadata: [],
  };
  expect(() => getCreateNewWaveBody({ drop, picture: null, config })).toThrow(
    CREATE_WAVE_VALIDATION_ERROR.TIME_WEIGHTED_VOTING_INTERVAL_EXCEEDS_WAVE_DURATION
  );
});

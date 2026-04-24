import { getCreateNewWaveBody } from "@/helpers/waves/create-wave.helpers";
import { ApiWaveType } from "@/generated/models/ApiWaveType";
import { ApiWaveMetadataType } from "@/generated/models/ApiWaveMetadataType";

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

  it("throws when rolling without end date", () => {
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
    expect(() => getCreateNewWaveBody({ drop, picture: null, config })).toThrow(
      "End date must be explicitly set when isRolling is true"
    );
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

it("sets winning thresholds for approve waves", () => {
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
      winningThreshold: 3,
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
  expect(body.wave.winning_threshold).toBe(3);
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
      endDate: 10,
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
      winningThreshold: 3,
      timeWeighted: {
        enabled: true,
        averagingInterval: 2,
        averagingIntervalUnit: "hours",
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
  expect(body.wave.time_lock_ms).toBe(2 * 60 * 60 * 1000);
});

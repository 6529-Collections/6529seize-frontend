import {
  getCreateNewWaveBody,
  getCreateWaveNextStep,
  getCreateWavePreviousStep,
  calculateLastDecisionTime,
} from "@/helpers/waves/create-wave.helpers";
import { getCreateWaveMainSteps } from "@/helpers/waves/waves.constants";
import { ApiWaveOutcomeCredit } from "@/generated/models/ApiWaveOutcomeCredit";
import { ApiWaveOutcomeSubType } from "@/generated/models/ApiWaveOutcomeSubType";
import { ApiWaveOutcomeType } from "@/generated/models/ApiWaveOutcomeType";
import { ApiWaveParticipationIdentitySubmissionAllowDuplicates } from "@/generated/models/ApiWaveParticipationIdentitySubmissionAllowDuplicates";
import { ApiWaveParticipationIdentitySubmissionWhoCanBeSubmitted } from "@/generated/models/ApiWaveParticipationIdentitySubmissionWhoCanBeSubmitted";
import { ApiWaveParticipationSubmissionStrategyType } from "@/generated/models/ApiWaveParticipationSubmissionStrategyType";
import { ApiWaveType } from "@/generated/models/ApiWaveType";
import { ApiWaveCreditScope } from "@/generated/models/ApiWaveCreditScope";
import { ApiWaveCreditType } from "@/generated/models/ApiWaveCreditType";
import { ApiWaveMetadataType } from "@/generated/models/ApiWaveMetadataType";
import { MEMES_CONTRACT } from "@/constants/constants";
import {
  CreateWaveOutcomeConfigWinnersCreditValueType,
  CreateWaveOutcomeType,
  CreateWaveStep,
} from "@/types/waves.types";

const createBaseConfig = (waveType: ApiWaveType) =>
  ({
    overview: { type: waveType, name: "W", image: null },
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
    chat: { enabled: true },
    voting: {
      type: null,
      creditScope: ApiWaveCreditScope.Wave,
      category: null,
      profileId: null,
      allowNegativeVotes: true,
      timeWeighted: {
        enabled: false,
        averagingInterval: 5,
        averagingIntervalUnit: "minutes",
      },
    },
    outcomes: [],
    approval: { threshold: null, thresholdTimeMs: null, maxWinners: null },
  }) as any;

const createDrop = () =>
  ({
    parts: [],
    referenced_nfts: [],
    mentioned_users: [],
    metadata: [],
  }) as any;

describe("create-wave.helpers", () => {
  describe("getCreateWaveNextStep", () => {
    it("returns expected next steps for various wave types", () => {
      expect(
        getCreateWaveNextStep({
          step: CreateWaveStep.OVERVIEW,
          waveType: ApiWaveType.Rank,
        })
      ).toBe(CreateWaveStep.GROUPS);
      expect(
        getCreateWaveNextStep({
          step: CreateWaveStep.GROUPS,
          waveType: ApiWaveType.Chat,
        })
      ).toBe(CreateWaveStep.RULES);
      expect(
        getCreateWaveNextStep({
          step: CreateWaveStep.RULES,
          waveType: ApiWaveType.Chat,
        })
      ).toBe(CreateWaveStep.DESCRIPTION);
      expect(
        getCreateWaveNextStep({
          step: CreateWaveStep.DROPS,
          waveType: ApiWaveType.Approve,
        })
      ).toBe(CreateWaveStep.RULES);
      expect(
        getCreateWaveNextStep({
          step: CreateWaveStep.RULES,
          waveType: ApiWaveType.Approve,
        })
      ).toBe(CreateWaveStep.VOTING);
      expect(
        getCreateWaveNextStep({
          step: CreateWaveStep.VOTING,
          waveType: ApiWaveType.Approve,
        })
      ).toBe(CreateWaveStep.OUTCOMES);
      expect(
        getCreateWaveNextStep({
          step: CreateWaveStep.DESCRIPTION,
          waveType: ApiWaveType.Rank,
        })
      ).toBeNull();
    });

    it("skips the outcomes step for perpetual rank waves", () => {
      expect(
        getCreateWaveNextStep({
          step: CreateWaveStep.VOTING,
          waveType: ApiWaveType.Rank,
          ongoingRanking: true,
        })
      ).toBe(CreateWaveStep.DESCRIPTION);
      expect(
        getCreateWaveNextStep({
          step: CreateWaveStep.VOTING,
          waveType: ApiWaveType.Rank,
          ongoingRanking: false,
        })
      ).toBe(CreateWaveStep.OUTCOMES);
      // A stray flag never changes other wave types' flows.
      expect(
        getCreateWaveNextStep({
          step: CreateWaveStep.VOTING,
          waveType: ApiWaveType.Approve,
          ongoingRanking: true,
        })
      ).toBe(CreateWaveStep.OUTCOMES);
      expect(
        getCreateWavePreviousStep({
          step: CreateWaveStep.DESCRIPTION,
          waveType: ApiWaveType.Rank,
          ongoingRanking: true,
        })
      ).toBe(CreateWaveStep.VOTING);
      expect(
        getCreateWavePreviousStep({
          step: CreateWaveStep.DESCRIPTION,
          waveType: ApiWaveType.Rank,
          ongoingRanking: false,
        })
      ).toBe(CreateWaveStep.OUTCOMES);
    });

    it("filters the outcomes step from the perpetual rank stepper", () => {
      expect(
        getCreateWaveMainSteps({
          waveType: ApiWaveType.Rank,
          ongoingRanking: true,
        })
      ).not.toContain(CreateWaveStep.OUTCOMES);
      expect(
        getCreateWaveMainSteps({
          waveType: ApiWaveType.Rank,
          ongoingRanking: false,
        })
      ).toContain(CreateWaveStep.OUTCOMES);
      expect(
        getCreateWaveMainSteps({
          waveType: ApiWaveType.Approve,
          ongoingRanking: true,
        })
      ).toContain(CreateWaveStep.OUTCOMES);
    });
  });

  describe("getCreateWavePreviousStep", () => {
    it("returns expected previous steps based on wave type", () => {
      expect(
        getCreateWavePreviousStep({
          step: CreateWaveStep.DESCRIPTION,
          waveType: ApiWaveType.Chat,
        })
      ).toBe(CreateWaveStep.RULES);
      expect(
        getCreateWavePreviousStep({
          step: CreateWaveStep.RULES,
          waveType: ApiWaveType.Chat,
        })
      ).toBe(CreateWaveStep.GROUPS);
      expect(
        getCreateWavePreviousStep({
          step: CreateWaveStep.VOTING,
          waveType: ApiWaveType.Approve,
        })
      ).toBe(CreateWaveStep.RULES);
      expect(
        getCreateWavePreviousStep({
          step: CreateWaveStep.OUTCOMES,
          waveType: ApiWaveType.Approve,
        })
      ).toBe(CreateWaveStep.VOTING);
    });
  });

  describe("calculateLastDecisionTime", () => {
    it("handles empty subsequent decisions", () => {
      expect(calculateLastDecisionTime(1000, [], 5000)).toBe(1000);
    });

    it("handles end date before first decision", () => {
      expect(calculateLastDecisionTime(5000, [1000], 4000)).toBe(5000);
    });

    it("handles multi-decision non-rolling waves", () => {
      expect(calculateLastDecisionTime(0, [10, 20], 100)).toBe(100);
      expect(calculateLastDecisionTime(0, [50, 60], 80)).toBe(50);
    });

    it("handles rolling waves correctly", () => {
      expect(calculateLastDecisionTime(0, [10, 10], 35)).toBe(30);
    });
  });

  describe("getCreateNewWaveBody", () => {
    it("converts config into request body", () => {
      const config = {
        overview: { type: ApiWaveType.Chat, name: "W", image: null },
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
          subsequentDecisions: [3, 5],
          isRolling: false,
        },
        drops: {
          noOfApplicationsAllowedPerParticipant: 1,
          requiredTypes: [],
          requiredMetadata: [{ key: "m", type: ApiWaveMetadataType.String }],
          submissionStrategy: null,
          terms: null,
          signatureRequired: false,
          adminCanDeleteDrops: true,
        },
        chat: { enabled: true },
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
      } as any;
      const drop = {
        parts: [],
        referenced_nfts: [],
        mentioned_users: [],
        metadata: [],
      } as any;
      const res = getCreateNewWaveBody({ drop, picture: "pic", config });
      expect(res.name).toBe("W");
      expect(res.picture).toBe("pic");
      expect(res.participation.required_metadata).toEqual([
        { name: "m", type: ApiWaveMetadataType.String },
      ]);
      expect(res.voting.credit_scope).toBe(ApiWaveCreditScope.Wave);
      expect(res.participation.period.max).toBeNull();
      expect(res.voting.period.max).toBeNull();
      expect(res.voting.forbid_negative_votes).toBe(false);
      expect(res.wave.admin_drop_deletion_enabled).toBe(true);
      expect(res.wave.max_votes_per_identity_to_drop).toBeNull();
    });

    it("adds parent wave id only for subwave creation", () => {
      const config = createBaseConfig(ApiWaveType.Chat);
      const drop = createDrop();

      expect(
        getCreateNewWaveBody({
          drop,
          picture: null,
          config,
        })
      ).not.toHaveProperty("parent_wave_id");

      expect(
        getCreateNewWaveBody({
          drop,
          picture: null,
          config,
          parentWaveId: "parent-wave",
        })
      ).toHaveProperty("parent_wave_id", "parent-wave");
    });

    it("ignores participation terms for chat waves", () => {
      const config = createBaseConfig(ApiWaveType.Chat);
      config.drops.terms = "Should not apply to chat.";
      config.drops.signatureRequired = true;

      const res = getCreateNewWaveBody({
        drop: createDrop(),
        picture: null,
        config,
      });

      expect(res.participation.terms).toBeNull();
      expect(res.participation.signature_required).toBe(false);
    });

    it("normalizes participation terms for rank waves at the API boundary", () => {
      const config = createBaseConfig(ApiWaveType.Rank);
      config.drops.terms = "  First rule.\n\nSecond rule.  ";
      config.drops.signatureRequired = true;

      const res = getCreateNewWaveBody({
        drop: createDrop(),
        picture: null,
        config,
      });

      expect(res.participation.terms).toBe("First rule.\n\nSecond rule.");
      expect(res.participation.signature_required).toBe(true);
    });

    it("clears whitespace-only participation terms for rank waves", () => {
      const config = createBaseConfig(ApiWaveType.Rank);
      config.drops.terms = "   \n  ";
      config.drops.signatureRequired = true;

      const res = getCreateNewWaveBody({
        drop: createDrop(),
        picture: null,
        config,
      });

      expect(res.participation.terms).toBeNull();
      expect(res.participation.signature_required).toBe(false);
    });

    it("maps allowed negative votes to the inverse backend flag", () => {
      const config = createBaseConfig(ApiWaveType.Rank);
      config.voting.allowNegativeVotes = true;

      const res = getCreateNewWaveBody({
        drop: createDrop(),
        picture: null,
        config,
      });

      expect(res.voting.forbid_negative_votes).toBe(false);
    });

    it("maps blocked negative votes to the inverse backend flag", () => {
      const config = createBaseConfig(ApiWaveType.Rank);
      config.voting.allowNegativeVotes = false;

      const res = getCreateNewWaveBody({
        drop: createDrop(),
        picture: null,
        config,
      });

      expect(res.voting.forbid_negative_votes).toBe(true);
    });

    it("maps configured voting credit scope", () => {
      const config = createBaseConfig(ApiWaveType.Rank);
      config.voting.creditScope = ApiWaveCreditScope.Drop;

      const res = getCreateNewWaveBody({
        drop: createDrop(),
        picture: null,
        config,
      });

      expect(res.voting.credit_scope).toBe(ApiWaveCreditScope.Drop);
    });

    it("defaults omitted negative vote config to allowed", () => {
      const config = createBaseConfig(ApiWaveType.Rank);
      delete config.voting.allowNegativeVotes;

      const res = getCreateNewWaveBody({
        drop: createDrop(),
        picture: null,
        config,
      });

      expect(res.voting.forbid_negative_votes).toBe(false);
    });

    it("omits the decision strategy, end date and outcomes for ongoing rank waves", () => {
      const config = createBaseConfig(ApiWaveType.Rank);
      config.dates.ongoingRanking = true;
      // Even with a fixed schedule and outcomes configured, ongoing mode wins.
      config.dates.firstDecisionTime = 2;
      config.dates.subsequentDecisions = [3, 5];
      config.dates.endDate = 10;
      config.outcomes = [{ title: "stale outcome" }];

      const res = getCreateNewWaveBody({
        drop: createDrop(),
        picture: null,
        config,
      });

      expect(res.wave.decisions_strategy).toBeNull();
      expect(res.voting.period.max).toBeNull();
      expect(res.participation.period.max).toBeNull();
      expect(res.outcomes).toEqual([]);
      // Time-weighted voting is disabled in the base config, so no time lock.
      expect(res.wave.time_lock_ms).toBeNull();
    });

    it("normalizes the after-a-win duplicates rule for ongoing rank waves", () => {
      const config = createBaseConfig(ApiWaveType.Rank);
      config.dates.ongoingRanking = true;
      config.drops.submissionStrategy = {
        type: "IDENTITY",
        config: {
          duplicates: "ALLOW_AFTER_WIN",
          who_can_be_submitted: "EVERYONE",
        },
      };

      const res = getCreateNewWaveBody({
        drop: createDrop(),
        picture: null,
        config,
      });

      // Behaviorally identical under perpetual rules (nothing ever wins), so
      // a bypassed validation still produces a coherent wave.
      expect(res.participation.submission_strategy).toEqual({
        type: "IDENTITY",
        config: {
          duplicates: "NEVER_ALLOW",
          who_can_be_submitted: "EVERYONE",
        },
      });
    });

    it("keeps the after-a-win duplicates rule for scheduled rank waves", () => {
      const config = createBaseConfig(ApiWaveType.Rank);
      config.drops.submissionStrategy = {
        type: "IDENTITY",
        config: {
          duplicates: "ALLOW_AFTER_WIN",
          who_can_be_submitted: "EVERYONE",
        },
      };

      const res = getCreateNewWaveBody({
        drop: createDrop(),
        picture: null,
        config,
      });

      expect(res.participation.submission_strategy?.config.duplicates).toBe(
        "ALLOW_AFTER_WIN"
      );
    });

    it("keeps the time-weighted vote lock for ongoing rank waves", () => {
      const config = createBaseConfig(ApiWaveType.Rank);
      config.dates.ongoingRanking = true;
      // Time-weighted voting drives the live leaderboard (not just decision
      // snapshots), so it stays meaningful for perpetual waves.
      config.voting.timeWeighted = {
        enabled: true,
        averagingInterval: 10,
        averagingIntervalUnit: "minutes",
      };

      const res = getCreateNewWaveBody({
        drop: createDrop(),
        picture: null,
        config,
      });

      expect(res.wave.decisions_strategy).toBeNull();
      expect(res.wave.time_lock_ms).toBe(10 * 60 * 1000);
    });

    it("ignores a stray ongoing flag on approve waves", () => {
      const config = createBaseConfig(ApiWaveType.Approve);
      // ongoingRanking is a Rank-only concept; a stray flag must not leak into
      // other wave types' payloads.
      config.dates.ongoingRanking = true;
      config.dates.endDate = 999;
      config.outcomes = [
        {
          type: "MANUAL",
          title: "outcome",
          credit: null,
          category: null,
          winnersConfig: null,
          maxWinners: null,
        },
      ];

      const res = getCreateNewWaveBody({
        drop: createDrop(),
        picture: null,
        config,
      });

      expect(res.voting.period.max).toBe(999);
      expect(res.participation.period.max).toBe(999);
      expect(res.outcomes).not.toEqual([]);
    });

    it("keeps the rolling decision strategy for open-ended scheduled rank waves", () => {
      const config = createBaseConfig(ApiWaveType.Rank);
      config.dates.firstDecisionTime = 2;
      config.dates.subsequentDecisions = [3];
      config.dates.isRolling = true;
      config.dates.endDate = null;

      const res = getCreateNewWaveBody({
        drop: createDrop(),
        picture: null,
        config,
      });

      expect(res.wave.decisions_strategy).toEqual({
        first_decision_time: 2,
        subsequent_decisions: [3],
        is_rolling: true,
      });
      expect(res.voting.period.max).toBeNull();
    });

    it("includes identity submission strategy when configured", () => {
      const config = {
        overview: { type: ApiWaveType.Rank, name: "W", image: null },
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
          endDate: 10,
          firstDecisionTime: 2,
          subsequentDecisions: [],
          isRolling: false,
        },
        drops: {
          noOfApplicationsAllowedPerParticipant: 1,
          requiredTypes: [],
          requiredMetadata: [],
          submissionStrategy: {
            type: ApiWaveParticipationSubmissionStrategyType.Identity,
            config: {
              duplicates:
                ApiWaveParticipationIdentitySubmissionAllowDuplicates.AllowAfterWin,
              who_can_be_submitted:
                ApiWaveParticipationIdentitySubmissionWhoCanBeSubmitted.OnlyOthers,
            },
          },
          terms: null,
          signatureRequired: false,
          adminCanDeleteDrops: true,
        },
        chat: { enabled: true },
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
      } as any;
      const drop = {
        parts: [],
        referenced_nfts: [],
        mentioned_users: [],
        metadata: [],
      } as any;
      const res = getCreateNewWaveBody({ drop, picture: "pic", config });
      expect(res.participation.submission_strategy).toEqual(
        config.drops.submissionStrategy
      );
    });

    it("uses the explicit end date for approve waves", () => {
      const config = {
        overview: { type: ApiWaveType.Approve, name: "W", image: null },
        groups: {
          canView: "1",
          canDrop: "2",
          canVote: "3",
          canChat: "4",
          admin: "5",
        },
        dates: {
          submissionStartDate: 100,
          votingStartDate: 100,
          endDate: 999,
          firstDecisionTime: 2,
          subsequentDecisions: [3, 5],
          isRolling: false,
        },
        drops: {
          noOfApplicationsAllowedPerParticipant: 1,
          requiredTypes: [],
          requiredMetadata: [],
          submissionStrategy: null,
          terms: null,
          signatureRequired: false,
          adminCanDeleteDrops: true,
        },
        chat: { enabled: true },
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
        approval: { threshold: 1, thresholdTimeMs: null, maxWinners: null },
      } as any;
      const drop = {
        parts: [],
        referenced_nfts: [],
        mentioned_users: [],
        metadata: [],
      } as any;
      const res = getCreateNewWaveBody({ drop, picture: "pic", config });
      expect(res.participation.period.max).toBe(999);
      expect(res.voting.period.max).toBe(999);
      expect(res.wave.decisions_strategy).toBeNull();
    });

    it("sends null periods and max winners for approve waves without limits", () => {
      const config = createBaseConfig(ApiWaveType.Approve);
      config.dates.endDate = null;

      const res = getCreateNewWaveBody({
        drop: createDrop(),
        picture: null,
        config,
      });

      expect(res.participation.period.max).toBeNull();
      expect(res.voting.period.max).toBeNull();
      expect(res.wave.max_winners).toBeNull();
    });

    it("includes credit_nfts only for Card Set TDH voting", () => {
      const config = createBaseConfig(ApiWaveType.Rank);
      config.voting.type = ApiWaveCreditType.CardSetTdh;
      config.voting.creditNfts = [
        { contract: MEMES_CONTRACT, token_id: 1 },
        { contract: "0xnotmemes", token_id: 2 },
      ];

      const res = getCreateNewWaveBody({
        drop: createDrop(),
        picture: null,
        config,
      });

      expect(res.voting.credit_type).toBe(ApiWaveCreditType.CardSetTdh);
      expect(res.voting.credit_nfts).toEqual([
        { contract: MEMES_CONTRACT, token_id: 1 },
        { contract: MEMES_CONTRACT, token_id: 2 },
      ]);
    });

    it("omits credit_nfts for non-card voting", () => {
      const config = createBaseConfig(ApiWaveType.Rank);
      config.voting.type = ApiWaveCreditType.Tdh;
      config.voting.creditNfts = [{ contract: MEMES_CONTRACT, token_id: 1 }];

      const res = getCreateNewWaveBody({
        drop: createDrop(),
        picture: null,
        config,
      });

      expect("credit_nfts" in res.voting).toBe(false);
    });

    it("does not send fractional approve max winners", () => {
      const config = createBaseConfig(ApiWaveType.Approve);
      config.approval.maxWinners = 1.5;

      const res = getCreateNewWaveBody({
        drop: createDrop(),
        picture: null,
        config,
      });

      expect(res.wave.max_winners).toBeNull();
    });

    it("keeps manual approve outcomes without max winners and filters invalid credit amounts", () => {
      const config = createBaseConfig(ApiWaveType.Approve);
      config.outcomes = [
        {
          type: CreateWaveOutcomeType.MANUAL,
          title: "Manual action",
          credit: null,
          category: null,
          winnersConfig: null,
        },
        {
          type: CreateWaveOutcomeType.REP,
          title: null,
          credit: 0,
          category: "gold",
          winnersConfig: null,
        },
        {
          type: CreateWaveOutcomeType.REP,
          title: null,
          credit: Number.NaN,
          category: "gold",
          winnersConfig: null,
        },
        {
          type: CreateWaveOutcomeType.REP,
          title: null,
          credit: 15,
          category: "gold",
          winnersConfig: null,
        },
        {
          type: CreateWaveOutcomeType.NIC,
          title: null,
          credit: null,
          category: null,
          winnersConfig: null,
        },
        {
          type: CreateWaveOutcomeType.NIC,
          title: null,
          credit: 0,
          category: null,
          winnersConfig: null,
        },
        {
          type: CreateWaveOutcomeType.NIC,
          title: null,
          credit: 25,
          category: null,
          winnersConfig: null,
        },
      ] as any;

      const res = getCreateNewWaveBody({
        drop: createDrop(),
        picture: null,
        config,
      });

      expect(res.outcomes).toEqual([
        {
          type: ApiWaveOutcomeType.Manual,
          description: "Manual action",
        },
        {
          type: ApiWaveOutcomeType.Automatic,
          subtype: ApiWaveOutcomeSubType.CreditDistribution,
          description: "",
          credit: ApiWaveOutcomeCredit.Rep,
          rep_category: "gold",
          amount: 15,
        },
        {
          type: ApiWaveOutcomeType.Automatic,
          subtype: ApiWaveOutcomeSubType.CreditDistribution,
          description: "",
          credit: ApiWaveOutcomeCredit.Cic,
          amount: 25,
        },
      ]);
      expect(res.wave.max_winners).toBeNull();
    });

    it("maps approve max winners to the wave config", () => {
      const config = createBaseConfig(ApiWaveType.Approve);
      config.approval.maxWinners = 3;
      config.outcomes = [
        {
          type: CreateWaveOutcomeType.MANUAL,
          title: "Manual action",
          credit: null,
          category: null,
          winnersConfig: null,
        },
      ] as any;

      const res = getCreateNewWaveBody({
        drop: createDrop(),
        picture: null,
        config,
      });

      expect(res.wave.max_winners).toBe(3);
    });

    it("maps approve threshold hold time to the wave config", () => {
      const config = createBaseConfig(ApiWaveType.Approve);
      config.approval.thresholdTimeMs = 120_000;

      const res = getCreateNewWaveBody({
        drop: createDrop(),
        picture: null,
        config,
      });

      expect(res.wave.winning_threshold_min_duration_ms).toBe(120_000);
    });

    it("sends immediate approve threshold hold time when blank", () => {
      const config = createBaseConfig(ApiWaveType.Approve);
      config.approval.thresholdTimeMs = null;

      const res = getCreateNewWaveBody({
        drop: createDrop(),
        picture: null,
        config,
      });

      expect(res.wave.winning_threshold_min_duration_ms).toBe(0);
    });

    it("sends approve threshold hold time and time lock when both are set", () => {
      const config = createBaseConfig(ApiWaveType.Approve);
      config.dates.submissionStartDate = 1;
      config.dates.votingStartDate = 1;
      config.dates.endDate = 1 + 600_000;
      config.approval.thresholdTimeMs = 120_000;
      config.voting.timeWeighted = {
        enabled: true,
        averagingInterval: 5,
        averagingIntervalUnit: "minutes",
      };

      const res = getCreateNewWaveBody({
        drop: createDrop(),
        picture: null,
        config,
      });

      expect(res.wave.winning_threshold_min_duration_ms).toBe(120_000);
      expect(res.wave.time_lock_ms).toBe(300_000);
    });

    it("sends null threshold hold time for non-approve waves", () => {
      const config = createBaseConfig(ApiWaveType.Rank);
      config.approval.thresholdTimeMs = 120_000;

      const res = getCreateNewWaveBody({
        drop: createDrop(),
        picture: null,
        config,
      });

      expect(res.wave.winning_threshold_min_duration_ms).toBeNull();
    });

    it("filters rank outcomes with missing or non-positive total amounts", () => {
      const config = createBaseConfig(ApiWaveType.Rank);
      config.approval.maxWinners = 4;
      config.outcomes = [
        {
          type: CreateWaveOutcomeType.REP,
          title: null,
          credit: null,
          category: "gold",
          winnersConfig: {
            creditValueType:
              CreateWaveOutcomeConfigWinnersCreditValueType.ABSOLUTE_VALUE,
            totalAmount: 0,
            winners: [{ value: 10 }],
          },
        },
        {
          type: CreateWaveOutcomeType.REP,
          title: null,
          credit: null,
          category: "gold",
          winnersConfig: {
            creditValueType:
              CreateWaveOutcomeConfigWinnersCreditValueType.ABSOLUTE_VALUE,
            totalAmount: Number.NaN,
            winners: [{ value: 10 }],
          },
        },
        {
          type: CreateWaveOutcomeType.REP,
          title: null,
          credit: null,
          category: "gold",
          winnersConfig: {
            creditValueType:
              CreateWaveOutcomeConfigWinnersCreditValueType.ABSOLUTE_VALUE,
            totalAmount: 10,
            winners: [{ value: 10 }],
          },
        },
        {
          type: CreateWaveOutcomeType.NIC,
          title: null,
          credit: null,
          category: null,
          winnersConfig: {
            creditValueType:
              CreateWaveOutcomeConfigWinnersCreditValueType.ABSOLUTE_VALUE,
            totalAmount: null,
            winners: [{ value: 20 }],
          },
        },
        {
          type: CreateWaveOutcomeType.NIC,
          title: null,
          credit: null,
          category: null,
          winnersConfig: {
            creditValueType:
              CreateWaveOutcomeConfigWinnersCreditValueType.ABSOLUTE_VALUE,
            totalAmount: 20,
            winners: [{ value: 20 }],
          },
        },
      ] as any;

      const res = getCreateNewWaveBody({
        drop: createDrop(),
        picture: null,
        config,
      });

      expect(res.outcomes).toEqual([
        {
          type: ApiWaveOutcomeType.Automatic,
          subtype: ApiWaveOutcomeSubType.CreditDistribution,
          description: "Rep distribution",
          credit: ApiWaveOutcomeCredit.Rep,
          rep_category: "gold",
          amount: 10,
          distribution: [{ amount: 10, description: null }],
        },
        {
          type: ApiWaveOutcomeType.Automatic,
          subtype: ApiWaveOutcomeSubType.CreditDistribution,
          description: "NIC distribution",
          credit: ApiWaveOutcomeCredit.Cic,
          amount: 20,
          distribution: [{ amount: 20, description: null }],
        },
      ]);
      expect(res.wave.max_winners).toBeNull();
    });
  });
});

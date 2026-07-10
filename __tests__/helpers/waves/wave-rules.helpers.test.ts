import { ApiWaveCreditScope } from "@/generated/models/ApiWaveCreditScope";
import { ApiWaveCreditType } from "@/generated/models/ApiWaveCreditType";
import { ApiWaveMetadataType } from "@/generated/models/ApiWaveMetadataType";
import { ApiWaveType } from "@/generated/models/ApiWaveType";
import { buildWaveRules } from "@/helpers/waves/wave-rules.helpers";
import type { CreateWaveConfig } from "@/types/waves.types";

const createConfig = (): CreateWaveConfig => ({
  overview: { type: ApiWaveType.Approve, name: "Approve", image: null },
  groups: {
    canView: null,
    canDrop: "drop-group",
    canVote: null,
    canChat: null,
    admin: null,
  },
  dates: {
    submissionStartDate: 1000,
    votingStartDate: 2000,
    endDate: 3000,
    firstDecisionTime: 0,
    subsequentDecisions: [],
    isRolling: false,
  },
  drops: {
    noOfApplicationsAllowedPerParticipant: 2,
    requiredTypes: [],
    requiredMetadata: [{ key: "artist", type: ApiWaveMetadataType.String }],
    submissionStrategy: null,
    terms: "Must be original.",
    signatureRequired: true,
    adminCanDeleteDrops: true,
  },
  chat: { enabled: true },
  voting: {
    type: ApiWaveCreditType.Rep,
    creditScope: ApiWaveCreditScope.Drop,
    category: "art",
    profileId: null,
    creditNfts: [],
    creditNftMemeCount: null,
    allowNegativeVotes: false,
    maxVotesPerIdentityPerDrop: 10,
    winningThreshold: null,
    timeWeighted: {
      enabled: true,
      averagingInterval: 2,
      averagingIntervalUnit: "hours",
    },
  },
  outcomes: [],
  approval: {
    threshold: 25,
    thresholdTimeMs: 120_000,
    maxWinners: 3,
  },
  display: {
    customRules: "No AI-only submissions.",
    outcomesVisible: false,
    submissionButtonLabel: null,
    approve: {
      approvalsTabLabel: "",
      approvedTabLabel: "",
    },
  },
});

describe("wave-rules.helpers", () => {
  it("builds automatic and custom rules from create config", () => {
    const rules = buildWaveRules({
      config: createConfig(),
      groupsCache: {
        "drop-group": { id: "drop-group", name: "Artists" } as any,
      },
    });

    expect(rules.custom).toEqual({
      binding: "Must be original.",
      display: "No AI-only submissions.",
      signatureRequired: true,
    });
    expect(
      rules.automatic
        .flatMap((section) => section.rows)
        .map((row) => [row.label, row.value])
    ).toEqual(
      expect.arrayContaining([
        ["Who can drop", "Artists"],
        ["Required metadata", "artist (Text)"],
        ["Negative voting", "Blocked"],
        ["Approval threshold", "25 Rep"],
        ["Outcomes visibility", "Hidden"],
      ])
    );
  });

  it("builds chat create rules without drop or voting sections", () => {
    const config: CreateWaveConfig = {
      ...createConfig(),
      overview: { type: ApiWaveType.Chat, name: "Chat", image: null },
      display: {
        customRules: "Keep chat respectful.",
        outcomesVisible: false,
        submissionButtonLabel: null,
        approve: {
          approvalsTabLabel: "",
          approvedTabLabel: "",
        },
      },
    };

    const rules = buildWaveRules({
      config,
      groupsCache: {},
    });
    const labels = rules.automatic
      .flatMap((section) => section.rows)
      .map((row) => row.label);

    expect(rules.automatic.map((section) => section.title)).toEqual([
      "Wave",
      "Access",
      "Chat",
    ]);
    expect(labels).toEqual(
      expect.arrayContaining(["Who can view", "Who can chat", "Who can admin"])
    );
    expect(labels).not.toEqual(
      expect.arrayContaining(["Who can drop", "Who can vote"])
    );
    expect(rules.custom).toEqual({
      binding: null,
      display: "Keep chat respectful.",
      signatureRequired: false,
    });
  });

  it("builds custom rules from wave metadata", () => {
    const wave = {
      wave: {
        type: ApiWaveType.Rank,
        admin_group: { group: null },
        admin_drop_deletion_enabled: false,
        max_votes_per_identity_to_drop: null,
        time_lock_ms: null,
        decisions_strategy: {
          first_decision_time: 2000,
          subsequent_decisions: [],
          is_rolling: false,
        },
      },
      visibility: { scope: { group: null } },
      participation: {
        scope: { group: null },
        period: { min: 1000, max: 3000 },
        required_media: [],
        required_metadata: [],
        no_of_applications_allowed_per_participant: null,
        signature_required: false,
        terms: null,
        submission_strategy: null,
      },
      voting: {
        scope: { group: null },
        period: { min: 2000, max: 3000 },
        credit_type: ApiWaveCreditType.TdhPlusXtdh,
        credit_scope: ApiWaveCreditScope.Wave,
        credit_category: null,
        creditor: null,
        credit_nfts: null,
        forbid_negative_votes: false,
      },
      chat: { enabled: true, scope: { group: null } },
    } as any;

    const rules = buildWaveRules({
      wave,
      metadata: [
        {
          id: 1,
          data_key: "wave_display.rules.custom",
          data_value: "Use current-season work.",
        },
      ],
    });

    expect(rules.custom.display).toBe("Use current-season work.");
    expect(rules.automatic.flatMap((section) => section.rows)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: "Decision cadence",
          value: "Single decision",
        }),
      ])
    );
  });

  it("summarizes ongoing rank waves with no scheduled decisions", () => {
    const config: CreateWaveConfig = {
      ...createConfig(),
      overview: { type: ApiWaveType.Rank, name: "Nodes", image: null },
      dates: {
        submissionStartDate: 1000,
        votingStartDate: 2000,
        endDate: null,
        firstDecisionTime: 5000,
        subsequentDecisions: [],
        isRolling: false,
        ongoingRanking: true,
      },
    };

    const rules = buildWaveRules({ config, groupsCache: {} });
    const rows = rules.automatic
      .flatMap((section) => section.rows)
      .map((row) => [row.label, row.value]);

    expect(rows).toEqual(
      expect.arrayContaining([
        ["Winner announcements", "None (ongoing ranking, no end date)"],
      ])
    );
    const labels = rows.map(([label]) => label);
    expect(labels).not.toContain("First decision");
    expect(labels).not.toContain("Decision cadence");
  });

  it("builds existing chat rules from chat settings", () => {
    const wave = {
      wave: {
        type: ApiWaveType.Chat,
        admin_group: { group: null },
        admin_drop_deletion_enabled: false,
        max_votes_per_identity_to_drop: null,
        time_lock_ms: null,
        decisions_strategy: null,
      },
      visibility: { scope: { group: null } },
      participation: {
        scope: { group: null },
        period: null,
        required_media: [],
        required_metadata: [],
        no_of_applications_allowed_per_participant: null,
        signature_required: true,
        terms: "Legacy chat terms.",
        submission_strategy: null,
      },
      voting: {
        scope: { group: null },
        period: null,
        credit_type: ApiWaveCreditType.TdhPlusXtdh,
        credit_scope: ApiWaveCreditScope.Wave,
        credit_category: null,
        creditor: null,
        credit_nfts: null,
        forbid_negative_votes: false,
      },
      chat: {
        enabled: true,
        scope: { group: null },
        links_disabled: true,
        slow_mode_cooldown_ms: 120_000,
      },
    } as any;

    const rules = buildWaveRules({ wave, metadata: [] });
    const rows = rules.automatic.flatMap((section) => section.rows);

    expect(rules.automatic.map((section) => section.title)).toEqual([
      "Wave",
      "Access",
      "Chat",
    ]);
    expect(rows).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ label: "Links", value: "Disabled" }),
        expect.objectContaining({ label: "Slow mode", value: "2m" }),
      ])
    );
    expect(rows).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ label: "Credit type" }),
        expect.objectContaining({ label: "Outcomes visibility" }),
      ])
    );
    expect(rules.custom.binding).toBeNull();
    expect(rules.custom.signatureRequired).toBe(false);
  });

  it("formats chat slow mode rules with seconds when configured below one minute", () => {
    const wave = {
      wave: {
        type: ApiWaveType.Chat,
        admin_group: { group: null },
        admin_drop_deletion_enabled: false,
        max_votes_per_identity_to_drop: null,
        time_lock_ms: null,
        decisions_strategy: null,
      },
      visibility: { scope: { group: null } },
      participation: {
        scope: { group: null },
        period: null,
        required_media: [],
        required_metadata: [],
        no_of_applications_allowed_per_participant: null,
        signature_required: false,
        terms: null,
        submission_strategy: null,
      },
      voting: {
        scope: { group: null },
        period: null,
        credit_type: ApiWaveCreditType.TdhPlusXtdh,
        credit_scope: ApiWaveCreditScope.Wave,
        credit_category: null,
        creditor: null,
        credit_nfts: null,
        forbid_negative_votes: false,
      },
      chat: {
        enabled: true,
        scope: { group: null },
        links_disabled: false,
        slow_mode_cooldown_ms: 30_000,
      },
    } as any;

    const rules = buildWaveRules({ wave, metadata: [] });

    expect(rules.automatic.flatMap((section) => section.rows)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ label: "Slow mode", value: "30s" }),
      ])
    );
  });
});

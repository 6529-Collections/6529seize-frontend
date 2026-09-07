import { buildCreateWaveReview } from "@/helpers/waves/create-wave-review.helpers";
import {
  CreateWaveOutcomeType,
  CreateWaveOutcomeConfigWinnersCreditValueType,
} from "@/types/waves.types";
import { ApiWaveCreditScope } from "@/generated/models/ApiWaveCreditScope";
import { ApiWaveCreditType } from "@/generated/models/ApiWaveCreditType";
import { ApiWaveMetadataType } from "@/generated/models/ApiWaveMetadataType";
import { ApiWaveType } from "@/generated/models/ApiWaveType";
import { buildWaveRules } from "@/helpers/waves/wave-rules.helpers";
import { getScopeRuleValue } from "@/helpers/waves/wave-rules.shared";
import type { CreateWaveConfig } from "@/types/waves.types";

const createConfig = (): CreateWaveConfig => ({
  overview: {
    type: ApiWaveType.Approve,
    typeSelected: true,
    name: "Approve",
    image: null,
  },
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
    expect(rules.automatic).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "timing", title: "Schedule" }),
      ])
    );
    expect(
      rules.automatic
        .flatMap((section) => section.rows)
        .map((row) => [row.label, row.value])
    ).toEqual(
      expect.arrayContaining([
        ["Visibility", "Public"],
        ["Who can drop", "Artists"],
        ["Who can vote", "Public"],
        ["Chat status", "Enabled"],
        ["Chat access", "Public"],
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
      overview: {
        type: ApiWaveType.Chat,
        typeSelected: true,
        name: "Chat",
        image: null,
      },
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
    ]);
    expect(labels).toEqual(
      expect.arrayContaining(["Visibility", "Chat access", "Admins"])
    );
    expect(labels).not.toEqual(
      expect.arrayContaining([
        "Who can drop",
        "Who can vote",
        "Who can chat",
        "Chat status",
      ])
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
    expect(rules.automatic).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "timing", title: "Schedule" }),
      ])
    );
    const rows = rules.automatic.flatMap((section) => section.rows);
    expect(rows).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ label: "Visibility", value: "Public" }),
        expect.objectContaining({ label: "Who can drop", value: "Public" }),
        expect.objectContaining({ label: "Who can vote", value: "Public" }),
        expect.objectContaining({ label: "Chat access", value: "Public" }),
        expect.objectContaining({
          label: "Decision cadence",
          value: "Single decision",
        }),
      ])
    );
  });

  it("summarizes ongoing rank waves with no scheduled decisions", () => {
    const base = createConfig();
    const config: CreateWaveConfig = {
      ...base,
      overview: {
        type: ApiWaveType.Rank,
        typeSelected: true,
        name: "Nodes",
        image: null,
      },
      dates: {
        submissionStartDate: 1000,
        votingStartDate: 2000,
        endDate: null,
        firstDecisionTime: 5000,
        subsequentDecisions: [],
        isRolling: false,
        ongoingRanking: true,
      },
      // Raw config carries stale values that the submit path strips; the
      // summary must report the effective state instead.
      outcomes: [{ title: "stale" } as any],
      display: {
        ...base.display,
        outcomesVisible: true,
      },
    };

    const rules = buildWaveRules({ config, groupsCache: {} });
    const rows = rules.automatic
      .flatMap((section) => section.rows)
      .map((row) => [row.label, row.value]);

    expect(rows).toEqual(
      expect.arrayContaining([
        ["Winner announcements", "None (ongoing ranking, no end date)"],
        ["Type", "Rank — Perpetual Ranking"],
        ["Outcomes visibility", "Hidden"],
        ["Configured outcomes", "Not available (perpetual wave)"],
      ])
    );
    const labels = rows.map(([label]) => label);
    expect(labels).not.toContain("First decision");
    expect(labels).not.toContain("Decision cadence");
  });

  it("labels existing perpetual rank waves in the type row", () => {
    const wave = {
      wave: {
        type: ApiWaveType.Rank,
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
      chat: { enabled: true, scope: { group: null } },
    } as any;

    const rows = buildWaveRules({ wave, metadata: [] }).automatic.flatMap(
      (section) => section.rows
    );

    expect(rows).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: "Type",
          value: "Rank — Perpetual Ranking",
        }),
      ])
    );
  });

  it("splits disabled chat status and access in create rules", () => {
    const rules = buildWaveRules({
      config: {
        ...createConfig(),
        chat: { enabled: false },
      },
      groupsCache: {},
    });
    const rows = rules.automatic.flatMap((section) => section.rows);

    expect(rows).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: "Chat status",
          value: "Disabled",
        }),
        expect.objectContaining({
          label: "Chat access",
          value: "Public",
        }),
      ])
    );
    expect(rows).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ label: "Who can chat" }),
      ])
    );
  });

  it("splits disabled chat status and access in existing wave rules", () => {
    const wave = {
      wave: {
        type: ApiWaveType.Rank,
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
      chat: { enabled: false, scope: { group: null } },
    } as any;

    const rows = buildWaveRules({ wave, metadata: [] }).automatic.flatMap(
      (section) => section.rows
    );

    expect(rows).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: "Chat status",
          value: "Disabled",
        }),
        expect.objectContaining({
          label: "Chat access",
          value: "Public",
        }),
      ])
    );
    expect(rows).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ label: "Who can chat" }),
      ])
    );
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
        expect.objectContaining({
          label: "Chat access",
          value: "Public",
        }),
        expect.objectContaining({ label: "Links", value: "Disabled" }),
        expect.objectContaining({ label: "Slow mode", value: "2m" }),
      ])
    );
    expect(rows).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ label: "Chat status" }),
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

  it("keeps hidden scope groups private and non-interactive", () => {
    expect(
      getScopeRuleValue({
        scope: { group: { is_hidden: true } },
        fallback: "Anyone",
      })
    ).toEqual({
      value: "Private group",
      valueHref: undefined,
      valueGroupId: undefined,
      valueLinkLabel: undefined,
    });
  });

  it("uses the fallback for an empty scope group", () => {
    expect(
      getScopeRuleValue({
        scope: { group: null },
        fallback: "Anyone",
      })
    ).toEqual({
      value: "Anyone",
      valueHref: undefined,
      valueGroupId: undefined,
      valueLinkLabel: undefined,
    });
  });

  it("keeps direct-message scope groups private and non-interactive", () => {
    expect(
      getScopeRuleValue({
        scope: {
          group: {
            id: "dm-1",
            name: "Private conversation",
            is_hidden: false,
            is_direct_message: true,
          },
        },
        fallback: "Anyone",
      })
    ).toEqual({
      value: "Private group",
      valueHref: undefined,
      valueGroupId: undefined,
      valueLinkLabel: undefined,
    });
  });

  it("does not expose or link an incomplete visible group", () => {
    expect(
      getScopeRuleValue({
        scope: {
          group: {
            id: "stale-group-id",
            is_hidden: false,
          },
        },
        fallback: "Anyone",
      })
    ).toEqual({
      value: "Group unavailable",
      valueHref: undefined,
      valueGroupId: undefined,
      valueLinkLabel: undefined,
    });
  });

  it("links visible scope groups to criteria and members", () => {
    expect(
      getScopeRuleValue({
        scope: {
          group: {
            id: "artists & curators",
            name: "Artists and curators",
            is_hidden: false,
          },
        },
        fallback: "Anyone",
      })
    ).toEqual({
      value: "Artists and curators",
      valueHref: "/network?page=1&group=artists%20%26%20curators",
      valueGroupId: "artists & curators",
      valueLinkLabel: "Inspect Artists and curators group criteria and members",
    });
  });
});

describe("create-wave final review", () => {
  it("shows rank rewards and winner percentages alongside voting and author rules", () => {
    const config = createConfig();
    const rules = buildCreateWaveReview({
      config: {
        ...config,
        overview: { ...config.overview, type: ApiWaveType.Rank },
        outcomes: [
          {
            type: CreateWaveOutcomeType.REP,
            title: null,
            credit: null,
            category: "Art",
            winnersConfig: {
              creditValueType:
                CreateWaveOutcomeConfigWinnersCreditValueType.PERCENTAGE,
              totalAmount: 1000,
              winners: [{ value: 60 }, { value: 40 }],
            },
          },
        ],
      },
      groupsCache: {},
      locale: "en-US",
      parentWaveName: "Parent",
    });
    const rows = rules.automatic.flatMap((section) => section.rows);
    expect(rows).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ label: "Parent wave", value: "Parent" }),
        expect.objectContaining({ label: "Total", value: "1,000 REP" }),
        expect.objectContaining({ label: "Winner 1", value: "60%" }),
        expect.objectContaining({ label: "Winner 2", value: "40%" }),
        expect.objectContaining({ id: "max-votes", value: "10" }),
      ])
    );
    expect(rules.custom).toEqual({
      display: "No AI-only submissions.",
      binding: "Must be original.",
      signatureRequired: true,
    });
  });

  it("shows approve credit per approved drop and manual reward descriptions", () => {
    const config = createConfig();
    const rules = buildCreateWaveReview({
      config: {
        ...config,
        outcomes: [
          {
            type: CreateWaveOutcomeType.NIC,
            title: null,
            category: null,
            credit: 25,
            winnersConfig: null,
          },
          {
            type: CreateWaveOutcomeType.MANUAL,
            title: "A signed print",
            category: null,
            credit: null,
            winnersConfig: null,
          },
        ],
      },
      groupsCache: {},
      locale: "en-US",
    });
    expect(rules.automatic.flatMap((section) => section.rows)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: "Per approved drop",
          value: "25 NIC",
        }),
        expect.objectContaining({ label: "Reward", value: "A signed print" }),
        expect.objectContaining({ id: "approval-threshold" }),
      ])
    );
  });

  it.each([ApiWaveType.Chat, ApiWaveType.Rank])(
    "omits stale outcome rewards for %s without winners",
    (type) => {
      const config = createConfig();
      const rules = buildCreateWaveReview({
        config: {
          ...config,
          overview: { ...config.overview, type },
          dates: { ...config.dates, ongoingRanking: true },
          outcomes: [
            {
              type: CreateWaveOutcomeType.MANUAL,
              title: "Stale reward",
              category: null,
              credit: null,
              winnersConfig: null,
            },
          ],
        },
        groupsCache: {},
        locale: "en-US",
      });
      expect(
        rules.automatic
          .flatMap((section) => section.rows)
          .some((row) => row.value === "Stale reward")
      ).toBe(false);
    }
  );
});

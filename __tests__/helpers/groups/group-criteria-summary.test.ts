import { ApiGroupFilterDirection } from "@/generated/models/ApiGroupFilterDirection";
import { ApiGroupTdhInclusionStrategy } from "@/generated/models/ApiGroupTdhInclusionStrategy";
import { getGroupCriteriaSummary } from "@/helpers/groups/group-criteria-summary";

describe("getGroupCriteriaSummary", () => {
  it("describes rule thresholds and explicit include and exclude lists", () => {
    const summary = getGroupCriteriaSummary({
      locale: "en-US",
      group: {
        tdh: {
          min: null,
          max: null,
          inclusion_strategy: ApiGroupTdhInclusionStrategy.Both,
        },
        rep: {
          min: 12,
          max: null,
          direction: ApiGroupFilterDirection.Received,
          user_identity: null,
          category: null,
        },
        cic: {
          min: 3,
          max: null,
          direction: ApiGroupFilterDirection.Received,
          user_identity: "punk6529",
        },
        level: { min: null, max: null },
        owns_nfts: [],
        identity_addresses: ["0x1", "0x2", "0x3", "0x4"],
        excluded_identity_addresses: ["0x5"],
        is_beneficiary_of_grant_id: null,
      },
    });

    expect(summary).toEqual({
      status: "available",
      text: "REP at least 12, NIC from punk6529 at least 3, 4 explicitly included users, and 1 explicitly excluded user",
    });
  });

  it("marks incomplete legacy data as unavailable", () => {
    expect(
      getGroupCriteriaSummary({
        locale: "en-US",
        group: {} as never,
      })
    ).toEqual({ status: "unavailable", text: null });
  });

  it("uses resolved profile handles for wallet-based REP and NIC identities", () => {
    const repWallet = "0xfd22004806a6846ea67ad883356be810f0428793";
    const nicWallet = "0x1111111111111111111111111111111111111111";
    const summary = getGroupCriteriaSummary({
      locale: "en-US",
      identityLabels: {
        [repWallet]: "rep-giver",
        [nicWallet]: "nic-giver",
      },
      group: {
        tdh: {
          min: null,
          max: null,
          inclusion_strategy: ApiGroupTdhInclusionStrategy.Both,
        },
        rep: {
          min: 4,
          max: null,
          direction: ApiGroupFilterDirection.Received,
          user_identity: `0x${repWallet.slice(2).toUpperCase()}`,
          category: null,
        },
        cic: {
          min: 2,
          max: null,
          direction: ApiGroupFilterDirection.Sent,
          user_identity: nicWallet,
        },
        level: { min: null, max: null },
        owns_nfts: [],
        identity_addresses: null,
        excluded_identity_addresses: null,
        is_beneficiary_of_grant_id: null,
      },
    });

    expect(summary.text).toBe(
      "REP from rep-giver at least 4 and NIC to nic-giver at least 2"
    );
  });

  it("treats missing saved-group identity counts as zero", () => {
    const summary = getGroupCriteriaSummary({
      locale: "en-US",
      group: {
        tdh: {
          min: null,
          max: null,
          inclusion_strategy: ApiGroupTdhInclusionStrategy.Both,
        },
        rep: {
          min: 12,
          max: null,
          direction: ApiGroupFilterDirection.Received,
          user_identity: null,
          category: null,
        },
        cic: {
          min: null,
          max: null,
          direction: ApiGroupFilterDirection.Received,
          user_identity: null,
        },
        level: { min: null, max: null },
        owns_nfts: [],
        identity_group_id: null,
        identity_group_identities_count: undefined,
        excluded_identity_group_id: null,
        excluded_identity_group_identities_count: undefined,
        is_beneficiary_of_grant_id: null,
        is_beneficiary_of_grant_match_mode: "ANY_TOKEN",
        is_beneficiary_of_grant: null,
      } as never,
    });

    expect(summary).toEqual({ status: "available", text: "REP at least 12" });
  });

  it("uses the embedded grant collection name for saved groups", () => {
    const grantId = "f03ed989-0fe2-46db-89c1-8ab8b89efb01";
    const summary = getGroupCriteriaSummary({
      locale: "en-US",
      group: {
        tdh: {
          min: null,
          max: null,
          inclusion_strategy: ApiGroupTdhInclusionStrategy.Both,
        },
        rep: {
          min: null,
          max: null,
          direction: ApiGroupFilterDirection.Received,
          user_identity: null,
          category: null,
        },
        cic: {
          min: null,
          max: null,
          direction: ApiGroupFilterDirection.Received,
          user_identity: null,
        },
        level: { min: null, max: null },
        owns_nfts: [],
        identity_group_id: null,
        identity_group_identities_count: 0,
        excluded_identity_group_id: null,
        excluded_identity_group_identities_count: 0,
        is_beneficiary_of_grant_id: grantId,
        is_beneficiary_of_grant_match_mode: "ANY_TOKEN",
        is_beneficiary_of_grant: {
          target_collection_name: "NextGen 6529",
        },
      } as never,
    });

    expect(summary).toEqual({
      status: "available",
      text: "xTDH grant NextGen 6529",
    });
    expect(summary.text).not.toContain(grantId);
  });

  it.each([
    ["en-US", "Level between 1 and 3"],
    ["en-GB", "Level between 1 and 3"],
    ["fr-FR", "Niveau entre 1 et 3"],
    ["es-ES", "Nivel entre 1 y 3"],
    ["de-DE", "Stufe zwischen 1 und 3"],
  ] as const)("localizes readable ranges for %s", (locale, expected) => {
    const summary = getGroupCriteriaSummary({
      locale,
      group: {
        tdh: {
          min: null,
          max: null,
          inclusion_strategy: ApiGroupTdhInclusionStrategy.Both,
        },
        rep: {
          min: null,
          max: null,
          direction: ApiGroupFilterDirection.Received,
          user_identity: null,
          category: null,
        },
        cic: {
          min: null,
          max: null,
          direction: ApiGroupFilterDirection.Received,
          user_identity: null,
        },
        level: { min: 1, max: 3 },
        owns_nfts: [],
        identity_addresses: null,
        excluded_identity_addresses: null,
        is_beneficiary_of_grant_id: null,
      },
    });

    expect(summary).toEqual({ status: "available", text: expected });
  });
});

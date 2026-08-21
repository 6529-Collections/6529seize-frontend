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

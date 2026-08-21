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
      text: "REP ≥ 12, NIC from punk6529 ≥ 3, 4 explicitly included users, and 1 explicitly excluded user",
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
});

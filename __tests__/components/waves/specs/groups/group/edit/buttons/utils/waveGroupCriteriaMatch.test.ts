import { areWaveGroupCriteriaEqual } from "@/components/waves/specs/groups/group/edit/buttons/utils/waveGroupCriteriaMatch";
import type { WaveGroupCriteria } from "@/components/waves/specs/groups/group/edit/hooks/useWaveGroupCriteria";
import { ApiGroupBeneficiaryGrantMatchMode } from "@/generated/models/ApiGroupBeneficiaryGrantMatchMode";
import { ApiGroupFilterDirection } from "@/generated/models/ApiGroupFilterDirection";
import { ApiGroupNftOwnershipMatchMode } from "@/generated/models/ApiGroupNftOwnershipMatchMode";
import { ApiGroupOwnsNftNameEnum } from "@/generated/models/ApiGroupOwnsNft";
import { ApiGroupTdhInclusionStrategy } from "@/generated/models/ApiGroupTdhInclusionStrategy";

const createCriteria = ({
  id,
  level = 1,
  includedWallets = ["0xA", "0xB"],
  nftOrder = ["2", "1"],
  repCategory = "Builder",
  repIdentity = "ALICE",
}: {
  readonly id: string;
  readonly level?: number;
  readonly includedWallets?: readonly string[];
  readonly nftOrder?: readonly string[];
  readonly repCategory?: string;
  readonly repIdentity?: string;
}): WaveGroupCriteria => ({
  group: {
    id,
    name: id,
    group: {
      tdh: {
        min: 10,
        max: null,
        inclusion_strategy: ApiGroupTdhInclusionStrategy.Both,
      },
      rep: {
        min: 5,
        max: null,
        direction: ApiGroupFilterDirection.Received,
        user_identity: repIdentity,
        category: repCategory,
      },
      cic: {
        min: 2,
        max: null,
        direction: ApiGroupFilterDirection.Received,
        user_identity: null,
      },
      level: { min: level, max: null },
      owns_nfts: [
        {
          name: ApiGroupOwnsNftNameEnum.Memes,
          tokens: [...nftOrder],
          match_mode: ApiGroupNftOwnershipMatchMode.AllTokens,
        },
      ],
      identity_group_id: `${id}-included`,
      identity_group_identities_count: includedWallets.length,
      excluded_identity_group_id: `${id}-excluded`,
      excluded_identity_group_identities_count: 1,
      is_beneficiary_of_grant_id: " GRANT-1 ",
      is_beneficiary_of_grant_match_mode:
        ApiGroupBeneficiaryGrantMatchMode.AnyToken,
      is_beneficiary_of_grant: null,
    },
    created_at: 1,
    created_by: { id: "author" } as any,
    visible: true,
    is_private: false,
  },
  includedWallets,
  excludedWallets: ["0xC"],
});

describe("areWaveGroupCriteriaEqual", () => {
  it("treats public access as equal only to public access", () => {
    const publicCriteria: WaveGroupCriteria = {
      group: null,
      includedWallets: [],
      excludedWallets: [],
    };

    expect(areWaveGroupCriteriaEqual(publicCriteria, publicCriteria)).toBe(
      true
    );
    expect(
      areWaveGroupCriteriaEqual(publicCriteria, createCriteria({ id: "one" }))
    ).toBe(false);
  });

  it("matches equivalent criteria regardless of wallet and token ordering or case", () => {
    expect(
      areWaveGroupCriteriaEqual(
        createCriteria({ id: "one" }),
        createCriteria({
          id: "two",
          includedWallets: ["0xb", "0xa", "0xA"],
          nftOrder: ["1", "2"],
        })
      )
    ).toBe(true);
  });

  it("keeps user-authored criteria identifiers locale-neutral and case-sensitive", () => {
    expect(
      areWaveGroupCriteriaEqual(
        createCriteria({ id: "one" }),
        createCriteria({
          id: "two",
          repCategory: "builder",
          repIdentity: "alice",
        })
      )
    ).toBe(false);
  });

  it("detects a meaningful criteria difference", () => {
    expect(
      areWaveGroupCriteriaEqual(
        createCriteria({ id: "one", level: 1 }),
        createCriteria({ id: "two", level: 2 })
      )
    ).toBe(false);
  });

  it("short-circuits matching references to the same group", () => {
    expect(
      areWaveGroupCriteriaEqual(
        createCriteria({ id: "same", level: 1 }),
        createCriteria({ id: "same", level: 99 })
      )
    ).toBe(true);
  });
});

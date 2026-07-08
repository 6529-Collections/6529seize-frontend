import React from "react";
import { render } from "@testing-library/react";
import GroupCardConfigs from "@/components/groups/page/list/card/GroupCardConfigs";
import { ApiGroupBeneficiaryGrantMatchMode } from "@/generated/models/ApiGroupBeneficiaryGrantMatchMode";
import { ApiGroupFilterDirection } from "@/generated/models/ApiGroupFilterDirection";
import { ApiGroupNftOwnershipMatchMode } from "@/generated/models/ApiGroupNftOwnershipMatchMode";
import { ApiGroupOwnsNftNameEnum } from "@/generated/models/ApiGroupOwnsNft";
import { ApiXTdhGrantStatus } from "@/generated/models/ApiXTdhGrantStatus";
import { ApiXTdhGrantTargetTokenMode } from "@/generated/models/ApiXTdhGrantTargetTokenMode";
import { GroupDescriptionType } from "@/entities/IGroup";

jest.mock(
  "@/components/groups/page/list/card/GroupCardConfig",
  () =>
    ({ config }: any) => (
      <div data-testid={`config-${config.key}`}>{config.value}</div>
    )
);

const emptyGroupDescription = {
  tdh: { min: null, max: null },
  rep: { min: null, max: null, category: null, user_identity: null },
  cic: { min: null, max: null, user_identity: null, direction: null },
  level: { min: null, max: null },
  owns_nfts: [],
  identity_group_identities_count: 0,
};

describe("GroupCardConfigs", () => {
  it("shows default manual list hint when group undefined", () => {
    const { getByTestId } = render(
      <GroupCardConfigs group={undefined as any} />
    );
    expect(
      getByTestId(`config-${GroupDescriptionType.WALLETS}`)
    ).toHaveTextContent("No manual list");
  });

  it("creates configs from group data", () => {
    const group: any = {
      group: {
        tdh: { min: 1, max: 2 },
        rep: {
          min: 0,
          max: 10,
          category: "c",
          user_identity: "bob",
          direction: ApiGroupFilterDirection.Sent,
        },
        cic: { min: null, max: 5, user_identity: null, direction: null },
        level: { min: 3, max: 4 },
        owns_nfts: [],
        identity_group_identities_count: 7,
      },
    };
    const { getByTestId } = render(<GroupCardConfigs group={group} />);
    expect(getByTestId(`config-${GroupDescriptionType.TDH}`)).toHaveTextContent(
      "1 - 2"
    );
    expect(getByTestId(`config-${GroupDescriptionType.REP}`)).toHaveTextContent(
      "0 - 10, category: c, to identity: bob"
    );
    expect(getByTestId(`config-${GroupDescriptionType.NIC}`)).toHaveTextContent(
      "<= 5"
    );
    expect(
      getByTestId(`config-${GroupDescriptionType.LEVEL}`)
    ).toHaveTextContent("3 - 4");
    expect(
      getByTestId(`config-${GroupDescriptionType.WALLETS}`)
    ).toHaveTextContent("7");
  });

  it("labels internal NFT requirements", () => {
    const group: any = {
      group: {
        ...emptyGroupDescription,
        owns_nfts: [
          {
            name: ApiGroupOwnsNftNameEnum.Memes,
            tokens: ["100", "201"],
            match_mode: ApiGroupNftOwnershipMatchMode.AnyToken,
          },
          {
            name: ApiGroupOwnsNftNameEnum.Gradients,
            tokens: ["5"],
            match_mode: ApiGroupNftOwnershipMatchMode.AllTokens,
          },
          {
            name: ApiGroupOwnsNftNameEnum.Nextgen,
            tokens: [],
          },
        ],
      },
    };

    const { getByTestId } = render(<GroupCardConfigs group={group} />);

    expect(
      getByTestId(`config-${GroupDescriptionType.OWNS_NFTS}`)
    ).toHaveTextContent(
      "Memes: any selected (2), Gradients: all selected (1), NextGen: any collection token"
    );
  });

  it("does not guess grant token mode when grant details are unresolved", () => {
    const group: any = {
      group: {
        ...emptyGroupDescription,
        is_beneficiary_of_grant_id: "grant-1",
        is_beneficiary_of_grant_match_mode:
          ApiGroupBeneficiaryGrantMatchMode.AnyToken,
        is_beneficiary_of_grant: null,
      },
    };

    const { getByTestId } = render(<GroupCardConfigs group={group} />);

    expect(
      getByTestId(`config-${GroupDescriptionType.XTDH_GRANT}`)
    ).toHaveTextContent("grant-1");
    expect(
      getByTestId(`config-${GroupDescriptionType.XTDH_GRANT}`)
    ).not.toHaveTextContent("Any specified token");
  });

  it("labels full-collection grant requirements", () => {
    const group: any = {
      group: {
        ...emptyGroupDescription,
        is_beneficiary_of_grant_id: "grant-1",
        is_beneficiary_of_grant_match_mode:
          ApiGroupBeneficiaryGrantMatchMode.AnyToken,
        is_beneficiary_of_grant: {
          status: ApiXTdhGrantStatus.Granted,
          target_token_mode: ApiXTdhGrantTargetTokenMode.All,
          valid_from: null,
          valid_to: null,
        },
      },
    };

    const { getByTestId } = render(<GroupCardConfigs group={group} />);

    expect(
      getByTestId(`config-${GroupDescriptionType.XTDH_GRANT}`)
    ).toHaveTextContent("ACTIVE (grant-1) · Any collection token");
  });
});

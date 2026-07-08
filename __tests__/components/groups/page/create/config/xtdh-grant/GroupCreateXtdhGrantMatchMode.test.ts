import {
  DEFAULT_BENEFICIARY_GRANT_MATCH_MODE,
  getGrantCompatibleMatchMode,
} from "@/components/groups/page/create/config/xtdh-grant/GroupCreateXtdhGrantMatchMode";
import { ApiGroupBeneficiaryGrantMatchMode } from "@/generated/models/ApiGroupBeneficiaryGrantMatchMode";
import type { ApiXTdhGrant } from "@/generated/models/ApiXTdhGrant";
import { ApiXTdhGrantTargetTokenMode } from "@/generated/models/ApiXTdhGrantTargetTokenMode";

const grantWithMode = (
  targetTokenMode: ApiXTdhGrantTargetTokenMode
): ApiXTdhGrant =>
  ({
    target_token_mode: targetTokenMode,
  }) as ApiXTdhGrant;

describe("GroupCreateXtdhGrantMatchMode", () => {
  it("keeps all-token matching for token-specific grants", () => {
    expect(
      getGrantCompatibleMatchMode(
        grantWithMode(ApiXTdhGrantTargetTokenMode.Include),
        ApiGroupBeneficiaryGrantMatchMode.AllTokens
      )
    ).toBe(ApiGroupBeneficiaryGrantMatchMode.AllTokens);
  });

  it("keeps any-token matching for token-specific grants", () => {
    expect(
      getGrantCompatibleMatchMode(
        grantWithMode(ApiXTdhGrantTargetTokenMode.Include),
        ApiGroupBeneficiaryGrantMatchMode.AnyToken
      )
    ).toBe(ApiGroupBeneficiaryGrantMatchMode.AnyToken);
  });

  it("resets all-token matching for full-collection grants", () => {
    expect(
      getGrantCompatibleMatchMode(
        grantWithMode(ApiXTdhGrantTargetTokenMode.All),
        ApiGroupBeneficiaryGrantMatchMode.AllTokens
      )
    ).toBe(DEFAULT_BENEFICIARY_GRANT_MATCH_MODE);
  });

  it("resets all-token matching without grant details", () => {
    expect(
      getGrantCompatibleMatchMode(
        null,
        ApiGroupBeneficiaryGrantMatchMode.AllTokens
      )
    ).toBe(DEFAULT_BENEFICIARY_GRANT_MATCH_MODE);
  });
});

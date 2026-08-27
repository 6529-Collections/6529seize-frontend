import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import type { ApiCreateGroup } from "@/generated/models/ApiCreateGroup";
import type { ApiXTdhGrant } from "@/generated/models/ApiXTdhGrant";
import { ApiGroupBeneficiaryGrantMatchMode } from "@/generated/models/ApiGroupBeneficiaryGrantMatchMode";
import { ApiXTdhGrantStatus } from "@/generated/models/ApiXTdhGrantStatus";
import { ApiXTdhGrantTargetTokenMode } from "@/generated/models/ApiXTdhGrantTargetTokenMode";
import CreateWaveInlineGroupRuleEditor from "@/components/waves/create-wave/groups/CreateWaveInlineGroupRuleEditor";
import {
  createEmptyInlineGroupPayload,
  CreateWaveInlineGroupRuleType,
} from "@/components/waves/create-wave/groups/createWaveInlineGroupBuilder";

const mockSelectedGrant = {
  id: "grant-1",
  status: ApiXTdhGrantStatus.Granted,
  target_token_mode: ApiXTdhGrantTargetTokenMode.All,
} as ApiXTdhGrant;

jest.mock("@/hooks/useXtdhGrantQuery", () => ({
  useXtdhGrantQuery: () => ({
    grant: undefined,
    isFetching: false,
    isError: false,
    errorMessage: undefined,
  }),
}));

jest.mock("@/hooks/useXtdhGrantsSearchQuery", () => ({
  useXtdhGrantsSearchQuery: () => ({
    grants: [mockSelectedGrant],
    totalCount: 1,
    hasNextPage: false,
    fetchNextPage: jest.fn(),
    isFetchingNextPage: false,
    isLoading: false,
    isError: false,
    errorMessage: undefined,
    refetch: jest.fn(),
  }),
}));

jest.mock("@/components/utils/input/identity/IdentitySearch", () => ({
  __esModule: true,
  IdentitySearchSize: { SM: "SM" },
  default: function MockIdentitySearch() {
    return <div>Grantor search</div>;
  },
}));

jest.mock(
  "@/components/groups/page/create/config/xtdh-grant/subcomponents/GroupCreateXtdhGrantRow",
  () =>
    function MockGrantRow({
      grant,
      onSelect,
    }: {
      readonly grant: ApiXTdhGrant;
      readonly onSelect: (grant: ApiXTdhGrant) => void;
    }) {
      return (
        <li>
          <button type="button" onClick={() => onSelect(grant)}>
            Select {grant.id}
          </button>
        </li>
      );
    }
);

function TestEditor() {
  const [draft, setDraft] = useState<ApiCreateGroup>(() => {
    const emptyDraft = createEmptyInlineGroupPayload();
    return {
      ...emptyDraft,
      group: {
        ...emptyDraft.group,
        is_beneficiary_of_grant_match_mode:
          ApiGroupBeneficiaryGrantMatchMode.AllTokens,
      },
    };
  });

  return (
    <>
      <CreateWaveInlineGroupRuleEditor
        draft={draft}
        activeRule={CreateWaveInlineGroupRuleType.XTDH_GRANT}
        onDraftChange={setDraft}
      />
      <output aria-label="Selected grant">
        {draft.group.is_beneficiary_of_grant_id ?? "none"}
      </output>
      <output aria-label="Grant match mode">
        {draft.group.is_beneficiary_of_grant_match_mode}
      </output>
    </>
  );
}

describe("CreateWaveInlineGroupXtdhGrant", () => {
  it("keeps the selected grant and its compatible match mode in the inline draft", async () => {
    const user = userEvent.setup();
    render(<TestEditor />);

    await user.click(screen.getByRole("button", { name: "Find grant" }));
    await user.click(screen.getByRole("button", { name: "Select grant-1" }));

    expect(screen.getByRole("textbox", { name: "Grant ID" })).toHaveValue(
      "grant-1"
    );
    expect(
      screen.getByRole("status", { name: "Selected grant" })
    ).toHaveTextContent("grant-1");
    expect(
      screen.getByRole("status", { name: "Grant match mode" })
    ).toHaveTextContent(ApiGroupBeneficiaryGrantMatchMode.AnyToken);
  });
});

import { render, screen, waitFor } from "@testing-library/react";
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
  useXtdhGrantQuery: ({ grantId }: { readonly grantId: string | null }) => ({
    grant: grantId ? mockSelectedGrant : undefined,
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
  default: function MockIdentitySearch({
    identity,
    setIdentity,
  }: {
    readonly identity: string | null;
    readonly setIdentity: (identity: string | null) => void;
  }) {
    return (
      <label>
        Grantor search
        <input
          aria-label="Grantor"
          value={identity ?? ""}
          onChange={(event) => setIdentity(event.target.value || null)}
        />
      </label>
    );
  },
}));

jest.mock(
  "@/components/groups/page/create/config/xtdh-grant/subcomponents/GroupCreateXtdhGrantRow",
  () =>
    function MockGrantRow({
      grant,
      interactive,
      onSelect,
    }: {
      readonly grant: ApiXTdhGrant;
      readonly interactive?: boolean | undefined;
      readonly onSelect?: ((grant: ApiXTdhGrant) => void) | undefined;
    }) {
      return interactive ? (
        <li>
          <button type="button" onClick={() => onSelect?.(grant)}>
            Select {grant.id}
          </button>
        </li>
      ) : (
        <div>Selected grant {grant.id}</div>
      );
    }
);

function TestEditor({
  networkPresentation = false,
}: {
  readonly networkPresentation?: boolean;
}) {
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
        networkPresentation={networkPresentation}
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
  it.each(["collection", "grantor", "status"] as const)(
    "shows Clear filters only after changing the Network %s filter and restores defaults",
    async (filter) => {
      const user = userEvent.setup();
      render(<TestEditor networkPresentation />);
      const clearFilters = () =>
        screen.queryByRole("button", { name: "Clear filters" });
      expect(clearFilters()).not.toBeInTheDocument();

      if (filter === "collection") {
        await user.type(
          screen.getByRole("textbox", { name: "Collection name" }),
          "Memes"
        );
      } else if (filter === "grantor") {
        await user.type(
          screen.getByRole("textbox", { name: "Grantor" }),
          "alice"
        );
      } else {
        await user.click(screen.getByRole("button", { name: "Pending" }));
      }

      await user.click(screen.getByRole("button", { name: "Clear filters" }));
      await waitFor(() => expect(clearFilters()).not.toBeInTheDocument());
      expect(
        screen.getByRole("textbox", { name: "Collection name" })
      ).toHaveValue("");
      expect(screen.getByRole("textbox", { name: "Grantor" })).toHaveValue("");
      expect(screen.getByRole("button", { name: "Granted" })).toHaveAttribute(
        "aria-pressed",
        "true"
      );
      expect(screen.getByRole("button", { name: "Granted" })).toHaveFocus();
      expect(
        screen.getByRole("status", { name: "Selected grant" })
      ).toHaveTextContent("none");
    }
  );

  it("searches first, then shows controls for the selected grant", async () => {
    const user = userEvent.setup();
    render(<TestEditor />);
    expect(
      screen.getByRole("button", { name: "Clear filters" })
    ).toBeInTheDocument();

    expect(
      screen.queryByRole("textbox", { name: "Grant ID" })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Find grant" })
    ).not.toBeInTheDocument();
    expect(screen.getByText("Grantor search")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Select grant-1" }));

    expect(
      screen.getByRole("status", { name: "Selected grant" })
    ).toHaveTextContent("grant-1");
    expect(
      screen.getByRole("status", { name: "Grant match mode" })
    ).toHaveTextContent(ApiGroupBeneficiaryGrantMatchMode.AnyToken);
    expect(screen.getByText("Selected grant grant-1")).toBeInTheDocument();
    expect(screen.queryByText("Grantor search")).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Change grant" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Remove grant" })
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Change grant" }));

    expect(screen.getByText("Grantor search")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Cancel change" })
    ).toHaveAttribute("aria-expanded", "true");

    await user.click(screen.getByRole("button", { name: "Cancel change" }));

    expect(screen.queryByText("Grantor search")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Remove grant" }));

    expect(
      screen.getByRole("status", { name: "Selected grant" })
    ).toHaveTextContent("none");
    expect(screen.getByText("Grantor search")).toBeInTheDocument();
    expect(
      screen.queryByText("Selected grant grant-1")
    ).not.toBeInTheDocument();
  });
});

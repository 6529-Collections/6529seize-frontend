import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { useXtdhGrantsSearchQuery } from "@/hooks/useXtdhGrantsSearchQuery";
import type { ApiCreateGroup } from "@/generated/models/ApiCreateGroup";
import type { ApiXTdhGrant } from "@/generated/models/ApiXTdhGrant";
import { ApiGroupBeneficiaryGrantMatchMode } from "@/generated/models/ApiGroupBeneficiaryGrantMatchMode";
import { ApiXTdhGrantStatus } from "@/generated/models/ApiXTdhGrantStatus";
import { ApiXTdhGrantTargetTokenMode } from "@/generated/models/ApiXTdhGrantTargetTokenMode";
import GroupCreateXtdhGrantMatchMode from "@/components/groups/page/create/config/xtdh-grant/GroupCreateXtdhGrantMatchMode";
import CreateWaveInlineGroupRuleEditor from "@/components/waves/create-wave/groups/CreateWaveInlineGroupRuleEditor";
import {
  createEmptyInlineGroupPayload,
  CreateWaveInlineGroupRuleType,
} from "@/components/waves/create-wave/groups/createWaveInlineGroupBuilder";

jest.unmock("react-use");

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
  useXtdhGrantsSearchQuery: jest.fn(() => ({
    grants: [mockSelectedGrant],
    totalCount: 1,
    hasNextPage: false,
    fetchNextPage: jest.fn(),
    isFetchingNextPage: false,
    isLoading: false,
    isError: false,
    errorMessage: undefined,
    refetch: jest.fn(),
  })),
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
  it.each([false, true])(
    "preserves token requirement selection with shared tabs (quiet=%s)",
    async (quiet) => {
      const user = userEvent.setup();
      const setMatchMode = jest.fn();
      render(
        <GroupCreateXtdhGrantMatchMode
          quiet={quiet}
          grant={{
            ...mockSelectedGrant,
            target_token_mode: ApiXTdhGrantTargetTokenMode.Include,
          }}
          matchMode={ApiGroupBeneficiaryGrantMatchMode.AnyToken}
          setMatchMode={setMatchMode}
        />
      );

      expect(
        screen.getByRole("tablist", { name: "Token requirement" })
      ).toBeInTheDocument();
      const ownAny = screen.getByRole("tab", { name: "Own any" });
      const ownAll = screen.getByRole("tab", { name: "Own all" });
      expect(ownAny).toHaveAttribute("aria-selected", "true");
      expect(ownAll).toHaveAttribute("aria-selected", "false");
      await user.click(ownAll);
      expect(setMatchMode).toHaveBeenLastCalledWith(
        ApiGroupBeneficiaryGrantMatchMode.AllTokens
      );
      await user.click(ownAny);
      expect(setMatchMode).toHaveBeenLastCalledWith(
        ApiGroupBeneficiaryGrantMatchMode.AnyToken
      );
    }
  );

  it.each([false, true])(
    "does not show Clear filters for status tabs alone (network=%s)",
    async (networkPresentation) => {
      const user = userEvent.setup();
      render(<TestEditor networkPresentation={networkPresentation} />);
      for (const status of ["Pending", "Revoked", "Failed", "Granted"]) {
        await user.click(screen.getByRole("tab", { name: status }));
        expect(
          screen.queryByRole("button", { name: "Clear filters" })
        ).not.toBeInTheDocument();
      }
    }
  );

  it.each([
    { filter: "collection", networkPresentation: false },
    { filter: "grantor", networkPresentation: false },
    { filter: "collection", networkPresentation: true },
    { filter: "grantor", networkPresentation: true },
  ])(
    "clears the $filter search while preserving status (network=$networkPresentation)",
    async ({ filter, networkPresentation }) => {
      const user = userEvent.setup();
      render(<TestEditor networkPresentation={networkPresentation} />);
      const clearFilters = () =>
        screen.queryByRole("button", { name: "Clear filters" });
      expect(clearFilters()).not.toBeInTheDocument();
      await user.click(screen.getByRole("tab", { name: "Pending" }));

      if (filter === "collection") {
        await user.type(
          screen.getByRole("textbox", { name: "Collection name" }),
          "Memes"
        );
        await waitFor(() =>
          expect(useXtdhGrantsSearchQuery).toHaveBeenLastCalledWith(
            expect.objectContaining({ targetCollectionName: "Memes" })
          )
        );
      } else {
        await user.type(
          screen.getByRole("textbox", { name: "Grantor" }),
          "alice"
        );
      }

      await user.click(screen.getByRole("button", { name: "Clear filters" }));
      await waitFor(() => expect(clearFilters()).not.toBeInTheDocument());
      expect(
        screen.getByRole("textbox", { name: "Collection name" })
      ).toHaveValue("");
      expect(screen.getByRole("textbox", { name: "Grantor" })).toHaveValue("");
      expect(screen.getByRole("tab", { name: "Pending" })).toHaveAttribute(
        "aria-selected",
        "true"
      );
      expect(screen.getByRole("tab", { name: "Pending" })).toHaveFocus();
      expect(useXtdhGrantsSearchQuery).toHaveBeenLastCalledWith(
        expect.objectContaining({
          grantor: null,
          targetCollectionName: null,
          statuses: [ApiXTdhGrantStatus.Pending],
        })
      );
      expect(
        screen.getByRole("status", { name: "Selected grant" })
      ).toHaveTextContent("none");
    }
  );

  it.each([false, true])(
    "focuses the selected grant after the finder closes (network=%s)",
    async (networkPresentation) => {
      const user = userEvent.setup();
      render(<TestEditor networkPresentation={networkPresentation} />);
      const selection = screen.getByRole("group", {
        name: "xTDH Grant Beneficiary",
      });
      expect(selection).not.toHaveFocus();
      expect(
        screen.queryByRole("button", { name: "Clear filters" })
      ).not.toBeInTheDocument();

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
      expect(selection).toHaveFocus();
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

      expect(
        screen.getByRole("button", { name: "Change grant" })
      ).toHaveFocus();
      await user.click(screen.getByRole("button", { name: "Change grant" }));
      // Reselecting the same grant still transfers focus from the removed row.
      await user.click(screen.getByRole("button", { name: "Select grant-1" }));
      expect(selection).toHaveFocus();
      await user.click(screen.getByRole("button", { name: "Remove grant" }));
      expect(selection).not.toHaveFocus();

      expect(
        screen.getByRole("status", { name: "Selected grant" })
      ).toHaveTextContent("none");
      expect(screen.getByText("Grantor search")).toBeInTheDocument();
      expect(
        screen.queryByText("Selected grant grant-1")
      ).not.toBeInTheDocument();
    }
  );
});

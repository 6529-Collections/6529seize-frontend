import React from "react";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import GroupMembersPreviewDialog from "@/components/groups/members/GroupMembersPreviewDialog";
import GroupMembersPreviewTrigger from "@/components/groups/members/GroupMembersPreviewTrigger";
import type { ApiCommunityMembersPage } from "@/generated/models/ApiCommunityMembersPage";
import type { ApiCreateGroupDescription } from "@/generated/models/ApiCreateGroupDescription";
import type { ApiGroupFull } from "@/generated/models/ApiGroupFull";
import { ApiGroupBeneficiaryGrantMatchMode } from "@/generated/models/ApiGroupBeneficiaryGrantMatchMode";
import { ApiGroupFilterDirection } from "@/generated/models/ApiGroupFilterDirection";
import { ApiGroupTdhInclusionStrategy } from "@/generated/models/ApiGroupTdhInclusionStrategy";
import { fetchGroupMembersPage } from "@/services/api/group-members-api";
import { renderWithQueryClient } from "@/__tests__/utils/reactQuery";

jest.mock("@/services/api/group-members-api", () => {
  const actual = jest.requireActual("@/services/api/group-members-api");
  return {
    ...actual,
    fetchGroupMembersPage: jest.fn(),
  };
});

jest.mock("@/components/mobile-wrapper-dialog/MobileWrapperDialog", () => ({
  __esModule: true,
  default: ({
    title,
    children,
    zIndexClassName,
  }: {
    title: string;
    children: React.ReactNode;
    zIndexClassName?: string;
  }) => (
    <div role="dialog" aria-label={title} data-z-index-class={zIndexClassName}>
      {children}
    </div>
  ),
}));

jest.mock("@/components/groups/page/list/card/GroupCardConfigs", () => ({
  __esModule: true,
  default: () => <div>Saved criteria</div>,
}));

const draftGroup: ApiCreateGroupDescription = {
  tdh: {
    min: 10,
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
  identity_addresses: null,
  excluded_identity_addresses: null,
  is_beneficiary_of_grant_id: null,
  is_beneficiary_of_grant_match_mode:
    ApiGroupBeneficiaryGrantMatchMode.AnyToken,
};

const group = {
  id: "group-1",
  name: "Collectors",
  group: {
    tdh: draftGroup.tdh,
    rep: draftGroup.rep,
    cic: draftGroup.cic,
    level: draftGroup.level,
    owns_nfts: draftGroup.owns_nfts,
    identity_group_id: "included-group",
    identity_group_identities_count: 4,
    excluded_identity_group_id: "excluded-group",
    excluded_identity_group_identities_count: 1,
    is_beneficiary_of_grant: null,
  },
} as ApiGroupFull;

const membersPage: ApiCommunityMembersPage = {
  count: 21,
  page: 1,
  next: true,
  data: [
    {
      display: "alpha",
      detail_view_key: "alpha",
      level: 42,
      tdh: 100,
      tdh_rate: 1,
      xtdh: 25,
      xtdh_rate: 1,
      xtdh_outgoing: 0,
      xtdh_incoming: 25,
      combined_tdh: 125,
      combined_tdh_rate: 2,
      rep: 12,
      cic: 7,
      pfp: null,
      last_activity: null,
      wallet: "0x1111111111111111111111111111111111111111",
    },
  ],
};

describe("group member preview", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (fetchGroupMembersPage as jest.Mock).mockResolvedValue(membersPage);
  });

  it("shows a saved group's current count and opens explicitly", async () => {
    const user = userEvent.setup();
    const onOpen = jest.fn();
    renderWithQueryClient(
      <GroupMembersPreviewTrigger
        target={{ kind: "saved", group }}
        onOpen={onOpen}
      />
    );

    expect(await screen.findByText("21 users")).toBeInTheDocument();
    const criteria = screen.getByText(
      "TDH + xTDH at least 10, 4 explicitly included users, and 1 explicitly excluded user"
    );
    expect(criteria).toHaveAttribute("aria-live", "polite");
    await user.click(screen.getByRole("button", { name: "View members" }));
    expect(onOpen).toHaveBeenCalledTimes(1);
  });

  it("uses the singular user label for one member", async () => {
    (fetchGroupMembersPage as jest.Mock).mockResolvedValueOnce({
      ...membersPage,
      count: 1,
    });

    renderWithQueryClient(
      <GroupMembersPreviewTrigger
        target={{ kind: "saved", group }}
        onOpen={jest.fn()}
      />
    );

    expect(await screen.findByText("1 user")).toBeInTheDocument();
  });

  it("renders the user count itself as the summary action", async () => {
    const user = userEvent.setup();
    const onOpen = jest.fn();
    renderWithQueryClient(
      <GroupMembersPreviewTrigger
        target={{ kind: "saved", group }}
        appearance="summary"
        onOpen={onOpen}
      />
    );

    const countButton = await screen.findByRole("button", {
      name: "View members: 21 users",
    });
    expect(countButton).toHaveTextContent("21 users");
    expect(
      screen.getByText(
        "TDH + xTDH at least 10, 4 explicitly included users, and 1 explicitly excluded user"
      )
    ).toBeInTheDocument();
    expect(screen.queryByText("View members")).not.toBeInTheDocument();
    await user.click(countButton);
    expect(onOpen).toHaveBeenCalledTimes(1);
  });

  it("loads a draft count for a summary action", async () => {
    renderWithQueryClient(
      <GroupMembersPreviewTrigger
        target={{
          kind: "draft",
          group: draftGroup,
          name: "Only me",
          summary: "Only me",
        }}
        appearance="summary"
        onOpen={jest.fn()}
      />
    );

    expect(
      await screen.findByRole("button", {
        name: "View members: 21 users",
      })
    ).toBeVisible();
    expect(screen.getByText("Only me")).toBeInTheDocument();
    expect(fetchGroupMembersPage).toHaveBeenCalledWith(
      expect.objectContaining({
        target: expect.objectContaining({ kind: "draft", group: draftGroup }),
      })
    );
  });

  it("loads, searches, and paginates saved group members", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(
      <GroupMembersPreviewDialog
        target={{ kind: "saved", group }}
        roleLabel="Who can vote"
        onClose={jest.fn()}
      />
    );

    const dialog = screen.getByRole("dialog", {
      name: "Who can vote: Collectors",
    });
    expect(dialog).toBeInTheDocument();
    expect(dialog).toHaveAttribute("data-z-index-class", "tw-z-[10000]");
    expect(screen.getByLabelText("Find an identity")).toHaveAttribute(
      "maxlength",
      "200"
    );
    expect(await screen.findByText("alpha")).toBeInTheDocument();
    const membersList = screen.getByRole("list", {
      name: "Current group members",
    });
    expect(membersList.parentElement).toHaveClass("tw-overflow-y-auto");
    expect(membersList.parentElement?.parentElement).toHaveClass(
      "tw-min-h-0",
      "tw-flex-1"
    );
    expect(screen.getByText("21 users")).toBeInTheDocument();

    await user.type(screen.getByLabelText("Find an identity"), "alice");
    await waitFor(
      () => {
        expect(fetchGroupMembersPage).toHaveBeenLastCalledWith(
          expect.objectContaining({
            params: expect.objectContaining({
              param: "alice",
            }),
            target: expect.objectContaining({ kind: "saved" }),
          })
        );
      },
      { timeout: 1500 }
    );

    await user.click(screen.getByRole("button", { name: "Next" }));
    await waitFor(() => {
      expect(fetchGroupMembersPage).toHaveBeenLastCalledWith(
        expect.objectContaining({
          params: expect.objectContaining({ page: 2 }),
        })
      );
    });
  });

  it("previews a draft through the read-only draft endpoint", async () => {
    renderWithQueryClient(
      <GroupMembersPreviewDialog
        target={{
          kind: "draft",
          group: draftGroup,
          name: "Draft voters",
          summary: "1 rule",
        }}
        roleLabel="Who can vote"
        onClose={jest.fn()}
      />
    );

    expect(await screen.findByText("alpha")).toBeInTheDocument();
    expect(fetchGroupMembersPage).toHaveBeenCalledWith(
      expect.objectContaining({
        target: expect.objectContaining({ kind: "draft", group: draftGroup }),
      })
    );
  });

  it("keeps the preview usable when a restored group has no criteria", async () => {
    const restoredLegacyGroup = {
      id: "legacy-group",
    } as ApiGroupFull;

    renderWithQueryClient(
      <GroupMembersPreviewDialog
        target={{ kind: "saved", group: restoredLegacyGroup }}
        roleLabel="Visibility"
        onClose={jest.fn()}
      />
    );

    expect(await screen.findByText("alpha")).toBeInTheDocument();
    expect(
      screen.getByRole("dialog", { name: "Visibility: Selected group" })
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Group criteria aren't available, but you can still inspect the current members below."
      )
    ).toBeInTheDocument();
    expect(screen.queryByText("Saved criteria")).not.toBeInTheDocument();
  });
});

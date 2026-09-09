import WaveRulesGroupMembersLink from "@/components/waves/specs/WaveRulesGroupMembersLink";
import { createDeferredPromise } from "@/__tests__/utils/deferredPromise";
import { renderWithQueryClient } from "@/__tests__/utils/reactQuery";
import { fetchSavedGroupMembersPage } from "@/services/api/group-members-api";
import { commonApiFetch } from "@/services/api/common-api";
import { screen } from "@testing-library/react";
import type Link from "next/link";
import type { ComponentProps } from "react";

jest.mock("@/services/api/group-members-api", () => ({
  fetchSavedGroupMembersPage: jest.fn(),
}));

jest.mock("@/services/api/common-api", () => ({
  commonApiFetch: jest.fn(),
}));

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ children, href, ...props }: ComponentProps<typeof Link>) => (
    <a href={href.toString()} {...props}>
      {children}
    </a>
  ),
}));

describe("WaveRulesGroupMembersLink", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(fetchSavedGroupMembersPage).mockResolvedValue({
      count: 365,
      page: 1,
      next: false,
      data: [],
    });
    jest.mocked(commonApiFetch).mockResolvedValue({
      id: "group-1",
      name: "Generated group name",
      group: {
        tdh: { min: null, max: null, inclusion_strategy: "BOTH" },
        rep: {
          min: 12,
          max: null,
          category: null,
          user_identity: null,
          direction: "RECEIVED",
        },
        cic: {
          min: 3,
          max: null,
          user_identity: "punk6529",
          direction: "RECEIVED",
        },
        level: { min: null, max: null },
        owns_nfts: [],
        identity_group_id: "included-group",
        identity_group_identities_count: 4,
        excluded_identity_group_id: "excluded-group",
        excluded_identity_group_identities_count: 1,
        is_beneficiary_of_grant_id: null,
        is_beneficiary_of_grant_match_mode: "ANY_TOKEN",
        is_beneficiary_of_grant: null,
      },
    });
  });

  it("shows the user count without changing the group destination", async () => {
    renderWithQueryClient(
      <WaveRulesGroupMembersLink
        groupId="group-1"
        groupName="Generated group name"
        href="/network?page=1&group=group-1"
        linkLabel="Inspect Generated group name group criteria and members"
      />
    );

    await screen.findByText("365 users");
    const criteria = await screen.findByText(
      "REP at least 12, NIC from punk6529 at least 3, 4 explicitly included users, and 1 explicitly excluded user"
    );
    expect(criteria).toHaveAttribute("aria-live", "polite");
    const link = screen.getByRole("link", {
      name: "Inspect Generated group name group criteria and members: 365 users",
    });
    expect(link).toHaveTextContent("365 users");
    expect(link).toHaveAttribute("href", "/network?page=1&group=group-1");
    expect(link).toHaveAttribute("title", "Generated group name");
    expect(fetchSavedGroupMembersPage).toHaveBeenCalledWith(
      expect.objectContaining({
        groupId: "group-1",
        params: { page: 1, pageSize: 1 },
      })
    );
  });

  it("does not show the previous group count while a new group loads", async () => {
    const nextMembers = createDeferredPromise<{
      count: number;
      page: number;
      next: boolean;
      data: never[];
    }>();
    jest
      .mocked(fetchSavedGroupMembersPage)
      .mockResolvedValueOnce({ count: 365, page: 1, next: false, data: [] })
      .mockReturnValueOnce(nextMembers.promise);

    const { rerender } = renderWithQueryClient(
      <WaveRulesGroupMembersLink
        groupId="group-1"
        groupName="First group"
        href="/network?page=1&group=group-1"
      />
    );
    await screen.findByText("365 users");

    rerender(
      <WaveRulesGroupMembersLink
        groupId="group-2"
        groupName="Second group"
        href="/network?page=1&group=group-2"
      />
    );

    expect(screen.queryByText("365 users")).not.toBeInTheDocument();

    nextMembers.resolve({
      count: 7,
      page: 1,
      next: false,
      data: [],
    });
    await screen.findByText("7 users");
  });
});

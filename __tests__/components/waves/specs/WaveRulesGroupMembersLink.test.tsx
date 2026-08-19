import WaveRulesGroupMembersLink from "@/components/waves/specs/WaveRulesGroupMembersLink";
import { renderWithQueryClient } from "@/__tests__/utils/reactQuery";
import { fetchSavedGroupMembersPage } from "@/services/api/group-members-api";
import { screen } from "@testing-library/react";
import type Link from "next/link";
import type { ComponentProps } from "react";

jest.mock("@/services/api/group-members-api", () => ({
  fetchSavedGroupMembersPage: jest.fn(),
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
  });

  it("shows the eligible count without changing the group destination", async () => {
    renderWithQueryClient(
      <WaveRulesGroupMembersLink
        groupId="group-1"
        groupName="Generated group name"
        href="/network?page=1&group=group-1"
        linkLabel="Inspect Generated group name group criteria and members"
      />
    );

    await screen.findByText("365 currently eligible");
    const link = screen.getByRole("link", {
      name: "Inspect Generated group name group criteria and members",
    });
    expect(link).toHaveTextContent("365 currently eligible");
    expect(link).toHaveAttribute("href", "/network?page=1&group=group-1");
    expect(link).toHaveAttribute("title", "Generated group name");
    expect(fetchSavedGroupMembersPage).toHaveBeenCalledWith(
      expect.objectContaining({
        groupId: "group-1",
        params: { page: 1, pageSize: 1 },
      })
    );
  });
});

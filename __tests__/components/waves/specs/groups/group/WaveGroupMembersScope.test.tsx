import { render, screen } from "@testing-library/react";
import WaveGroupMembersScope from "@/components/waves/specs/groups/group/WaveGroupMembersScope";

jest.mock("@/components/waves/specs/WaveRulesGroupMembersLink", () => ({
  __esModule: true,
  default: ({
    groupId,
    groupName,
    href,
    linkLabel,
  }: {
    groupId: string;
    groupName: string;
    href: string;
    linkLabel: string;
  }) => (
    <a
      href={href}
      aria-label={linkLabel}
      data-testid="members-summary"
      data-group-id={groupId}
    >
      {groupName} members
    </a>
  ),
}));
jest.mock("@/components/waves/specs/groups/group/WaveGroupScope", () => () => (
  <span data-testid="fallback-scope" />
));

describe("WaveGroupMembersScope", () => {
  it("renders the member count and criteria presentation", () => {
    render(
      <WaveGroupMembersScope
        group={{ id: "1", name: "Group", is_hidden: false }}
      />
    );

    const summary = screen.getByTestId("members-summary");
    expect(summary).toHaveAttribute("href", "/network?page=1&group=1");
    expect(summary).toHaveAttribute("data-group-id", "1");
    expect(summary).toHaveAccessibleName(
      "Inspect Group group criteria and members"
    );
  });

  it("renders the member count and criteria for an available direct-message group", () => {
    render(
      <WaveGroupMembersScope
        group={{
          id: "dm-1",
          name: "Direct message group",
          is_hidden: false,
          is_direct_message: true,
        }}
      />
    );

    const summary = screen.getByTestId("members-summary");
    expect(summary).toHaveAttribute("href", "/network?page=1&group=dm-1");
    expect(summary).toHaveAttribute("data-group-id", "dm-1");
    expect(screen.queryByTestId("fallback-scope")).not.toBeInTheDocument();
  });

  it("preserves the private fallback for a hidden direct-message group", () => {
    render(
      <WaveGroupMembersScope
        group={{
          is_hidden: true,
          is_direct_message: true,
        }}
      />
    );

    expect(screen.getByTestId("fallback-scope")).toBeInTheDocument();
    expect(screen.queryByTestId("members-summary")).not.toBeInTheDocument();
  });

  it("preserves the private and unavailable scope fallbacks", () => {
    render(<WaveGroupMembersScope group={{ is_hidden: true }} />);

    expect(screen.getByTestId("fallback-scope")).toBeInTheDocument();
    expect(screen.queryByTestId("members-summary")).not.toBeInTheDocument();
  });
});

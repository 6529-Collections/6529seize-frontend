import { render, screen } from "@testing-library/react";
import WaveGroupMembersScope from "@/components/waves/specs/groups/group/WaveGroupMembersScope";

jest.mock("@/components/waves/specs/WaveRulesGroupMembersLink", () => ({
  __esModule: true,
  default: ({ groupId }: { groupId: string }) => (
    <span data-testid="members-summary" data-group-id={groupId}>
      12 users
    </span>
  ),
}));

describe("WaveGroupMembersScope", () => {
  it("renders the member count and criteria for a visible group with just an ID", () => {
    render(<WaveGroupMembersScope group={{ id: "1", is_hidden: false }} />);

    const summary = screen.getByTestId("members-summary");
    expect(summary).toHaveAttribute("data-group-id", "1");
    expect(summary).toHaveTextContent("12 users");
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
    expect(summary).toHaveAttribute("data-group-id", "dm-1");
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

    expect(screen.getByText("Private group")).toBeInTheDocument();
    expect(screen.queryByTestId("members-summary")).not.toBeInTheDocument();
  });

  it("preserves the unavailable fallback when the group has no ID", () => {
    render(<WaveGroupMembersScope group={{ is_hidden: false }} />);

    expect(screen.getByText("Group unavailable")).toBeInTheDocument();
    expect(screen.queryByTestId("members-summary")).not.toBeInTheDocument();
  });

  it("preserves the private fallback for a hidden community group", () => {
    render(<WaveGroupMembersScope group={{ is_hidden: true }} />);

    expect(screen.getByText("Private group")).toBeInTheDocument();
    expect(screen.queryByTestId("members-summary")).not.toBeInTheDocument();
  });
});

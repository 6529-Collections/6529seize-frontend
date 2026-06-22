import { render, screen } from "@testing-library/react";
import { UserPageXtdhGrantedListContent } from "@/components/user/xtdh/granted-list/UserPageXtdhGrantedListContent";
import type { ApiXTdhGrant } from "@/generated/models/ApiXTdhGrant";

describe("UserPageXtdhGrantedListContent", () => {
  const baseProps = {
    enabled: true,
    isLoading: false,
    isError: false,
    errorMessage: undefined,
    grants: [] as ApiXTdhGrant[],
    isSelf: false,
    onRetry: jest.fn(),
  };

  it("shows filter-specific empty state when a status filter is active", () => {
    render(
      <UserPageXtdhGrantedListContent
        {...baseProps}
        statuses={["PENDING"]}
      />
    );

    expect(
      screen.getByText("No pending grants found. Try a different filter.")
    ).toBeInTheDocument();
  });

  it("falls back to the default empty state when no status filter is applied", () => {
    render(
      <UserPageXtdhGrantedListContent
        {...baseProps}
        statuses={["ALL"]}
      />
    );

    expect(
      screen.getByText(
        "This identity hasn't granted any xTDH yet.",
        { exact: false }
      )
    ).toBeInTheDocument();
  });
});

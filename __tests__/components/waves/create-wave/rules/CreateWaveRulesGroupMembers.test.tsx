import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import CreateWaveRulesGroupMembers from "@/components/waves/create-wave/rules/CreateWaveRulesGroupMembers";
import type { ApiGroupFull } from "@/generated/models/ApiGroupFull";
import { commonApiFetch } from "@/services/api/common-api";

jest.mock("@/services/api/common-api", () => ({
  commonApiFetch: jest.fn(),
}));

jest.mock(
  "@/components/groups/members/GroupMembersPreviewTrigger",
  () =>
    function MockGroupMembersPreviewTrigger(): ReactNode {
      return <button type="button">View members</button>;
    }
);

jest.mock(
  "@/components/groups/members/GroupMembersPreviewDialog",
  () =>
    function MockGroupMembersPreviewDialog(): ReactNode {
      return <div role="dialog">Members</div>;
    }
);

const mockedCommonApiFetch = jest.mocked(commonApiFetch);
const group = {
  id: "saved-group",
  name: "Saved group",
} as ApiGroupFull;

const renderComponent = (component: ReactNode) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>{component}</QueryClientProvider>
  );
};

describe("CreateWaveRulesGroupMembers", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("restores a saved group before exposing its member preview", async () => {
    mockedCommonApiFetch.mockResolvedValue(group);

    renderComponent(
      <CreateWaveRulesGroupMembers
        groupId={group.id}
        cachedGroup={undefined}
        roleLabel="Visibility"
      />
    );

    expect(screen.getByRole("status")).toHaveTextContent(
      "Checking current audience"
    );
    expect(
      await screen.findByRole("button", { name: "View members" })
    ).toBeVisible();
    expect(mockedCommonApiFetch).toHaveBeenCalledWith({
      endpoint: "groups/saved-group",
    });
  });

  it("fails closed when the saved group cannot be restored", async () => {
    mockedCommonApiFetch.mockRejectedValue(new Error("not found"));

    renderComponent(
      <CreateWaveRulesGroupMembers
        groupId={group.id}
        cachedGroup={undefined}
        roleLabel="Visibility"
      />
    );

    expect(
      await screen.findByText("Current audience unavailable")
    ).toBeVisible();
    expect(
      screen.queryByRole("button", { name: "View members" })
    ).not.toBeInTheDocument();
  });

  it("uses a cached group without another request", () => {
    renderComponent(
      <CreateWaveRulesGroupMembers
        groupId={group.id}
        cachedGroup={group}
        roleLabel="Visibility"
      />
    );

    expect(screen.getByRole("button", { name: "View members" })).toBeVisible();
    expect(mockedCommonApiFetch).not.toHaveBeenCalled();
  });
});

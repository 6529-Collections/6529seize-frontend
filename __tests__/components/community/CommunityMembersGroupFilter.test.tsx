import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CommunityMembersGroupFilter from "@/components/community/CommunityMembersGroupFilter";
import { AuthContext } from "@/components/auth/Auth";
import { ReactQueryWrapperContext } from "@/components/react-query-wrapper/ReactQueryWrapper";
import type { ApiCreateGroup } from "@/generated/models/ApiCreateGroup";
import type { ApiGroupFull } from "@/generated/models/ApiGroupFull";
import { useGroupCriteria } from "@/hooks/groups/useGroupCriteria";
import { useGroupMutations } from "@/hooks/groups/useGroupMutations";

const group = {
  id: "group-1",
  name: "Existing group",
  created_by: { handle: "builder" },
} as ApiGroupFull;
const createdGroup = {
  id: "created-group",
  name: "Network filter",
  created_by: { handle: "viewer" },
} as ApiGroupFull;
const draft = { name: "Network filter", group: {} } as ApiCreateGroup;

let assignmentPanelProps: any = null;

jest.mock("@/components/groups/assignment/GroupAssignmentPanel", () => ({
  __esModule: true,
  default: (props: any) => {
    assignmentPanelProps = props;
    return (
      <div data-testid="group-assignment-panel">
        <button
          type="button"
          onClick={async () => {
            const created = await props.onCreateGroup(draft);
            if (created) {
              props.onChange(created);
            }
          }}
        >
          Create filter group
        </button>
        <button type="button" onClick={() => props.onChange(group)}>
          Choose existing group
        </button>
        <button type="button" onClick={() => props.onChange(null)}>
          Clear group filter
        </button>
      </div>
    );
  },
}));

jest.mock(
  "@/components/distribution-plan-tool/common/CircleLoader",
  () => () => <div data-testid="loader" />
);
jest.mock("@/hooks/groups/useGroupCriteria", () => ({
  useGroupCriteria: jest.fn(),
}));
jest.mock("@/hooks/groups/useGroupMutations", () => ({
  useGroupMutations: jest.fn(),
}));

const useGroupCriteriaMock = useGroupCriteria as jest.Mock;
const useGroupMutationsMock = useGroupMutations as jest.Mock;
const submit = jest.fn();
const setToast = jest.fn();
const onGroupChange = jest.fn();

function renderFilter(activeGroupId: string | null = null) {
  return render(
    <AuthContext.Provider
      value={
        {
          connectedProfile: { handle: "viewer" },
          requestAuth: jest.fn(),
          setToast,
        } as any
      }
    >
      <ReactQueryWrapperContext.Provider
        value={{ onGroupCreate: jest.fn() } as any}
      >
        <CommunityMembersGroupFilter
          activeGroupId={activeGroupId}
          onGroupChange={onGroupChange}
        />
      </ReactQueryWrapperContext.Provider>
    </AuthContext.Provider>
  );
}

describe("CommunityMembersGroupFilter", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    assignmentPanelProps = null;
    useGroupCriteriaMock.mockReturnValue({
      criteria: {
        group: null,
        includedWallets: [],
        excludedWallets: [],
      },
      isLoading: false,
      isError: false,
      retry: jest.fn(),
    });
    useGroupMutationsMock.mockReturnValue({ submit });
  });

  it("opens directly in the shared criteria builder", () => {
    renderFilter();

    expect(screen.getByTestId("group-assignment-panel")).toBeInTheDocument();
    expect(assignmentPanelProps).toEqual(
      expect.objectContaining({
        selectedGroup: null,
        selectedGroupIncludedWallets: [],
        selectedGroupExcludedWallets: [],
        startMode: "criteria",
        allowGroupClear: true,
        defaultLabel: "All Network members",
      })
    );
  });

  it("prefills an active group's criteria and identity lists", () => {
    useGroupCriteriaMock.mockReturnValue({
      criteria: {
        group,
        includedWallets: ["0xaaa"],
        excludedWallets: ["0xbbb"],
      },
      isLoading: false,
      isError: false,
      retry: jest.fn(),
    });

    renderFilter("group-1");

    expect(useGroupCriteriaMock).toHaveBeenCalledWith("group-1");
    expect(assignmentPanelProps).toEqual(
      expect.objectContaining({
        selectedGroup: group,
        selectedGroupIncludedWallets: ["0xaaa"],
        selectedGroupExcludedWallets: ["0xbbb"],
      })
    );
  });

  it("creates a group and applies it as the Network filter", async () => {
    const user = userEvent.setup();
    submit.mockResolvedValue({
      ok: true,
      group: createdGroup,
      published: true,
    });
    renderFilter();

    await user.click(
      screen.getByRole("button", { name: "Create filter group" })
    );

    await waitFor(() => {
      expect(submit).toHaveBeenCalledWith({
        payload: draft,
        currentHandle: "viewer",
      });
    });
    expect(onGroupChange).toHaveBeenCalledWith(createdGroup);
    expect(setToast).toHaveBeenCalledWith({
      message: "Group created and applied as the Network filter.",
      type: "success",
    });
  });

  it("shows the structured create-group error toast", async () => {
    const user = userEvent.setup();
    submit.mockResolvedValue({
      ok: false,
      reason: "request",
      error: "Backend refused the group.",
    });
    renderFilter();

    await user.click(
      screen.getByRole("button", { name: "Create filter group" })
    );

    await waitFor(() => {
      expect(setToast).toHaveBeenCalledWith({
        type: "error",
        title: "Couldn't create this group.",
        description: "Please check the group setup and try again.",
        details: "Backend refused the group.",
      });
    });
    expect(onGroupChange).not.toHaveBeenCalled();
  });

  it("applies or clears an existing group without creating one", async () => {
    const user = userEvent.setup();
    renderFilter();

    await user.click(
      screen.getByRole("button", { name: "Choose existing group" })
    );
    await user.click(
      screen.getByRole("button", { name: "Clear group filter" })
    );

    expect(onGroupChange).toHaveBeenNthCalledWith(1, group);
    expect(onGroupChange).toHaveBeenNthCalledWith(2, null);
    expect(submit).not.toHaveBeenCalled();
  });

  it("shows loading and recoverable error states", async () => {
    const retry = jest.fn();
    useGroupCriteriaMock.mockReturnValue({
      criteria: null,
      isLoading: true,
      isError: false,
      retry,
    });
    const { rerender } = renderFilter("group-1");

    expect(screen.getByTestId("loader")).toBeInTheDocument();
    expect(
      screen.queryByTestId("group-assignment-panel")
    ).not.toBeInTheDocument();

    useGroupCriteriaMock.mockReturnValue({
      criteria: null,
      isLoading: false,
      isError: true,
      retry,
    });
    rerender(
      <AuthContext.Provider value={{} as any}>
        <ReactQueryWrapperContext.Provider value={{} as any}>
          <CommunityMembersGroupFilter
            activeGroupId="group-1"
            onGroupChange={onGroupChange}
          />
        </ReactQueryWrapperContext.Provider>
      </AuthContext.Provider>
    );

    await userEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(retry).toHaveBeenCalled();
  });
});

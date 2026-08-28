import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import CreateWaveGroup from "@/components/waves/create-wave/groups/CreateWaveGroup";
import type CreateWaveGroupInlinePanel from "@/components/waves/create-wave/groups/CreateWaveGroupInlinePanel";
import type { WaveGroupsConfig } from "@/types/waves.types";
import { CreateWaveGroupConfigType } from "@/types/waves.types";
import { ApiWaveType } from "@/generated/models/ApiWaveType";
import type { ApiGroupFull } from "@/generated/models/ApiGroupFull";
import { commonApiFetch } from "@/services/api/common-api";

type InlinePanelProps = React.ComponentProps<typeof CreateWaveGroupInlinePanel>;

let inlinePanelProps: InlinePanelProps | null;

jest.mock("@/services/api/common-api", () => ({
  commonApiFetch: jest.fn(),
}));

jest.mock("@/components/auth/Auth", () => ({
  useAuth: () => ({
    connectedProfile: {
      id: "creator-profile",
      handle: "creator",
      normalised_handle: "creator",
      primary_wallet: "0xcreator",
      display: "Creator",
      tdh: 42,
      level: 3,
      cic: 5,
      pfp: "creator.png",
    },
  }),
}));

jest.mock("@/components/waves/create-wave/utils/CreateWaveToggle", () => {
  return function CreateWaveToggle({
    enabled,
    onChange,
    label,
    displayLabel,
  }: {
    enabled: boolean;
    onChange: (value: boolean) => void;
    label: string;
    displayLabel?: boolean;
  }) {
    return (
      <div data-testid="wave-toggle">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(event) => onChange(event.target.checked)}
          aria-label={label}
        />
        {displayLabel && <label>{label}</label>}
      </div>
    );
  };
});

jest.mock(
  "@/components/waves/create-wave/groups/CreateWaveGroupInlinePanel",
  () =>
    function MockCreateWaveGroupInlinePanel(props: InlinePanelProps) {
      inlinePanelProps = props;
      return (
        <div data-testid="inline-panel">
          {props.selectedGroup?.name ?? "none"}
        </div>
      );
    }
);

describe("CreateWaveGroup", () => {
  const mockOnGroupSelect = jest.fn();
  const mockOnCriteriaReplacementChange = jest.fn();
  const mockOnGroupResolutionChange = jest.fn();
  const mockSetChatEnabled = jest.fn();
  const mockSetDropsAdminCanDelete = jest.fn();
  const mockOnInlineGroupCreate = jest.fn();
  const mockedCommonApiFetch = commonApiFetch as jest.MockedFunction<
    typeof commonApiFetch
  >;

  const exampleGroup: ApiGroupFull = {
    id: "group-1",
    name: "Alpha Group",
    group: {
      tdh: { min: null, max: null, inclusion_strategy: "BOTH" },
      rep: {
        min: null,
        max: null,
        direction: "RECEIVED",
        user_identity: null,
        category: null,
      },
      cic: {
        min: null,
        max: null,
        direction: "RECEIVED",
        user_identity: null,
      },
      level: { min: null, max: null },
      owns_nfts: [],
      identity_group_id: null,
      identity_group_identities_count: 0,
      excluded_identity_group_id: null,
      excluded_identity_group_identities_count: 0,
      is_beneficiary_of_grant_id: null,
      is_beneficiary_of_grant_match_mode: "ANY_TOKEN",
      is_beneficiary_of_grant: null,
    },
    is_private: false,
    created_by: {
      id: "creator-1",
      handle: "alpha",
      wallet: "0xalpha",
    },
  } as unknown as ApiGroupFull;

  const defaultGroups: WaveGroupsConfig = {
    admin: null,
    canView: null,
    canDrop: null,
    canVote: null,
    canChat: null,
  };

  const defaultProps = {
    waveName: "Test Wave",
    waveType: ApiWaveType.Approve,
    groupType: CreateWaveGroupConfigType.CAN_DROP,
    chatEnabled: true,
    adminCanDeleteDrops: false,
    setChatEnabled: mockSetChatEnabled,
    onGroupSelect: mockOnGroupSelect,
    onCriteriaReplacementChange: mockOnCriteriaReplacementChange,
    onGroupResolutionChange: mockOnGroupResolutionChange,
    onInlineGroupCreate: mockOnInlineGroupCreate,
    groupsCache: {},
    groups: defaultGroups,
    setDropsAdminCanDelete: mockSetDropsAdminCanDelete,
    errorMessage: null,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockedCommonApiFetch.mockReset();
    inlinePanelProps = null;
  });

  const renderComponent = (props = {}) => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    return render(
      <QueryClientProvider client={queryClient}>
        <CreateWaveGroup {...defaultProps} {...props} />
      </QueryClientProvider>
    );
  };

  it("shows the scope title", () => {
    renderComponent();
    expect(screen.getByText("Who can drop")).toBeInTheDocument();
  });

  it.each([
    [CreateWaveGroupConfigType.CAN_VIEW, "Visibility"],
    [CreateWaveGroupConfigType.ADMIN, "Admins"],
  ])("shows the updated %s scope title", (groupType, label) => {
    renderComponent({ groupType });
    expect(screen.getByText(label)).toBeInTheDocument();
  });

  it("passes the resolved selected group to the inline panel", () => {
    renderComponent({
      groups: {
        ...defaultGroups,
        canDrop: exampleGroup.id,
      },
      groupsCache: {
        [exampleGroup.id]: exampleGroup,
      },
    });

    expect(screen.getByTestId("inline-panel")).toHaveTextContent("Alpha Group");
    expect(inlinePanelProps?.selectedGroup).toEqual(exampleGroup);
    expect(mockedCommonApiFetch).not.toHaveBeenCalled();
  });

  it("fetches a selected group's details when a resumed draft has only its id", async () => {
    mockedCommonApiFetch.mockResolvedValue(exampleGroup);

    renderComponent({
      groups: {
        ...defaultGroups,
        canDrop: exampleGroup.id,
      },
    });

    await waitFor(() =>
      expect(screen.getByTestId("inline-panel")).toHaveTextContent(
        "Alpha Group"
      )
    );
    expect(mockedCommonApiFetch).toHaveBeenCalledWith(
      expect.objectContaining({
        endpoint: "groups/group-1",
      })
    );
    expect(mockOnGroupResolutionChange.mock.calls).toEqual([[true], [false]]);
    expect(inlinePanelProps?.selectedGroup).toEqual(exampleGroup);
  });

  it("restores included and excluded identity wallets for editing", async () => {
    const groupWithIdentityLists = {
      ...exampleGroup,
      group: {
        ...exampleGroup.group,
        identity_group_id: "included-list",
        identity_group_identities_count: 1,
        excluded_identity_group_id: "excluded-list",
        excluded_identity_group_identities_count: 1,
      },
    };
    mockedCommonApiFetch.mockImplementation(async ({ endpoint }) => {
      if (endpoint.endsWith("/identity_groups/included-list")) {
        return ["0xincluded"];
      }
      if (endpoint.endsWith("/identity_groups/excluded-list")) {
        return ["0xexcluded"];
      }
      throw new Error(`Unexpected endpoint: ${endpoint}`);
    });

    renderComponent({
      groups: {
        ...defaultGroups,
        canDrop: groupWithIdentityLists.id,
      },
      groupsCache: {
        [groupWithIdentityLists.id]: groupWithIdentityLists,
      },
    });

    await waitFor(() => {
      expect(inlinePanelProps?.selectedGroupIncludedWallets).toEqual([
        "0xincluded",
      ]);
      expect(inlinePanelProps?.selectedGroupExcludedWallets).toEqual([
        "0xexcluded",
      ]);
    });
    expect(mockedCommonApiFetch).toHaveBeenCalledWith(
      expect.objectContaining({
        endpoint: "groups/group-1/identity_groups/included-list",
      })
    );
    expect(mockedCommonApiFetch).toHaveBeenCalledWith(
      expect.objectContaining({
        endpoint: "groups/group-1/identity_groups/excluded-list",
      })
    );
  });

  it("passes the suggested group name and simplified callbacks to the inline panel", () => {
    renderComponent();

    expect(inlinePanelProps?.suggestedName).toBe("Test Wave Who can drop");
    expect(inlinePanelProps?.defaultLabel).toBe("Public");
    inlinePanelProps?.onChange(exampleGroup);
    expect(mockOnGroupResolutionChange).toHaveBeenCalledWith(false);
    expect(mockOnGroupSelect).toHaveBeenCalledWith(exampleGroup);
    expect(inlinePanelProps?.onCriteriaReplacementChange).toBe(
      mockOnCriteriaReplacementChange
    );
    expect(inlinePanelProps?.onCreateGroup).toBe(mockOnInlineGroupCreate);
    expect(inlinePanelProps?.membersRoleLabel).toBe("Who can drop");
    expect(inlinePanelProps?.defaultIncludedIdentity).toMatchObject({
      profile_id: "creator-profile",
      wallet: "0xcreator",
    });
  });

  it("shows the chat toggle for non-chat waves when editing chat scope", async () => {
    const user = userEvent.setup();
    renderComponent({
      groupType: CreateWaveGroupConfigType.CAN_CHAT,
    });

    const chatToggle = screen.getByLabelText("Enable chat");
    await user.click(chatToggle);
    expect(mockSetChatEnabled).toHaveBeenCalledWith(false);
    expect(mockOnCriteriaReplacementChange).toHaveBeenCalledWith(false);
  });

  it("hides the chat toggle for chat waves", () => {
    renderComponent({
      groupType: CreateWaveGroupConfigType.CAN_CHAT,
      waveType: ApiWaveType.Chat,
    });

    expect(screen.queryByTestId("wave-toggle")).not.toBeInTheDocument();
  });

  it("renders the admin delete toggle when editing admin scope", async () => {
    const user = userEvent.setup();
    renderComponent({
      groupType: CreateWaveGroupConfigType.ADMIN,
    });

    await user.click(screen.getByLabelText("Allow admins to delete posts"));
    expect(mockSetDropsAdminCanDelete).toHaveBeenCalledWith(true);
    expect(inlinePanelProps?.defaultMembersPreviewTarget).toMatchObject({
      kind: "draft",
      name: "Only me",
      summary: "Only me",
      group: {
        identity_addresses: ["0xcreator"],
      },
    });
    expect(inlinePanelProps?.defaultLabel).toBe("Only me");
  });

  it("passes disabled to the inline panel when chat is disabled", () => {
    renderComponent({
      groupType: CreateWaveGroupConfigType.CAN_CHAT,
      chatEnabled: false,
    });

    expect(inlinePanelProps?.disabled).toBe(true);
  });

  it("blocks continuation and offers retry when a draft group cannot be restored", async () => {
    mockedCommonApiFetch.mockRejectedValue(new Error("not found"));

    renderComponent({
      groups: {
        ...defaultGroups,
        canDrop: exampleGroup.id,
      },
    });

    expect(
      await screen.findByText(/selected group could not be loaded/i)
    ).toBeVisible();
    expect(mockOnGroupResolutionChange).toHaveBeenCalledWith(true);
    expect(screen.getByRole("group", { name: "Who can drop" })).toHaveAttribute(
      "data-wave-group-invalid",
      "true"
    );

    await userEvent.click(screen.getByRole("button", { name: "Retry group" }));
    await waitFor(() => expect(mockedCommonApiFetch).toHaveBeenCalledTimes(2));
  });

  it("clears failed draft restoration state after the selected group is removed", async () => {
    mockedCommonApiFetch.mockRejectedValue(new Error("not found"));
    renderComponent({
      groups: { ...defaultGroups, canDrop: exampleGroup.id },
    });

    expect(
      await screen.findByText(/selected group could not be loaded/i)
    ).toBeVisible();
    expect(mockOnGroupResolutionChange).toHaveBeenLastCalledWith(true);

    inlinePanelProps?.onChange(null);

    expect(mockOnGroupResolutionChange).toHaveBeenLastCalledWith(false);
    expect(mockOnGroupSelect).toHaveBeenCalledWith(null);
  });

  it("exposes a containment error accessibly", () => {
    renderComponent({
      errorMessage: "Everyone in this group must also be able to view.",
    });

    const group = screen.getByRole("group", { name: "Who can drop" });
    expect(group).toHaveAttribute("data-wave-group-invalid", "true");
    expect(group).toHaveAttribute("tabindex", "-1");
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Everyone in this group must also be able to view."
    );
  });
});

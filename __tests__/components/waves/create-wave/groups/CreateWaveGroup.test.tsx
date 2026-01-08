import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CreateWaveGroup from "@/components/waves/create-wave/groups/CreateWaveGroup";
import type {
  WaveGroupsConfig} from "@/types/waves.types";
import {
  CreateWaveGroupConfigType
} from "@/types/waves.types";
import { ApiWaveType } from "@/generated/models/ApiWaveType";
import type { ApiGroupFull } from "@/generated/models/ApiGroupFull";

jest.mock("@tanstack/react-query", () => {
  const actual = jest.requireActual("@tanstack/react-query");
  return {
    ...actual,
    useQuery: jest.fn(),
  };
});

jest.mock("@/components/waves/create-wave/utils/CreateWaveToggle", () => {
  return function CreateWaveToggle({
    enabled,
    onChange,
    label,
  }: {
    enabled: boolean;
    onChange: (value: boolean) => void;
    label: string;
  }) {
    return (
      <div data-testid="wave-toggle">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(event) => onChange(event.target.checked)}
          aria-label={label}
        />
        <label>{label}</label>
      </div>
    );
  };
});

jest.mock("@/helpers/waves/waves.constants", () => {
  const { CreateWaveGroupConfigType } = jest.requireActual(
    "../../../../../types/waves.types"
  );
  const { ApiWaveType } = jest.requireActual(
    "../../../../../generated/models/ApiWaveType"
  );

  return {
    CREATE_WAVE_NONE_GROUP_LABELS: {
      [CreateWaveGroupConfigType.ADMIN]: "Only me",
      [CreateWaveGroupConfigType.CAN_VIEW]: "Anyone",
      [CreateWaveGroupConfigType.CAN_DROP]: "Anyone",
      [CreateWaveGroupConfigType.CAN_VOTE]: "Anyone",
      [CreateWaveGroupConfigType.CAN_CHAT]: "Anyone",
    },
    CREATE_WAVE_SELECT_GROUP_LABELS: {
      [ApiWaveType.Approve]: {
        [CreateWaveGroupConfigType.ADMIN]: "Admin",
        [CreateWaveGroupConfigType.CAN_VIEW]: "Who can view",
        [CreateWaveGroupConfigType.CAN_DROP]: "Who can drop",
        [CreateWaveGroupConfigType.CAN_VOTE]: "Who can vote",
        [CreateWaveGroupConfigType.CAN_CHAT]: "Who can chat",
      },
      [ApiWaveType.Rank]: {
        [CreateWaveGroupConfigType.ADMIN]: "Admin",
        [CreateWaveGroupConfigType.CAN_VIEW]: "Who can view",
        [CreateWaveGroupConfigType.CAN_DROP]: "Who can drop",
        [CreateWaveGroupConfigType.CAN_VOTE]: "Who can vote",
        [CreateWaveGroupConfigType.CAN_CHAT]: "Who can chat",
      },
      [ApiWaveType.Chat]: {
        [CreateWaveGroupConfigType.ADMIN]: "Admin",
        [CreateWaveGroupConfigType.CAN_VIEW]: "Who can view",
        [CreateWaveGroupConfigType.CAN_DROP]: "Who can drop",
        [CreateWaveGroupConfigType.CAN_VOTE]: "Who can rate",
        [CreateWaveGroupConfigType.CAN_CHAT]: "Who can chat",
      },
    },
  };
});

const { useQuery } = jest.requireMock("@tanstack/react-query");

describe("CreateWaveGroup", () => {
  const mockOnGroupSelect = jest.fn();
  const mockSetChatEnabled = jest.fn();
  const mockSetDropsAdminCanDelete = jest.fn();

  const exampleGroup: ApiGroupFull = {
    id: "group-1",
    name: "Alpha Group",
    description: "Example",
    created_by: {
      id: "creator-1",
      handle: "alpha",
      wallet: "0xalpha",
    },
  } as ApiGroupFull;

  const defaultGroups: WaveGroupsConfig = {
    admin: null,
    canView: null,
    canDrop: null,
    canVote: null,
    canChat: null,
  };

  const defaultProps = {
    waveType: ApiWaveType.Approve,
    groupType: CreateWaveGroupConfigType.CAN_DROP,
    chatEnabled: true,
    adminCanDeleteDrops: false,
    setChatEnabled: mockSetChatEnabled,
    onGroupSelect: mockOnGroupSelect,
    groupsCache: {},
    groups: defaultGroups,
    setDropsAdminCanDelete: mockSetDropsAdminCanDelete,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useQuery as jest.Mock).mockReturnValue({
      data: [exampleGroup],
      isFetching: false,
    });
  });

  const renderComponent = (props = {}) => {
    return render(<CreateWaveGroup {...defaultProps} {...props} />);
  };

  it("shows the scope title", () => {
    renderComponent();
    expect(screen.getByText("Who can drop")).toBeInTheDocument();
  });

  it("renders the search field label", () => {
    renderComponent();
    expect(screen.getByLabelText("Search groups…")).toBeInTheDocument();
  });

  it("shows the chat toggle for non-chat waves when editing chat scope", async () => {
    const user = userEvent.setup();
    renderComponent({
      groupType: CreateWaveGroupConfigType.CAN_CHAT,
    });

    const chatToggle = screen.getByLabelText("Enable chat");
    await user.click(chatToggle);
    expect(mockSetChatEnabled).toHaveBeenCalledWith(false);
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
    const toggle = screen.getByLabelText("Allow admins to delete drops");
    await user.click(toggle);
    expect(mockSetDropsAdminCanDelete).toHaveBeenCalledWith(true);
  });

  it("displays the helper text for defaults", () => {
    renderComponent();
    expect(screen.getByText("Default: Anyone")).toBeInTheDocument();
  });

  it("disables the search input when chat is disabled", () => {
    renderComponent({
      groupType: CreateWaveGroupConfigType.CAN_CHAT,
      chatEnabled: false,
    });
    expect(
      screen.getByLabelText("Search groups…")
    ).toBeDisabled();
  });

  it("pre-populates the field when a selection exists in cache", () => {
    renderComponent({
      groups: {
        ...defaultGroups,
        canDrop: exampleGroup.id,
      },
      groupsCache: {
        [exampleGroup.id]: exampleGroup,
      },
    });

    expect(screen.getByDisplayValue("Alpha Group")).toBeInTheDocument();
    expect(screen.getByText("Selected: Alpha Group")).toBeInTheDocument();
  });

  it("calls onGroupSelect when a suggestion is chosen", async () => {
    const user = userEvent.setup();
    renderComponent();

    await user.click(screen.getByLabelText("Search groups…"));
    await user.click(screen.getByText("Alpha Group"));

    expect(mockOnGroupSelect).toHaveBeenCalledWith(exampleGroup);
  });

  it("clears the selected group when using the clear button", async () => {
    const user = userEvent.setup();
    renderComponent({
      groups: {
        ...defaultGroups,
        canDrop: exampleGroup.id,
      },
      groupsCache: {
        [exampleGroup.id]: exampleGroup,
      },
    });

    const clearButton = screen.getByLabelText("Clear selected group");
    await user.click(clearButton);
    expect(mockOnGroupSelect).toHaveBeenCalledWith(null);
  });

  it("shows an empty state when no groups match", async () => {
    const user = userEvent.setup();
    (useQuery as jest.Mock).mockReturnValue({
      data: [],
      isFetching: false,
    });

    renderComponent();
    await user.click(screen.getByLabelText("Search groups…"));

    expect(
      await screen.findByText("No groups found")
    ).toBeInTheDocument();
  });
});

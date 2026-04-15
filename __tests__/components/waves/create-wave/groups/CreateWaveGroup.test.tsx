import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CreateWaveGroup from "@/components/waves/create-wave/groups/CreateWaveGroup";
import type { WaveGroupsConfig } from "@/types/waves.types";
import { CreateWaveGroupConfigType } from "@/types/waves.types";
import { ApiWaveType } from "@/generated/models/ApiWaveType";
import type { ApiGroupFull } from "@/generated/models/ApiGroupFull";

let inlinePanelProps: any;

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
    function MockCreateWaveGroupInlinePanel(props: any) {
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
  const mockSetChatEnabled = jest.fn();
  const mockSetDropsAdminCanDelete = jest.fn();
  const mockOnInlineGroupCreate = jest.fn();

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
    waveName: "Test Wave",
    waveType: ApiWaveType.Approve,
    groupType: CreateWaveGroupConfigType.CAN_DROP,
    chatEnabled: true,
    adminCanDeleteDrops: false,
    setChatEnabled: mockSetChatEnabled,
    onGroupSelect: mockOnGroupSelect,
    onInlineGroupCreate: mockOnInlineGroupCreate,
    groupsCache: {},
    groups: defaultGroups,
    setDropsAdminCanDelete: mockSetDropsAdminCanDelete,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    inlinePanelProps = null;
  });

  const renderComponent = (props = {}) =>
    render(<CreateWaveGroup {...defaultProps} {...props} />);

  it("shows the scope title", () => {
    renderComponent();
    expect(screen.getByText("Who can drop")).toBeInTheDocument();
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
    expect(inlinePanelProps.selectedGroup).toEqual(exampleGroup);
  });

  it("passes the suggested group name and simplified callbacks to the inline panel", () => {
    renderComponent();

    expect(inlinePanelProps.suggestedName).toBe("Test Wave Who can drop");
    expect(inlinePanelProps.onChange).toBe(mockOnGroupSelect);
    expect(inlinePanelProps.onCreateGroup).toBe(mockOnInlineGroupCreate);
    expect(inlinePanelProps.groupBuilder).toBeUndefined();
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

    await user.click(screen.getByLabelText("Allow admins to delete posts"));
    expect(mockSetDropsAdminCanDelete).toHaveBeenCalledWith(true);
  });

  it("passes disabled to the inline panel when chat is disabled", () => {
    renderComponent({
      groupType: CreateWaveGroupConfigType.CAN_CHAT,
      chatEnabled: false,
    });

    expect(inlinePanelProps.disabled).toBe(true);
  });
});

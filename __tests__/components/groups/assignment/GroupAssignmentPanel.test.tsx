import React from "react";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ApiCreateGroup } from "@/generated/models/ApiCreateGroup";
import type { ApiGroupFull } from "@/generated/models/ApiGroupFull";
import type { CommunityMemberMinimal } from "@/entities/IProfile";
import GroupAssignmentPanel from "@/components/groups/assignment/GroupAssignmentPanel";
import type GroupMembersPreviewDialog from "@/components/groups/members/GroupMembersPreviewDialog";
import type GroupMembersPreviewTrigger from "@/components/groups/members/GroupMembersPreviewTrigger";
import type { GroupMembersPreviewTarget } from "@/services/api/group-members-api";

type PreviewTriggerProps = React.ComponentProps<
  typeof GroupMembersPreviewTrigger
>;
type PreviewDialogProps = React.ComponentProps<
  typeof GroupMembersPreviewDialog
>;

let mockPreviewTriggerProps: PreviewTriggerProps | null = null;
let mockPreviewDialogProps: PreviewDialogProps | null = null;

jest.mock("@/components/groups/members/GroupMembersPreviewTrigger", () => ({
  __esModule: true,
  default: (props: PreviewTriggerProps) => {
    mockPreviewTriggerProps = props;
    return (
      <button type="button" onClick={props.onOpen}>
        View members
      </button>
    );
  },
}));

jest.mock("@/components/groups/members/GroupMembersPreviewDialog", () => ({
  __esModule: true,
  default: (props: PreviewDialogProps) => {
    mockPreviewDialogProps = props;
    return (
      <div data-testid="members-preview-dialog">
        {props.target.kind}:
        {props.target.kind === "draft" ? props.target.summary : ""}
      </div>
    );
  },
}));

jest.mock(
  "@/components/waves/create-wave/groups/CreateWaveGroupSearchField",
  () =>
    function MockCreateWaveGroupSearchField(props: any) {
      return (
        <div
          data-testid="group-search"
          data-allow-clear={String(props.allowClear)}
          data-results-layout={props.resultsLayout}
        >
          <div>{props.selectedGroup?.name ?? "No group selected"}</div>
          <button
            type="button"
            onClick={() =>
              props.onSelect({
                id: "group-selected",
                name: "Selected Group",
                created_by: { handle: "builder" },
              })
            }
          >
            select group
          </button>
          <button type="button" onClick={() => props.onSelect(null)}>
            clear group
          </button>
        </div>
      );
    }
);

jest.mock(
  "@/components/waves/create-wave/groups/CreateWaveInlineGroupIdentities",
  () =>
    function MockCreateWaveInlineGroupIdentities(props: {
      readonly resultsLayout?: string;
      readonly onIncludedIdentitySelect: (identity: {
        readonly profile_id: string;
        readonly handle: string;
        readonly normalised_handle: string;
        readonly primary_wallet: string;
        readonly display: string;
        readonly tdh: number;
        readonly level: number;
        readonly cic_rating: number;
        readonly wallet: string;
        readonly pfp: string | null;
      }) => void;
    }) {
      return (
        <div
          data-testid="identity-builder"
          data-results-layout={props.resultsLayout}
        >
          <button
            type="button"
            onClick={() =>
              props.onIncludedIdentitySelect({
                profile_id: "profile-1",
                handle: "alpha",
                normalised_handle: "alpha",
                primary_wallet: "0xABC",
                display: "Alpha",
                tdh: 0,
                level: 0,
                cic_rating: 0,
                wallet: "0xABC",
                pfp: null,
              })
            }
          >
            add identity
          </button>
        </div>
      );
    }
);

jest.mock(
  "@/components/waves/create-wave/groups/CreateWaveInlineGroupRuleEditor",
  () =>
    function MockCreateWaveInlineGroupRuleEditor(props: {
      readonly draft: ApiCreateGroup;
      readonly onDraftChange: (draft: ApiCreateGroup) => void;
    }) {
      return (
        <div data-testid="rule-editor">
          <button
            type="button"
            onClick={() =>
              props.onDraftChange({
                ...props.draft,
                group: {
                  ...props.draft.group,
                  rep: {
                    ...props.draft.group.rep,
                    min: 5,
                  },
                },
              })
            }
          >
            set rep min
          </button>
        </div>
      );
    }
);

const createdGroup: ApiGroupFull = {
  id: "group-created",
  name: "Created Group",
  created_by: { handle: "builder" },
} as ApiGroupFull;

const defaultIncludedIdentity: CommunityMemberMinimal = {
  profile_id: "profile-me",
  handle: "me",
  normalised_handle: "me",
  primary_wallet: "0xME",
  display: "Me",
  tdh: 42,
  level: 3,
  cic_rating: 5,
  wallet: "0xME",
  pfp: null,
};

function renderDialogPanel({
  onChange = jest.fn(),
  onCreateGroup = jest.fn().mockResolvedValue(createdGroup),
  selectedGroup = null,
  selectedGroupIncludedWallets,
  selectedGroupExcludedWallets,
  startMode = "existing",
  allowGroupClear = true,
  membersRoleLabel,
  defaultMembersPreviewTarget,
  includedIdentity = null,
}: {
  readonly onChange?: jest.Mock;
  readonly onCreateGroup?: jest.Mock;
  readonly selectedGroup?: ApiGroupFull | null;
  readonly selectedGroupIncludedWallets?: readonly string[] | undefined;
  readonly selectedGroupExcludedWallets?: readonly string[] | undefined;
  readonly startMode?: "actions" | "existing" | "criteria" | undefined;
  readonly allowGroupClear?: boolean;
  readonly membersRoleLabel?: string | undefined;
  readonly defaultMembersPreviewTarget?: GroupMembersPreviewTarget | undefined;
  readonly includedIdentity?: CommunityMemberMinimal | null;
} = {}) {
  const initialSelectedGroup = selectedGroup;

  function ControlledPanel() {
    const [currentGroup, setCurrentGroup] = React.useState<ApiGroupFull | null>(
      () => initialSelectedGroup
    );

    return (
      <GroupAssignmentPanel
        suggestedName="My Wave Visibility"
        defaultLabel="Public"
        selectedGroup={currentGroup}
        selectedGroupIncludedWallets={selectedGroupIncludedWallets}
        selectedGroupExcludedWallets={selectedGroupExcludedWallets}
        allowGroupClear={allowGroupClear}
        startMode={startMode}
        collapseOnClickAway={false}
        membersRoleLabel={membersRoleLabel}
        defaultMembersPreviewTarget={defaultMembersPreviewTarget}
        defaultIncludedIdentity={includedIdentity}
        onChange={(group) => {
          setCurrentGroup(group);
          onChange(group);
        }}
        onCreateGroup={onCreateGroup}
      />
    );
  }

  return render(<ControlledPanel />);
}

describe("GroupAssignmentPanel shared layout", () => {
  beforeEach(() => {
    mockPreviewTriggerProps = null;
    mockPreviewDialogProps = null;
  });

  it("starts on existing group search", () => {
    renderDialogPanel();

    expect(screen.getByText("Public")).toBeInTheDocument();
    expect(screen.queryByText("Current group")).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Choose group" })
    ).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByTestId("group-search")).toBeInTheDocument();
    expect(screen.getByTestId("group-search")).toHaveAttribute(
      "data-results-layout",
      "popover"
    );
    expect(
      screen.getByRole("button", { name: "Edit criteria" })
    ).toBeInTheDocument();
    expect(screen.queryByRole("tab")).not.toBeInTheDocument();
  });

  it("includes the editor by default when starting criteria from Public", async () => {
    const user = userEvent.setup();
    const onCreateGroup = jest.fn().mockResolvedValue(createdGroup);
    renderDialogPanel({
      startMode: "criteria",
      includedIdentity: defaultIncludedIdentity,
      onCreateGroup,
    });

    await user.click(
      screen.getByRole("button", { name: "Create and use new group" })
    );

    await waitFor(() => {
      expect(onCreateGroup).toHaveBeenCalledWith(
        expect.objectContaining({
          group: expect.objectContaining({
            identity_addresses: ["0xme"],
          }),
        })
      );
    });
  });

  it("labels an actual selected group as the current group", () => {
    renderDialogPanel({
      selectedGroup: {
        id: "group-1",
        name: "Existing Group",
      } as ApiGroupFull,
    });

    expect(screen.getByText("Current group")).toBeInTheDocument();
    expect(screen.getAllByText("Existing Group").length).toBeGreaterThan(0);
  });

  it("starts with saved criteria and identities prefilled for access editing", async () => {
    const user = userEvent.setup();
    const onCreateGroup = jest.fn().mockResolvedValue(createdGroup);
    const onChange = jest.fn();
    const selectedGroup = {
      id: "group-1",
      name: "Existing Group",
      is_private: true,
      group: {
        tdh: { min: null, max: null, inclusion_strategy: "BOTH" },
        rep: {
          min: 5,
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
        identity_group_id: "included-group",
        identity_group_identities_count: 1,
        excluded_identity_group_id: "excluded-group",
        excluded_identity_group_identities_count: 1,
        is_beneficiary_of_grant_id: null,
        is_beneficiary_of_grant_match_mode: "ANY_TOKEN",
        is_beneficiary_of_grant: null,
      },
    } as unknown as ApiGroupFull;
    renderDialogPanel({
      selectedGroup,
      selectedGroupIncludedWallets: ["0xAAA"],
      selectedGroupExcludedWallets: ["0xBBB"],
      includedIdentity: defaultIncludedIdentity,
      startMode: "criteria",
      onCreateGroup,
      onChange,
    });

    expect(
      screen.getByRole("button", { name: "Edit criteria" })
    ).toHaveAttribute("aria-pressed", "true");
    expect(
      screen.getByRole("switch", { name: "Hide criteria and members" })
    ).toBeChecked();
    expect(screen.getAllByText(/REP at least 5/i).length).toBeGreaterThan(0);
    expect(
      screen.getAllByText(/1 explicitly included user/i).length
    ).toBeGreaterThan(0);

    await user.click(
      screen.getByRole("button", { name: "Create and use new group" })
    );
    await waitFor(() => {
      expect(onCreateGroup).toHaveBeenCalledWith(
        expect.objectContaining({
          is_private: true,
          group: expect.objectContaining({
            identity_addresses: ["0xaaa"],
            excluded_identity_addresses: ["0xbbb"],
            rep: expect.objectContaining({ min: 5 }),
          }),
        })
      );
    });
    expect(onChange).toHaveBeenCalledWith(createdGroup);
  });

  it("switches to new group actions", async () => {
    const user = userEvent.setup();
    renderDialogPanel();

    await user.click(screen.getByRole("button", { name: "Edit criteria" }));

    expect(
      screen.getByRole("button", { name: "Identities" })
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Rep" })).toBeInTheDocument();
    expect(screen.queryByTestId("group-search")).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Choose group" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("switch", { name: "Hide criteria and members" })
    ).not.toBeChecked();

    const privacyInfo = screen.getByRole("button", {
      name: "About criteria and member visibility",
    });
    await user.hover(privacyInfo);
    expect(screen.getByRole("tooltip")).toHaveTextContent(
      "The criteria and member list are visible to members of this group, but hidden from everyone else."
    );
  });

  it("returns to an unsaved criteria draft after opening group search", async () => {
    const user = userEvent.setup();
    renderDialogPanel({ startMode: "criteria" });

    await user.click(screen.getByRole("button", { name: "Choose group" }));
    expect(screen.getByTestId("group-search")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Edit criteria" }));

    expect(screen.queryByTestId("group-search")).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Identities" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Choose group" })
    ).toHaveAttribute("aria-pressed", "false");
  });

  it("uses the same identity editor as wave creation", async () => {
    const user = userEvent.setup();
    renderDialogPanel();

    await user.click(screen.getByRole("button", { name: "Edit criteria" }));
    await user.click(screen.getByRole("button", { name: "Identities" }));

    expect(screen.getByTestId("identity-builder")).not.toHaveAttribute(
      "data-results-layout"
    );
    expect(screen.getByRole("button", { name: "Rep" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Close" })).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Cancel" })
    ).not.toBeInTheDocument();
  });

  it("switches from identity editing to rule selection without losing the draft", async () => {
    const user = userEvent.setup();
    renderDialogPanel();

    await user.click(screen.getByRole("button", { name: "Edit criteria" }));
    await user.click(screen.getByRole("button", { name: "Identities" }));
    await user.click(screen.getByRole("button", { name: "add identity" }));

    expect(
      screen.getAllByText("1 explicitly included user").length
    ).toBeGreaterThan(0);

    await user.click(screen.getByRole("button", { name: "Rep" }));

    expect(screen.queryByTestId("identity-builder")).not.toBeInTheDocument();
    expect(screen.getByTestId("rule-editor")).toBeInTheDocument();
    expect(
      screen.getAllByText("1 explicitly included user").length
    ).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: "Close" })).toBeInTheDocument();
  });

  it("selects an existing group", async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    renderDialogPanel({ onChange });

    await user.click(screen.getByRole("button", { name: "select group" }));

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ id: "group-selected" })
    );
  });

  it("blocks clearing when group clear is disabled", async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    renderDialogPanel({
      onChange,
      allowGroupClear: false,
      selectedGroup: { id: "group-1", name: "Existing Group" } as ApiGroupFull,
    });

    expect(screen.getByTestId("group-search")).toHaveAttribute(
      "data-allow-clear",
      "false"
    );

    await user.click(screen.getByRole("button", { name: "clear group" }));

    expect(onChange).not.toHaveBeenCalledWith(null);
    expect(screen.getAllByText("Existing Group").length).toBeGreaterThan(0);
  });

  it("creates and attaches a valid new group draft", async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    const onCreateGroup = jest.fn().mockResolvedValue(createdGroup);
    renderDialogPanel({ onChange, onCreateGroup, startMode: "criteria" });

    await user.click(
      screen.getByRole("switch", { name: "Hide criteria and members" })
    );
    await user.click(screen.getByRole("button", { name: "Rep" }));
    await user.click(screen.getByRole("button", { name: "set rep min" }));

    expect(screen.getAllByText("REP at least 5").length).toBeGreaterThan(0);

    await user.click(
      screen.getByRole("button", { name: "Create and use new group" })
    );

    await waitFor(() => {
      expect(onCreateGroup).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "My Wave Visibility",
          is_private: true,
        })
      );
    });
    expect(onChange).toHaveBeenCalledWith(createdGroup);
  });

  it("opens a live preview for a valid unsaved group", async () => {
    const user = userEvent.setup();
    renderDialogPanel({
      membersRoleLabel: "Visibility",
      startMode: "criteria",
    });

    await user.click(screen.getByRole("button", { name: "Rep" }));
    await user.click(screen.getByRole("button", { name: "set rep min" }));
    await user.click(screen.getByRole("button", { name: "Preview matches" }));

    expect(screen.getByTestId("members-preview-dialog")).toHaveTextContent(
      "draft:REP at least 5"
    );
  });

  it("offers member inspection for a selected saved group", async () => {
    const user = userEvent.setup();
    renderDialogPanel({
      membersRoleLabel: "Visibility",
      selectedGroup: { id: "group-1", name: "Existing Group" } as ApiGroupFull,
    });

    const currentGroup = screen.getByText("Current group").parentElement;
    expect(currentGroup).not.toBeNull();
    expect(within(currentGroup!).queryByText("Existing Group")).toBeNull();
    expect(mockPreviewTriggerProps?.target).toMatchObject({
      kind: "saved",
      group: { id: "group-1", name: "Existing Group" },
    });

    await user.click(screen.getByRole("button", { name: "View members" }));
    expect(screen.getByTestId("members-preview-dialog")).toHaveTextContent(
      "saved:"
    );
    expect(mockPreviewDialogProps?.target).toEqual(
      mockPreviewTriggerProps?.target
    );
  });

  it("offers the same member inspection for a default audience", async () => {
    const user = userEvent.setup();
    renderDialogPanel({
      membersRoleLabel: "Admins",
      defaultMembersPreviewTarget: {
        kind: "draft",
        group: {} as ApiCreateGroup["group"],
        name: "Only me",
        summary: "Only me",
      },
    });

    expect(screen.queryByText("Current group")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "View members" }));
    expect(screen.getByTestId("members-preview-dialog")).toHaveTextContent(
      "draft:Only me"
    );
  });
});

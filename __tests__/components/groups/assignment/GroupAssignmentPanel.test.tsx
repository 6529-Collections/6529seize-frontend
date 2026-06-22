import React from "react";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ApiCreateGroup } from "@/generated/models/ApiCreateGroup";
import type { ApiGroupFull } from "@/generated/models/ApiGroupFull";
import GroupAssignmentPanel from "@/components/groups/assignment/GroupAssignmentPanel";

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
      readonly onIdentitySelect: (identity: {
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
              props.onIdentitySelect({
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

function renderDialogPanel({
  onChange = jest.fn(),
  onCreateGroup = jest.fn().mockResolvedValue(createdGroup),
  selectedGroup = null,
  allowGroupClear = true,
}: {
  readonly onChange?: jest.Mock;
  readonly onCreateGroup?: jest.Mock;
  readonly selectedGroup?: ApiGroupFull | null;
  readonly allowGroupClear?: boolean;
} = {}) {
  const initialSelectedGroup = selectedGroup;

  function ControlledPanel() {
    const [currentGroup, setCurrentGroup] = React.useState<ApiGroupFull | null>(
      () => initialSelectedGroup
    );

    return (
      <GroupAssignmentPanel
        suggestedName="My Wave Who can view"
        defaultLabel="Anyone"
        selectedGroup={currentGroup}
        allowGroupClear={allowGroupClear}
        layout="dialog"
        startMode="existing"
        collapseOnClickAway={false}
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

describe("GroupAssignmentPanel dialog layout", () => {
  it("starts on existing group search", () => {
    renderDialogPanel();

    expect(
      screen.getByRole("tab", { name: "Existing group" })
    ).toHaveAttribute("aria-selected", "true");
    expect(screen.getByTestId("group-search")).toBeInTheDocument();
    expect(screen.getByTestId("group-search")).toHaveAttribute(
      "data-results-layout",
      "inline"
    );
    expect(
      screen.queryByRole("button", { name: "Choose group" })
    ).not.toBeInTheDocument();
  });

  it("switches to new group actions", async () => {
    const user = userEvent.setup();
    renderDialogPanel();

    await user.click(screen.getByRole("tab", { name: "New group" }));

    expect(
      screen.getByRole("button", { name: "Add identity" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Add rule" })
    ).toBeInTheDocument();
    expect(screen.queryByTestId("group-search")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Choose group" })
    ).not.toBeInTheDocument();
  });

  it("uses inline identity results in the dialog add identity panel", async () => {
    const user = userEvent.setup();
    renderDialogPanel();

    await user.click(screen.getByRole("tab", { name: "New group" }));
    await user.click(screen.getByRole("button", { name: "Add identity" }));

    expect(screen.getByTestId("identity-builder")).toHaveAttribute(
      "data-results-layout",
      "inline"
    );
    expect(
      screen.getByRole("button", { name: "Add rule" })
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Done" })).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Cancel" })
    ).not.toBeInTheDocument();
  });

  it("switches from identity editing to rule selection without losing the draft", async () => {
    const user = userEvent.setup();
    renderDialogPanel();

    await user.click(screen.getByRole("tab", { name: "New group" }));
    await user.click(screen.getByRole("button", { name: "Add identity" }));
    await user.click(screen.getByRole("button", { name: "add identity" }));

    expect(screen.getAllByText("1 identity").length).toBeGreaterThan(0);
    expect(
      within(screen.getByRole("button", { name: "Add identity" })).getByText(
        "1"
      )
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Add rule" }));

    expect(screen.queryByTestId("identity-builder")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Rep" })).toBeInTheDocument();
    expect(screen.getAllByText("1 identity").length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: "Done" })).toBeInTheDocument();
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
    expect(screen.getByText("Existing Group")).toBeInTheDocument();
  });

  it("creates and attaches a valid new group draft", async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    const onCreateGroup = jest.fn().mockResolvedValue(createdGroup);
    renderDialogPanel({ onChange, onCreateGroup });

    await user.click(screen.getByRole("tab", { name: "New group" }));
    await user.click(screen.getByRole("button", { name: "Add rule" }));
    await user.click(screen.getByRole("button", { name: "Rep" }));
    await user.click(screen.getByRole("button", { name: "set rep min" }));

    expect(
      within(screen.getByRole("button", { name: "Add rule" })).getByText("1")
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: "Create and use new group" })
    );

    await waitFor(() => {
      expect(onCreateGroup).toHaveBeenCalledWith(
        expect.objectContaining({ name: "My Wave Who can view" })
      );
    });
    expect(onChange).toHaveBeenCalledWith(createdGroup);
  });
});

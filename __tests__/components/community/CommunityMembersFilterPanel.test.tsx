import { useState, type ComponentProps } from "react";
import type { GroupCriteriaView } from "@/components/groups/assignment/GroupCriteriaEditor";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CommunityMembersFilterPanel from "@/components/community/CommunityMembersFilterPanel";
import type GroupMembersPreviewTrigger from "@/components/groups/members/GroupMembersPreviewTrigger";
import type GroupMembersPreviewDialog from "@/components/groups/members/GroupMembersPreviewDialog";
import type { ApiGroupFull } from "@/generated/models/ApiGroupFull";
import { createEmptyInlineGroupPayload } from "@/components/waves/create-wave/groups/createWaveInlineGroupBuilder";

jest.mock("@/components/groups/members/GroupMembersPreviewTrigger", () => ({
  __esModule: true,
  default: ({
    target,
    onOpen,
  }: ComponentProps<typeof GroupMembersPreviewTrigger>) => (
    <div>
      <span>
        {target.kind === "draft" ? target.summary : target.group.name}
      </span>
      <button onClick={onOpen}>View members</button>
    </div>
  ),
}));
jest.mock("@/components/groups/members/GroupMembersPreviewDialog", () => ({
  __esModule: true,
  default: ({
    target,
    onClose,
  }: ComponentProps<typeof GroupMembersPreviewDialog>) => (
    <div role="dialog" aria-label="Member preview">
      <span>{target.kind}</span>
      <button onClick={onClose}>Close preview</button>
    </div>
  ),
}));

const createdGroup = {
  id: "network-filter-created",
  name: "Network filter",
} as ApiGroupFull;

function PanelHarness(
  props: Omit<
    ComponentProps<typeof CommunityMembersFilterPanel>,
    "view" | "onViewChange"
  >
) {
  const [view, setView] = useState<GroupCriteriaView | null>(
    props.mobileNavigation ? null : "identities"
  );
  return (
    <>
      {props.mobileNavigation && view !== null && (
        <button onClick={() => setView(null)}>Back</button>
      )}
      <CommunityMembersFilterPanel
        {...props}
        view={view}
        onViewChange={setView}
      />
    </>
  );
}

function renderPanel(
  overrides: Partial<ComponentProps<typeof CommunityMembersFilterPanel>> = {}
) {
  const onCreateGroup = jest.fn().mockResolvedValue(createdGroup);
  const onChange = jest.fn();
  render(
    <PanelHarness
      suggestedName="Network filter"
      defaultLabel="All Network members"
      selectedGroup={null}
      startMode="criteria"
      collapseOnClickAway={false}
      onCreateGroup={onCreateGroup}
      onChange={onChange}
      mobileNavigation
      {...overrides}
    />
  );
  return { onCreateGroup, onChange };
}

async function openCriterion(
  user: ReturnType<typeof userEvent.setup>,
  name: string | RegExp
) {
  const back = screen.queryByRole("button", { name: "Back" });
  if (back) await user.click(back);
  await user.click(screen.getByRole("button", { name }));
}

beforeAll(() => {
  HTMLElement.prototype.scrollTo = jest.fn();
  HTMLElement.prototype.scrollIntoView = jest.fn();
});

it("opens the mobile list with all eight criteria and readiness guidance on demand", async () => {
  const user = userEvent.setup();
  renderPanel();
  expect(screen.queryByText("Before editing")).not.toBeInTheDocument();
  expect(screen.queryByText("After editing")).not.toBeInTheDocument();
  expect(screen.queryByText("All Network members")).not.toBeInTheDocument();
  expect(screen.getByText("No criteria selected")).toBeVisible();
  const choices = screen.getByRole("group", { name: "Filter Network" });
  expect(
    within(choices)
      .getAllByRole("button")
      .map((button) => button.textContent)
  ).toEqual([
    "Identities",
    "Level",
    "TDH",
    "NIC",
    "Rep",
    "Required NFTs",
    "Collection Access",
    "xTDH Grant",
  ]);
  expect(screen.queryByRole("region")).not.toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: "Back" })
  ).not.toBeInTheDocument();
  expect(
    screen.queryByText(
      "Finish the missing group rules before you create this group."
    )
  ).not.toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: "Create and use new group" })
  ).toBeDisabled();
  await user.click(screen.getByRole("button", { name: "Not ready yet." }));
  const guidance = await screen.findByRole("tooltip");
  expect(guidance).toHaveTextContent("Not ready yet.");
  expect(guidance).toHaveTextContent(
    "Finish the missing group rules before you create this group."
  );
});

it("keeps the desktop rail and opens Identities beside it", () => {
  renderPanel({ mobileNavigation: false });
  expect(screen.getByRole("group", { name: "Filter Network" })).toBeVisible();
  expect(screen.getByRole("region", { name: "Identities" })).toBeVisible();
  expect(screen.getByRole("button", { name: "Identities" })).toHaveAttribute(
    "aria-current",
    "true"
  );
});

it("opens one mobile editor and returns focus to its configured row", async () => {
  const user = userEvent.setup();
  renderPanel();
  await openCriterion(user, "Level");
  const input = screen.getByRole("spinbutton", { name: "Level at least" });
  await user.type(input, "10");
  expect(
    screen.queryByRole("group", { name: "Filter Network" })
  ).not.toBeInTheDocument();
  expect(screen.queryByText("Before editing")).not.toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Back" }));
  expect(
    screen.getByRole("button", { name: "Level Configured" })
  ).toHaveFocus();
  expect(screen.queryByText("Before editing")).not.toBeInTheDocument();
  await openCriterion(user, "Level Configured");
  expect(
    screen.getByRole("spinbutton", { name: "Level at least" })
  ).toHaveValue(10);
  await user.clear(screen.getByRole("spinbutton", { name: "Level at least" }));
  await user.click(screen.getByRole("button", { name: "Back" }));
  expect(screen.getByRole("button", { name: "Level" })).not.toHaveAttribute(
    "data-configured"
  );
  expect(
    screen.getByRole("button", { name: "Create and use new group" })
  ).toBeDisabled();
});

it("preserves common criteria while visiting advanced criteria and submits the existing group payload", async () => {
  const user = userEvent.setup();
  const { onCreateGroup, onChange } = renderPanel();
  await openCriterion(user, "Level");
  await user.type(
    screen.getByRole("spinbutton", { name: "Level at least" }),
    "10"
  );
  await openCriterion(user, "TDH");
  await user.type(
    screen.getByRole("spinbutton", { name: "TDH + xTDH at least" }),
    "100"
  );
  expect(
    screen.getByRole("spinbutton", { name: "TDH + xTDH at least" })
  ).toHaveValue(100);
  await openCriterion(user, "Identities");
  expect(screen.getByRole("region", { name: "Identities" })).toBeVisible();
  expect(
    screen.getByText("No identities are explicitly included.")
  ).toBeInTheDocument();
  expect(screen.queryByText("No allowlist added.")).not.toBeInTheDocument();
  expect(screen.queryByText("No CSV file added.")).not.toBeInTheDocument();
  expect(
    screen.queryByText("0 unique identities included")
  ).not.toBeInTheDocument();
  expect(
    screen.queryByRole("heading", { name: "Find an identity to include" })
  ).not.toBeInTheDocument();
  expect(
    screen.getByRole("textbox", { name: "Find an identity to include" })
  ).toBeVisible();
  await user.click(screen.getByRole("tab", { name: "Excluded" }));
  expect(screen.getByRole("tab", { name: "Excluded" })).toHaveAttribute(
    "aria-selected",
    "true"
  );
  expect(
    screen.getByText("No identities are explicitly excluded.")
  ).toBeInTheDocument();
  expect(screen.getByText("No allowlist added.")).toBeVisible();
  expect(screen.getByText("No CSV file added.")).toBeVisible();
  expect(screen.getByText("0 unique identities excluded")).toBeVisible();
  await openCriterion(user, /^Level(?: Configured)?$/);
  expect(
    screen.getByRole("spinbutton", { name: "Level at least" })
  ).toHaveValue(10);
  await user.click(
    screen.getByRole("button", { name: "Create and use new group" })
  );
  await waitFor(() => expect(onChange).toHaveBeenCalledWith(createdGroup));
  expect(onCreateGroup).toHaveBeenCalledWith(
    expect.objectContaining({
      name: "Network filter",
      is_private: false,
      group: expect.objectContaining({
        level: { min: 10, max: null },
        tdh: { min: 100, max: null, inclusion_strategy: "BOTH" },
      }),
    })
  );
});

it("prefills a saved group, keeps both previews, and does not change the original group", async () => {
  const user = userEvent.setup();
  const initial = createEmptyInlineGroupPayload();
  const saved = {
    id: "saved-group",
    name: "Original group",
    is_private: true,
    group: {
      ...initial.group,
      level: { min: 20, max: null },
      identity_group_id: "included",
      excluded_identity_group_id: "excluded",
    },
  } as unknown as ApiGroupFull;
  const { onCreateGroup } = renderPanel({
    selectedGroup: saved,
    selectedGroupIncludedWallets: [
      "0x0000000000000000000000000000000000000001",
    ],
    selectedGroupExcludedWallets: [
      "0x0000000000000000000000000000000000000002",
    ],
  });
  for (const label of screen.getAllByText("Original group")) {
    expect(label).toBeVisible();
  }
  expect(screen.queryByText("Before editing")).not.toBeInTheDocument();
  expect(screen.queryByText("After editing")).not.toBeInTheDocument();
  await openCriterion(user, /^Level(?: Configured)?$/);
  expect(
    screen.getByRole("spinbutton", { name: "Level at least" })
  ).toHaveValue(20);
  await user.click(screen.getByRole("button", { name: "Back" }));
  expect(screen.getAllByRole("button", { name: "View members" })).toHaveLength(
    2
  );
  await user.click(screen.getAllByRole("button", { name: "View members" })[0]!);
  expect(
    screen.getByRole("dialog", { name: "Member preview" })
  ).toHaveTextContent("saved");
  await user.click(screen.getByRole("button", { name: "Close preview" }));
  await user.click(screen.getAllByRole("button", { name: "View members" })[1]!);
  expect(
    screen.getByRole("dialog", { name: "Member preview" })
  ).toHaveTextContent("draft");
  await user.click(screen.getByRole("button", { name: "Close preview" }));
  await openCriterion(user, /^Level(?: Configured)?$/);
  await user.clear(screen.getByRole("spinbutton", { name: "Level at least" }));
  await user.type(
    screen.getByRole("spinbutton", { name: "Level at least" }),
    "30"
  );
  await user.click(
    screen.getByRole("button", { name: "Create and use new group" })
  );
  expect(onCreateGroup).toHaveBeenCalledWith(
    expect.objectContaining({
      is_private: true,
      group: expect.objectContaining({
        level: { min: 30, max: null },
        identity_addresses: ["0x0000000000000000000000000000000000000001"],
        excluded_identity_addresses: [
          "0x0000000000000000000000000000000000000002",
        ],
      }),
    })
  );
  expect(saved.group.level.min).toBe(20);
});

it("keeps a failed or cancelled draft for another attempt", async () => {
  const user = userEvent.setup();
  const onCreateGroup = jest.fn().mockResolvedValue(null);
  const onChange = jest.fn();
  renderPanel({ onCreateGroup, onChange });
  await openCriterion(user, "Level");
  await user.type(
    screen.getByRole("spinbutton", { name: "Level at least" }),
    "10"
  );
  await user.click(
    screen.getByRole("button", { name: "Create and use new group" })
  );
  await waitFor(() =>
    expect(
      screen.getByRole("button", { name: "Create and use new group" })
    ).toBeEnabled()
  );
  expect(
    screen.getByRole("spinbutton", { name: "Level at least" })
  ).toHaveValue(10);
  expect(onChange).not.toHaveBeenCalled();
});

it("keeps criteria editable while group creation is pending", async () => {
  const user = userEvent.setup();
  let resolveCreate!: (group: ApiGroupFull | null) => void;
  const onCreateGroup = jest.fn(
    () =>
      new Promise<ApiGroupFull | null>((resolve) => {
        resolveCreate = resolve;
      })
  );
  renderPanel({ onCreateGroup });
  await openCriterion(user, "Level");
  await user.type(
    screen.getByRole("spinbutton", { name: "Level at least" }),
    "10"
  );
  await user.click(
    screen.getByRole("button", { name: "Create and use new group" })
  );
  expect(onCreateGroup).toHaveBeenCalledTimes(1);
  expect(
    screen.getByRole("spinbutton", { name: "Level at least" })
  ).toBeEnabled();
  await user.click(screen.getByRole("button", { name: "Back" }));
  expect(screen.getByRole("button", { name: "TDH" })).toBeEnabled();
  resolveCreate(null);
  await waitFor(() =>
    expect(
      screen.getByRole("button", { name: "Create and use new group" })
    ).toBeEnabled()
  );
});

it("shows import results and errors while hiding the empty Included count", async () => {
  const user = userEvent.setup();
  renderPanel();
  await openCriterion(user, "Identities");
  const upload = screen.getByLabelText(
    "Choose a CSV file of identities to include"
  );
  await user.upload(
    upload,
    new File(["invalid wallet"], "empty.csv", { type: "text/csv" })
  );
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "No valid Ethereum wallet addresses were found."
  );
  expect(
    screen.queryByText("0 unique identities included")
  ).not.toBeInTheDocument();
  await user.upload(
    upload,
    new File(
      [
        "0x1111111111111111111111111111111111111111\n0x2222222222222222222222222222222222222222\n0x1111111111111111111111111111111111111111",
      ],
      "included.csv",
      { type: "text/csv" }
    )
  );
  expect(await screen.findByText("2 unique identities included")).toBeVisible();
  expect(screen.getByText("2 identities added")).toBeVisible();
  expect(screen.getByText("included.csv")).toBeVisible();
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Remove CSV file" }));
  expect(
    screen.queryByText("2 unique identities included")
  ).not.toBeInTheDocument();
  expect(
    screen.queryByText("0 unique identities included")
  ).not.toBeInTheDocument();
  expect(
    screen.getByText("No identities are explicitly included.")
  ).toBeVisible();
});

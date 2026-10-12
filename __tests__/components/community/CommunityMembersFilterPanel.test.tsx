import type { ComponentProps } from "react";
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

function renderPanel(
  overrides: Partial<ComponentProps<typeof CommunityMembersFilterPanel>> = {}
) {
  const onCreateGroup = jest.fn().mockResolvedValue(createdGroup);
  const onChange = jest.fn();
  render(
    <CommunityMembersFilterPanel
      suggestedName="Network filter"
      defaultLabel="All Network members"
      selectedGroup={null}
      startMode="criteria"
      collapseOnClickAway={false}
      onCreateGroup={onCreateGroup}
      onChange={onChange}
      {...overrides}
    />
  );
  return { onCreateGroup, onChange };
}

beforeAll(() => {
  HTMLElement.prototype.scrollTo = jest.fn();
});

it("starts with Identities first and keeps all eight criteria and readiness guidance", () => {
  renderPanel();
  expect(
    screen.queryByRole("spinbutton", { name: "Level at least" })
  ).not.toBeInTheDocument();
  for (const name of [
    "Level",
    "TDH",
    "NIC",
    "Rep",
    "Identities",
    "Required NFTs",
    "Collection Access",
    "xTDH Grant",
  ]) {
    expect(screen.getByRole("button", { name })).toBeInTheDocument();
  }
  const choices = screen.getByRole("group", { name: "Filter Network" });
  expect(choices).toBeVisible();
  expect(within(choices).getAllByRole("button")[0]).toHaveTextContent(
    "Identities"
  );
  expect(
    screen.getByRole("button", { name: "All filters" })
  ).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Identities" })).toHaveAttribute(
    "aria-current",
    "true"
  );
  expect(screen.getByRole("button", { name: "Level" })).not.toHaveAttribute(
    "aria-current"
  );
  expect(
    screen.queryByRole("button", { name: "More filters" })
  ).not.toBeInTheDocument();
  expect(
    screen.getByText("No identities are explicitly included.")
  ).toBeInTheDocument();
  const identityModes = screen.getByRole("tablist", {
    name: "Identity treatment",
  });
  expect(
    within(identityModes).getByRole("tab", { name: "Included" })
  ).toHaveAttribute("aria-selected", "true");
  expect(
    within(identityModes).getByRole("tab", { name: "Excluded" })
  ).toHaveAttribute("aria-selected", "false");
  expect(
    screen.queryByRole("button", { name: "Edit criteria" })
  ).not.toBeInTheDocument();
  expect(
    screen.getByText(
      "Finish the missing group rules before you create this group."
    )
  ).toBeVisible();
  expect(
    screen.getByRole("button", { name: "Create and use new group" })
  ).toBeDisabled();
});

it("preserves common criteria while visiting advanced criteria and submits the existing group payload", async () => {
  const user = userEvent.setup();
  const { onCreateGroup, onChange } = renderPanel();
  await user.click(screen.getByRole("button", { name: "Level" }));
  await user.type(
    screen.getByRole("spinbutton", { name: "Level at least" }),
    "10"
  );
  await user.click(screen.getByRole("button", { name: "TDH" }));
  await user.type(
    screen.getByRole("spinbutton", { name: "TDH + xTDH at least" }),
    "100"
  );
  expect(
    screen.getByRole("spinbutton", { name: "TDH + xTDH at least" })
  ).toHaveValue(100);
  await user.click(screen.getByRole("button", { name: "Identities" }));
  expect(screen.getByRole("button", { name: "Identities" })).toHaveAttribute(
    "aria-current",
    "true"
  );
  expect(
    screen.getByRole("button", { name: /^Level(?: Configured)?$/ })
  ).not.toHaveAttribute("aria-current");
  expect(
    screen.getByText("No identities are explicitly included.")
  ).toBeInTheDocument();
  expect(screen.getByText("No allowlist added.")).toBeInTheDocument();
  expect(screen.getByText("No CSV file added.")).toBeInTheDocument();
  await user.click(screen.getByRole("tab", { name: "Excluded" }));
  expect(screen.getByRole("tab", { name: "Excluded" })).toHaveAttribute(
    "aria-selected",
    "true"
  );
  expect(
    screen.getByText("No identities are explicitly excluded.")
  ).toBeInTheDocument();
  await user.click(
    screen.getByRole("button", { name: /^Level(?: Configured)?$/ })
  );
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
  await user.click(
    screen.getByRole("button", { name: /^Level(?: Configured)?$/ })
  );
  expect(
    screen.getByRole("spinbutton", { name: "Level at least" })
  ).toHaveValue(20);
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
  await user.click(screen.getByRole("button", { name: "Level" }));
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
  await user.click(screen.getByRole("button", { name: "Level" }));
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
  expect(screen.getByRole("button", { name: "TDH" })).toBeEnabled();
  resolveCreate(null);
  await waitFor(() =>
    expect(
      screen.getByRole("button", { name: "Create and use new group" })
    ).toBeEnabled()
  );
});

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  E2eeMessageActionsMenu,
  type E2eeMessageActions,
} from "@/components/e2ee/conversation/E2eeMessageActionsMenu";
import { message, SELF_ID } from "./fakeE2eeEngine";

jest.mock("@/components/e2ee/conversation/E2eeEmojiPicker", () => ({
  E2eeEmojiPicker: ({
    open,
    onSelect,
  }: {
    open: boolean;
    onSelect: (reaction: string) => void;
  }) =>
    open ? (
      <button onClick={() => onSelect(":gm:")}>Choose custom reaction</button>
    ) : null,
}));

const makeActions = (): E2eeMessageActions => ({
  onReply: jest.fn(),
  onEdit: jest.fn(),
  onDelete: jest.fn(),
  onReport: jest.fn(),
  onBlock: jest.fn(),
  onToggleMute: jest.fn(),
  muted: false,
  onReact: jest.fn(),
  onJumpTo: jest.fn(),
});

it("uses a reaction received while the board is open when deciding whether to toggle it off", async () => {
  const user = userEvent.setup();
  const actions = makeActions();
  const original = message({ id: "m1" });
  const props = {
    message: original,
    isOwn: false,
    selfProfileId: SELF_ID,
    senderName: "Alice",
    actions,
  };
  const { rerender } = render(<E2eeMessageActionsMenu {...props} />);
  await user.click(screen.getByRole("button", { name: "Message actions" }));
  await user.click(screen.getByRole("menuitem", { name: "More reactions" }));

  const updated = { ...original, reactions: { ":gm:": [SELF_ID] } };
  rerender(<E2eeMessageActionsMenu {...props} message={updated} />);
  await user.click(
    screen.getByRole("button", { name: "Choose custom reaction" })
  );
  expect(actions.onReact).toHaveBeenCalledWith(updated, ":gm:", false);
});

it("keeps safety controls available without mutations in an earlier history", async () => {
  const user = userEvent.setup();
  const actions = makeActions();
  const incoming = message({ id: "old", senderProfileId: "alice" });
  render(
    <E2eeMessageActionsMenu
      canAct={false}
      message={incoming}
      isOwn={false}
      selfProfileId={SELF_ID}
      senderName="Alice"
      actions={actions}
    />
  );
  await user.click(screen.getByRole("button", { name: "Message actions" }));
  expect(
    screen.queryByRole("menuitem", { name: "More reactions" })
  ).not.toBeInTheDocument();
  expect(
    screen.queryByRole("menuitem", { name: "Reply" })
  ).not.toBeInTheDocument();
  expect(
    screen.queryByRole("menuitem", { name: /React with/u })
  ).not.toBeInTheDocument();
  expect(screen.getByRole("menuitem", { name: /Block/u })).toBeVisible();
  await user.click(screen.getByRole("menuitem", { name: /Report/u }));
  expect(actions.onReport).toHaveBeenCalledWith(incoming);
});

it("closes an open emoji board when the history becomes inactive", async () => {
  const user = userEvent.setup();
  const actions = makeActions();
  const props = {
    message: message({ id: "m1" }),
    isOwn: false,
    selfProfileId: SELF_ID,
    senderName: "Alice",
    actions,
  };
  const { rerender } = render(<E2eeMessageActionsMenu {...props} />);
  await user.click(screen.getByRole("button", { name: "Message actions" }));
  await user.click(screen.getByRole("menuitem", { name: "More reactions" }));
  expect(
    screen.getByRole("button", { name: "Choose custom reaction" })
  ).toBeVisible();
  rerender(<E2eeMessageActionsMenu {...props} canAct={false} />);
  expect(
    screen.queryByRole("button", { name: "Choose custom reaction" })
  ).not.toBeInTheDocument();
  expect(actions.onReact).not.toHaveBeenCalled();
});

it.each([
  { isOwn: false, sigOk: true, showsVerification: true },
  { isOwn: false, sigOk: false, showsVerification: false },
  { isOwn: true, sigOk: true, showsVerification: false },
])(
  "describes verified incoming signatures only (%j)",
  async ({ isOwn, sigOk, showsVerification }) => {
    const user = userEvent.setup();
    render(
      <E2eeMessageActionsMenu
        message={message({
          id: "m1",
          sigOk,
          senderProfileId: isOwn ? SELF_ID : "alice",
        })}
        isOwn={isOwn}
        selfProfileId={SELF_ID}
        senderName="Alice"
        actions={makeActions()}
      />
    );
    await user.click(screen.getByRole("button", { name: "Message actions" }));

    const menu = screen.getByRole("menu");
    if (showsVerification) {
      expect(menu).toHaveAccessibleDescription(
        "Sender’s device signature verified"
      );
    } else {
      expect(menu).not.toHaveAttribute("aria-describedby");
    }
  }
);

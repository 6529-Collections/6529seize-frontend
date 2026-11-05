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

it("uses a reaction received while the board is open when deciding whether to toggle it off", async () => {
  const user = userEvent.setup();
  const actions: E2eeMessageActions = {
    onReply: jest.fn(),
    onEdit: jest.fn(),
    onDelete: jest.fn(),
    onReport: jest.fn(),
    onBlock: jest.fn(),
    onToggleMute: jest.fn(),
    muted: false,
    onReact: jest.fn(),
    onJumpTo: jest.fn(),
  };
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

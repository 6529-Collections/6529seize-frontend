import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { E2eeComposer } from "@/components/e2ee/conversation/E2eeComposer";
import {
  conversation,
  contextFor,
  createFakeE2eeEngine,
  E2eeTestProvider,
  message,
  SELF_ID,
} from "./fakeE2eeEngine";

let mockIsMobile = false;
let mockIsApp = false;
jest.mock("@/hooks/isMobileDevice", () => ({
  __esModule: true,
  default: () => mockIsMobile,
}));
jest.mock("@/hooks/useCapacitor", () => ({
  __esModule: true,
  default: () => ({ isCapacitor: mockIsApp }),
}));
beforeEach(() => {
  mockIsMobile = false;
  mockIsApp = false;
});

jest.mock("@/components/e2ee/conversation/E2eeEmojiPicker", () => ({
  E2eeComposerEmojiPicker: ({
    onSelect,
    onOpen,
  }: {
    onSelect: (text: string) => void;
    onOpen: () => void;
  }) => {
    const React = jest.requireActual<typeof import("react")>("react");
    const [open, setOpen] = React.useState(false);
    return (
      <>
        <button
          onClick={() => {
            onOpen();
            setOpen(true);
          }}
        >
          Add emoji
        </button>
        {open && (
          <>
            <button
              onClick={() => {
                onSelect("😀");
                setOpen(false);
              }}
            >
              Choose smile
            </button>
            <button
              onClick={() => {
                onSelect(":gm:");
                setOpen(false);
              }}
            >
              Choose gm
            </button>
          </>
        )}
      </>
    );
  },
}));

function setup(editing = false) {
  const convo = conversation();
  const original = message({
    id: "original",
    senderProfileId: SELF_ID,
    text: "Hello Bob",
  });
  const engine = createFakeE2eeEngine({
    conversations: [convo],
    messages: { [convo.g]: [original] },
  });
  render(
    <E2eeTestProvider value={contextFor(engine)}>
      <E2eeComposer
        conversation={convo}
        engine={engine}
        selfProfileId={SELF_ID}
        replyTo={null}
        onCancelReply={jest.fn()}
        editing={editing ? original : null}
        onCancelEdit={jest.fn()}
        disabledReasonKey={null}
        attachmentsEnabled
      />
    </E2eeTestProvider>
  );
  return {
    engine,
    input: screen.getByRole<HTMLTextAreaElement>("textbox", {
      name: "Encrypted message",
    }),
    original,
  };
}

it("replaces the selected text with a native emoji, restores the caret and sends the encrypted draft", async () => {
  const { engine, input } = setup();
  fireEvent.change(input, { target: { value: "Hello Bob" } });
  input.setSelectionRange(6, 9);
  fireEvent.click(screen.getByRole("button", { name: "Add emoji" }));
  fireEvent.click(screen.getByRole("button", { name: "Choose smile" }));
  await waitFor(() => expect(input).toHaveFocus());
  expect(input).toHaveValue("Hello 😀");
  expect(input.selectionStart).toBe(8);
  fireEvent.keyDown(input, { key: "Enter" });
  await waitFor(() =>
    expect(engine.send).toHaveBeenCalledWith(
      convoGroup(engine),
      expect.objectContaining({ text: "Hello 😀" })
    )
  );
});

const convoGroup = (engine: ReturnType<typeof createFakeE2eeEngine>) =>
  engine.state.conversations[0]!.g;

it("inserts a custom shortcode into an edit and preserves the existing edit flow", async () => {
  const { engine, input, original } = setup(true);
  input.setSelectionRange(5, 5);
  fireEvent.click(screen.getByRole("button", { name: "Add emoji" }));
  fireEvent.click(screen.getByRole("button", { name: "Choose gm" }));
  expect(input).toHaveValue("Hello:gm: Bob");
  fireEvent.keyDown(input, { key: "Enter" });
  await waitFor(() =>
    expect(engine.edit).toHaveBeenCalledWith(
      convoGroup(engine),
      original.id,
      "Hello:gm: Bob"
    )
  );
});

it.each(["mobile browser", "native app"])(
  "does not submit Return on %s",
  async (platform) => {
    mockIsMobile = platform === "mobile browser";
    mockIsApp = platform === "native app";
    const { engine, input } = setup();
    fireEvent.change(input, { target: { value: "Still writing" } });
    expect(fireEvent.keyDown(input, { key: "Enter" })).toBe(true);
    expect(engine.send).not.toHaveBeenCalled();
    expect(input).toHaveValue("Still writing");
    fireEvent.click(screen.getByRole("button", { name: "Send", exact: true }));
    await waitFor(() => expect(engine.send).toHaveBeenCalledTimes(1));
  }
);

it("does not steal focus back after sending", async () => {
  const { engine, input } = setup();
  fireEvent.change(input, { target: { value: "Sent without refocusing" } });
  const send = screen.getByRole("button", { name: "Send", exact: true });
  send.focus();
  fireEvent.click(send);
  await waitFor(() => expect(engine.send).toHaveBeenCalledTimes(1));
  expect(input).not.toHaveFocus();
});

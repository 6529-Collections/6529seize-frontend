jest.unmock("lexical");
import {
  setComposerText,
  composerText,
  selectComposerText,
  typeAtComposerSelection,
} from "./composerTestUtils";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
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
jest.mock("@/hooks/useDeviceInfo", () => ({
  __esModule: true,
  default: () => ({
    isApp: mockIsApp,
    isMobileDevice: mockIsMobile,
    hasTouchScreen: mockIsMobile,
  }),
}));
jest.mock("@/components/e2ee/conversation/E2eeEmojiProvider", () => ({
  useE2eeEmojis: () => ({
    sources: new Map([
      ["gm", "data:image/png;base64,aGVsbG8="],
      ["gm-wave", "data:image/png;base64,aGVsbG8="],
    ]),
    categories: [],
    failed: false,
    retry: jest.fn(),
  }),
}));
beforeEach(() => {
  mockIsMobile = false;
  mockIsApp = false;
});

jest.mock("@/components/e2ee/conversation/E2eeEmojiPicker", () => ({
  E2eeComposerEmojiPicker: ({
    onSelect,
    onOpen,
    onClosedAfterSelect,
  }: {
    onSelect: (text: string) => void;
    onOpen: () => void;
    onClosedAfterSelect?: () => void;
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
        <button onClick={() => onClosedAfterSelect?.()}>Panel closed</button>
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
    input: screen.getByRole<HTMLDivElement>("textbox", {
      name: "Encrypted message",
    }),
    original,
  };
}

it("replaces the selected text with a native emoji, restores the caret and sends the encrypted draft", async () => {
  const { engine, input } = setup();
  setComposerText(input, "Hello Bob");
  selectComposerText(input, 6, 9);
  fireEvent.click(screen.getByRole("button", { name: "Add emoji" }));
  fireEvent.click(screen.getByRole("button", { name: "Choose smile" }));
  await waitFor(() => expect(input).toHaveFocus());
  expect(composerText(input)).toBe("Hello 😀");
  typeAtComposerSelection(input, "!");
  expect(composerText(input)).toBe("Hello 😀!");
  fireEvent.keyDown(input, { key: "Enter", keyCode: 13 });
  await waitFor(() =>
    expect(engine.send).toHaveBeenCalledWith(
      convoGroup(engine),
      expect.objectContaining({ text: "Hello 😀!" })
    )
  );
});

it("takes focus back after the mobile emoji panel gives it to its trigger", async () => {
  const { input } = setup();
  setComposerText(input, "Hello Bob");
  selectComposerText(input, 6, 9);
  const trigger = screen.getByRole("button", { name: "Add emoji" });
  fireEvent.click(trigger);
  fireEvent.click(screen.getByRole("button", { name: "Choose smile" }));
  expect(composerText(input)).toBe("Hello 😀");
  await new Promise<void>((resolve) =>
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
  );
  // The panel's exit then gives its trigger focus. (jsdom also moves the
  // document selection on focus, so the caret's place is checked in the
  // browser story, not here.)
  act(() => trigger.focus());
  expect(input).not.toHaveFocus();
  fireEvent.click(screen.getByRole("button", { name: "Panel closed" }));
  await waitFor(() => expect(input).toHaveFocus());
  expect(composerText(input)).toBe("Hello 😀");
});

const convoGroup = (engine: ReturnType<typeof createFakeE2eeEngine>) =>
  engine.state.conversations[0]!.g;

it.each(["gm", "gm-wave"])(
  "renders known custom emojis inline and keeps unknown tokens in the encrypted payload: %s",
  async (id) => {
    const { engine, input } = setup();
    const text = `Hello :unknown: :${id}:!`;
    setComposerText(input, text);
    expect(screen.getByRole("img", { name: `:${id}:` })).toHaveAttribute(
      "src",
      "data:image/png;base64,aGVsbG8="
    );
    expect(input).toHaveTextContent(":unknown:");
    expect(
      screen.queryByRole("button", { name: /GIF|Poll|Storm/i })
    ).not.toBeInTheDocument();
    fireEvent.keyDown(input, { key: "Enter", keyCode: 13 });
    await waitFor(() =>
      expect(engine.send).toHaveBeenCalledWith(
        convoGroup(engine),
        expect.objectContaining({ text })
      )
    );
  }
);

it("does not submit Enter while an IME composition is active", () => {
  const { engine, input } = setup();
  setComposerText(input, "Still composing");
  fireEvent.keyDown(input, { key: "Enter", keyCode: 13, isComposing: true });
  expect(engine.send).not.toHaveBeenCalled();
  expect(composerText(input)).toBe("Still composing");
});

it("inserts a custom shortcode into an edit and preserves the existing edit flow", async () => {
  const { engine, input, original } = setup(true);
  selectComposerText(input, 5, 5);
  fireEvent.click(screen.getByRole("button", { name: "Add emoji" }));
  fireEvent.click(screen.getByRole("button", { name: "Choose gm" }));
  expect(composerText(input)).toBe("Hello:gm: Bob");
  expect(input.querySelector('img[alt=":gm:"]')).toBeInTheDocument();
  fireEvent.keyDown(input, { key: "Enter", keyCode: 13 });
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
    setComposerText(input, "Still writing");
    expect(fireEvent.keyDown(input, { key: "Enter", keyCode: 13 })).toBe(true);
    expect(engine.send).not.toHaveBeenCalled();
    expect(composerText(input)).toBe("Still writing");
    fireEvent.click(screen.getByRole("button", { name: /^Send$/ }));
    await waitFor(() => expect(engine.send).toHaveBeenCalledTimes(1));
  }
);

it("does not steal focus back after sending", async () => {
  const { engine, input } = setup();
  setComposerText(input, "Sent without refocusing");
  const send = screen.getByRole("button", { name: /^Send$/ });
  act(() => send.focus());
  fireEvent.click(send);
  await waitFor(() => expect(engine.send).toHaveBeenCalledTimes(1));
  expect(input).not.toHaveFocus();
});

it.each(["desktop", "mobile browser", "native app"])(
  "dismisses a focused composer after an accepted send only on mobile: %s",
  async (platform) => {
    mockIsMobile = platform === "mobile browser";
    mockIsApp = platform === "native app";
    const { engine, input } = setup();
    setComposerText(input, "Ready to send");
    input.focus();
    const blur = jest.spyOn(input, "blur");
    fireEvent.click(screen.getByRole("button", { name: /^Send$/ }));
    await waitFor(() => expect(engine.send).toHaveBeenCalledTimes(1));
    if (platform === "desktop") {
      // Drain the scheduled cleanup before checking the desktop invariant.
      await act(async () => {
        await new Promise<void>((resolve) =>
          requestAnimationFrame(() => resolve())
        );
      });
      expect(blur).not.toHaveBeenCalled();
      expect(input).toHaveFocus();
    } else {
      await waitFor(() => expect(input).not.toHaveFocus());
      expect(blur).toHaveBeenCalledTimes(1);
    }
    expect(composerText(input)).toBe("");
  }
);

it.each(["mobile browser", "native app"])(
  "keeps the draft and focus after a failed encrypted send on %s",
  async (platform) => {
    mockIsMobile = platform === "mobile browser";
    mockIsApp = platform === "native app";
    const { engine, input } = setup();
    jest.mocked(engine.send).mockRejectedValueOnce(new Error("Send failed"));
    setComposerText(input, "Keep this draft");
    input.focus();
    fireEvent.click(screen.getByRole("button", { name: /^Send$/ }));
    await waitFor(() => expect(composerText(input)).toBe("Keep this draft"));
    expect(engine.send).toHaveBeenCalledTimes(1);
    expect(input).toHaveFocus();
  }
);

it.each(["Next draft", ":gm:"])(
  "does not blur a new mobile draft when an earlier send finishes: %s",
  async (nextDraft) => {
    mockIsMobile = true;
    const { engine, input } = setup();
    let finishSend: (() => void) | undefined;
    jest.mocked(engine.send).mockImplementationOnce(
      () =>
        new Promise<void>((resolve) => {
          finishSend = resolve;
        })
    );
    setComposerText(input, "First message");
    input.focus();
    fireEvent.click(screen.getByRole("button", { name: /^Send$/ }));
    expect(composerText(input)).toBe("");
    setComposerText(input, nextDraft);
    await act(async () => finishSend?.());
    await act(async () => {
      await new Promise<void>((resolve) =>
        requestAnimationFrame(() => resolve())
      );
    });
    expect(composerText(input)).toBe(nextDraft);
    expect(input).toHaveFocus();
  }
);

it("inserts safely when the draft was replaced while the emoji picker was open", async () => {
  const { input } = setup();
  setComposerText(input, "Old draft");
  fireEvent.click(screen.getByRole("button", { name: "Add emoji" }));
  setComposerText(input, "Replacement draft");
  fireEvent.click(screen.getByRole("button", { name: "Choose smile" }));
  await waitFor(() => expect(input).toHaveFocus());
  expect(composerText(input)).toBe("Replacement draft😀");
});

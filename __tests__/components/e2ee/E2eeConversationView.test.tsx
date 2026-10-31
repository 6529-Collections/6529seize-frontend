import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { E2eeConversationView } from "@/components/e2ee/conversation/E2eeConversationView";
import type { E2eeConversation, E2eeMessage } from "@/lib/e2ee/types";
import {
  ALICE_ID,
  BOB_ID,
  contextFor,
  conversation,
  createFakeE2eeEngine,
  DM_G,
  E2eeTestProvider,
  GROUP_G,
  message,
  SELF_ID,
} from "./fakeE2eeEngine";
import { SPLIT_VIEW_BANNER } from "../../../tests/support/e2ee/e2eeCopy";

// jsdom has no element scrolling.
Element.prototype.scrollTo = jest.fn();
Element.prototype.scrollIntoView = jest.fn();

const mockPush = jest.fn();
const mockBlock = jest.fn(async () => undefined);
const mutedChats = (): string[] =>
  JSON.parse(
    globalThis.localStorage.getItem(`6529:e2ee:muted:${SELF_ID}`) ?? "[]"
  ) as string[];
jest.mock("@/hooks/content-moderation/useProfileBlockState", () => ({
  useProfileBlockState: () => ({ block: mockBlock }),
}));
jest.mock("next/navigation", () => ({
  usePathname: () => "/messages/encrypted/0x",
  useRouter: () => ({
    push: mockPush,
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
}));

const timeline: E2eeMessage[] = [
  message({
    id: "n1",
    seq: 1,
    kind: "notice",
    senderProfileId: null,
    notice: {
      type: "joined",
      actorProfileId: SELF_ID,
      targetProfileIds: [ALICE_ID],
    },
  }),
  message({
    id: "m1",
    seq: 2,
    text: "hello @me and @bob",
    mentions: [SELF_ID, BOB_ID],
    reactions: { "🔥": [ALICE_ID, BOB_ID] },
  }),
  message({ id: "m2", seq: 3, undecryptable: true }),
  message({ id: "m3", seq: 4, deleted: true, senderProfileId: BOB_ID }),
  message({
    id: "m4",
    seq: 5,
    senderProfileId: SELF_ID,
    text: "fixed typo",
    editedAt: Date.UTC(2026, 9, 12, 11),
    reply: "m1",
  }),
  message({
    id: "m5",
    seq: 6,
    senderProfileId: SELF_ID,
    text: "on its way",
    pending: true,
  }),
];

const renderView = (
  convo: E2eeConversation = conversation(),
  messages: E2eeMessage[] = timeline
) => {
  const engine = createFakeE2eeEngine({
    conversations: [convo],
    messages: { [convo.g]: messages },
  });
  render(
    <E2eeTestProvider value={contextFor(engine)}>
      <E2eeConversationView g={convo.g} />
    </E2eeTestProvider>
  );
  return engine;
};

describe("E2eeConversationView", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    globalThis.localStorage.clear();
  });

  it("renders the header with name, members and the encryption badge", () => {
    renderView();
    expect(
      screen.getByRole("heading", { level: 1, name: "Collectors" })
    ).toBeInTheDocument();
    expect(screen.getByText("End-to-end encrypted")).toBeInTheDocument();
    expect(screen.getByText("3 members")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Chat info" })
    ).toBeInTheDocument();
  });

  it("offers one keyboard stop from above the timeline to the composer", () => {
    renderView();
    const skip = screen.getByRole("button", {
      name: "Skip to message composer",
    });
    fireEvent.click(skip);
    expect(screen.getByLabelText("Encrypted message")).toHaveFocus();
  });

  it("renders messages, notices and message states", () => {
    renderView();
    const log = screen.getByRole("list", { name: "Messages" });
    expect(within(log).getByText("You added alice")).toBeInTheDocument();
    expect(
      within(log).getByText("Couldn’t decrypt this message")
    ).toBeInTheDocument();
    expect(within(log).getByText("Message deleted")).toBeInTheDocument();
    expect(within(log).getByText("(edited)")).toBeInTheDocument();
    expect(within(log).getByText("Sending…")).toBeInTheDocument();
    expect(within(log).getByText("Reply to alice")).toBeInTheDocument();
    // Mentions of members are highlighted, the viewer's more strongly.
    expect(within(log).getByText("@me")).toHaveClass("tw-bg-primary-500/25");
    expect(within(log).getByText("@bob")).toHaveClass("tw-font-semibold");
    expect(
      within(log).getByRole("button", {
        name: "🔥: 2. Reacted by alice and bob",
      })
    ).toHaveAttribute("aria-pressed", "false");
  });

  it("marks the chat read while it is open", () => {
    const engine = renderView();
    expect(engine.markRead).toHaveBeenCalledWith(GROUP_G);
  });

  it("sends with Enter, keeping mentions of members", async () => {
    const engine = renderView();
    const input = screen.getByLabelText("Encrypted message");
    // A trailing space closes the mention picker, so Enter sends.
    fireEvent.change(input, { target: { value: "hi @alice " } });
    fireEvent.keyDown(input, { key: "Enter" });
    await waitFor(() =>
      expect(engine.send).toHaveBeenCalledWith(GROUP_G, {
        text: "hi @alice",
        mentions: [ALICE_ID],
        reply: null,
        files: [],
      })
    );
    expect(input).toHaveValue("");
  });

  it("keeps Shift+Enter as a new line", () => {
    const engine = renderView();
    const input = screen.getByLabelText("Encrypted message");
    fireEvent.change(input, { target: { value: "line one" } });
    fireEvent.keyDown(input, { key: "Enter", shiftKey: true });
    expect(engine.send).not.toHaveBeenCalled();
  });

  it("previews a picked image on a canvas, never as a URL in the DOM", async () => {
    const bitmap = { width: 200, height: 100, close: jest.fn() };
    const createImageBitmapMock = jest.fn().mockResolvedValue(bitmap);
    const drawImage = jest.fn();
    Object.defineProperty(globalThis, "createImageBitmap", {
      configurable: true,
      value: createImageBitmapMock,
    });
    const getContext = jest
      .spyOn(HTMLCanvasElement.prototype, "getContext")
      .mockReturnValue({ drawImage } as unknown as CanvasRenderingContext2D);
    try {
      renderView();
      const file = new File(["png"], "cat.png", { type: "image/png" });
      const fileInput =
        document.querySelector<HTMLInputElement>('input[type="file"]');
      fireEvent.change(fileInput!, { target: { files: [file] } });
      const attachments = screen.getByRole("list", { name: "Attachments" });
      expect(within(attachments).getByText("cat.png")).toBeInTheDocument();
      expect(attachments.querySelector("img")).toBeNull();
      expect(attachments.querySelector("canvas")).toHaveAttribute(
        "aria-hidden",
        "true"
      );
      await waitFor(() => expect(bitmap.close).toHaveBeenCalled());
      expect(createImageBitmapMock).toHaveBeenCalledWith(file);
      // A 2:1 image covers the 96 px square: scaled to 192x96, centered.
      expect(drawImage).toHaveBeenCalledWith(bitmap, -48, 0, 192, 96);
    } finally {
      getContext.mockRestore();
      Reflect.deleteProperty(globalThis, "createImageBitmap");
    }
  });

  it("offers member suggestions for @ mentions", () => {
    renderView();
    const input = screen.getByLabelText(
      "Encrypted message"
    ) as HTMLTextAreaElement;
    fireEvent.change(input, { target: { value: "@al", selectionStart: 3 } });
    const listbox = screen.getByRole("listbox", { name: "Mention someone" });
    fireEvent.click(within(listbox).getByRole("option", { name: /alice/ }));
    expect(input.value).toBe("@alice ");
  });

  it("reacts and reports from the message actions", async () => {
    const engine = renderView();
    const [firstActions] = screen.getAllByRole("button", {
      name: "Message actions",
    });
    fireEvent.click(firstActions!);
    fireEvent.click(
      await screen.findByRole("menuitem", { name: "React with 👍" })
    );
    await waitFor(() =>
      expect(engine.react).toHaveBeenCalledWith(GROUP_G, "m1", "👍", true)
    );

    fireEvent.click(
      screen.getAllByRole("button", { name: "Message actions" })[0]!
    );
    fireEvent.click(
      await screen.findByRole("menuitem", {
        name: "Report illegal or severe harm",
      })
    );
    const dialog = await screen.findByRole("dialog", {
      name: "Report illegal or severe harm",
    });
    expect(
      within(dialog).getByText(/Only this message is shared/)
    ).toBeInTheDocument();
    const categories = within(dialog).getByRole("group", {
      name: "What does this message contain?",
    });
    expect(within(categories).getAllByRole("radio")).toHaveLength(4);
    // A category is required.
    fireEvent.click(
      within(dialog).getByRole("button", { name: "Send report" })
    );
    expect(
      await within(dialog).findByText("Choose what the message contains.")
    ).toBeInTheDocument();
    expect(engine.report).not.toHaveBeenCalled();
    fireEvent.click(
      within(categories).getByRole("radio", {
        name: "A credible threat of violence",
      })
    );
    fireEvent.click(
      within(dialog).getByRole("button", { name: "Send report" })
    );
    await waitFor(() =>
      expect(engine.report).toHaveBeenCalledWith(
        GROUP_G,
        "m1",
        "CREDIBLE_THREAT_OF_VIOLENCE",
        undefined,
        { includeOriginal: false }
      )
    );
  });

  it("puts mute, block and message settings before reporting", async () => {
    renderView();
    fireEvent.click(
      screen.getAllByRole("button", { name: "Message actions" })[0]!
    );
    const items = (await screen.findAllByRole("menuitem")).map(
      (item) => item.textContent
    );
    const at = (label: string) =>
      items.findIndex((text) => text?.includes(label));
    expect(at("Mute on this device")).toBeGreaterThanOrEqual(0);
    expect(at("Block alice")).toBeGreaterThan(at("Mute on this device"));
    expect(at("Choose who can message you")).toBeGreaterThan(at("Block alice"));
    expect(at("Report illegal or severe harm")).toBeGreaterThan(
      at("Choose who can message you")
    );
    expect(
      screen.getByRole("menuitem", { name: "Choose who can message you" })
    ).toHaveAttribute("href", "/preferences");

    fireEvent.click(screen.getByRole("menuitem", { name: "Block alice" }));
    const dialog = await screen.findByRole("dialog", {
      name: "Block alice?",
    });
    fireEvent.click(within(dialog).getByRole("button", { name: "Block" }));
    await waitFor(() => expect(mockBlock).toHaveBeenCalledTimes(1));
  });

  it("mutes the chat on this device from the message menu", async () => {
    renderView();
    fireEvent.click(
      screen.getAllByRole("button", { name: "Message actions" })[0]!
    );
    fireEvent.click(
      await screen.findByRole("menuitem", { name: "Mute on this device" })
    );
    expect(mutedChats()).toEqual([GROUP_G]);
    fireEvent.click(
      screen.getAllByRole("button", { name: "Message actions" })[0]!
    );
    fireEvent.click(
      await screen.findByRole("menuitem", { name: "Unmute on this device" })
    );
    expect(mutedChats()).toEqual([]);
  });

  it("has no attach control while the server has attachments off", () => {
    const engine = createFakeE2eeEngine({
      conversations: [conversation()],
      messages: { [GROUP_G]: timeline },
      attachmentsEnabled: false,
    });
    render(
      <E2eeTestProvider value={contextFor(engine)}>
        <E2eeConversationView g={GROUP_G} />
      </E2eeTestProvider>
    );
    expect(
      screen.queryByRole("button", { name: "Attach files" })
    ).not.toBeInTheDocument();
    expect(document.querySelector('input[type="file"]')).toBeNull();
  });

  it("shows the delayed-change banner and blocks the composer", () => {
    renderView(conversation({ delayed: true }));
    expect(
      screen.getByText(
        "Group changes are delayed. Messages will send once the change goes through."
      )
    ).toBeInTheDocument();
    expect(
      screen.getByText("Sending is paused until the group change goes through.")
    ).toBeInTheDocument();
    expect(
      screen.queryByLabelText("Encrypted message")
    ).not.toBeInTheDocument();
  });

  it("alerts on a possible split view and opens safety codes", async () => {
    renderView(conversation({ splitView: true }));
    expect(screen.getByText(SPLIT_VIEW_BANNER)).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: "Compare safety codes" })
    );
    const dialog = await screen.findByRole("dialog", { name: "Chat info" });
    expect(
      within(dialog).getByText("Safety code: abcd ef01 2345 6789")
    ).toBeInTheDocument();
    expect(
      within(dialog).getByText(
        "Compare this code with the other members in person or in another app you trust. If everyone sees the same code, no one has been added to this chat without your knowledge."
      )
    ).toBeInTheDocument();
  });

  it("pauses an invalid chat and restarts it with the same people", async () => {
    const engine = renderView(conversation({ status: "invalid" }));
    expect(
      screen.getByText("This chat is paused because of an invalid change.")
    ).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", {
        name: "Start a new encrypted chat with the same people",
      })
    );
    await waitFor(() => expect(engine.restart).toHaveBeenCalledWith(GROUP_G));
    expect(mockPush).toHaveBeenCalledWith(`/messages/encrypted/${DM_G}`);
  });

  it("gives admins member management in the info panel", async () => {
    const engine = renderView();
    fireEvent.click(screen.getByRole("button", { name: "Chat info" }));
    const dialog = await screen.findByRole("dialog", { name: "Chat info" });
    expect(within(dialog).getByText("Admin")).toBeInTheDocument();
    fireEvent.click(
      within(dialog).getByRole("button", { name: "Make alice an admin" })
    );
    await waitFor(() =>
      expect(engine.setAdmin).toHaveBeenCalledWith(GROUP_G, ALICE_ID, true)
    );
    expect(within(dialog).getByLabelText("Group name")).toHaveValue(
      "Collectors"
    );
    expect(
      within(dialog).getByRole("button", { name: "Leave chat" })
    ).toBeInTheDocument();
  });

  it("hides admin actions from non-admins", async () => {
    renderView(conversation({ admins: [ALICE_ID] }));
    fireEvent.click(screen.getByRole("button", { name: "Chat info" }));
    const dialog = await screen.findByRole("dialog", { name: "Chat info" });
    expect(
      within(dialog).queryByRole("button", { name: /Remove alice/ })
    ).not.toBeInTheDocument();
    expect(
      within(dialog).queryByLabelText("Group name")
    ).not.toBeInTheDocument();
  });

  it("announces incoming messages but not the initial history", () => {
    const engine = createFakeE2eeEngine({
      conversations: [conversation()],
      messages: { [GROUP_G]: timeline },
    });
    render(
      <E2eeTestProvider value={contextFor(engine)}>
        <E2eeConversationView g={GROUP_G} />
      </E2eeTestProvider>
    );
    expect(
      screen.queryByText("New message from alice")
    ).not.toBeInTheDocument();
    act(() =>
      engine.update({
        messages: {
          [GROUP_G]: [...timeline, message({ id: "m9", seq: 9, text: "new" })],
        },
      })
    );
    expect(screen.getByText("New message from alice")).toBeInTheDocument();
  });

  it("reports a chat that is not on this device after syncing", async () => {
    const engine = createFakeE2eeEngine();
    render(
      <E2eeTestProvider value={contextFor(engine)}>
        <E2eeConversationView g={GROUP_G} />
      </E2eeTestProvider>
    );
    expect(
      await screen.findByText("Chat not found on this device")
    ).toBeInTheDocument();
    expect(engine.sync).toHaveBeenCalled();
  });
});

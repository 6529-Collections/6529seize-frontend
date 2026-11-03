import { act, render, screen, within } from "@testing-library/react";
import { E2eeConversationListPage } from "@/components/e2ee/list/E2eeConversationListPage";
import { E2eeMessagesSection } from "@/components/e2ee/sidebar/E2eeMessagesSection";
import { setE2eeChatMuted } from "@/components/e2ee/e2eeMutedChats";
import { useE2eeUnreadSummary } from "@/hooks/e2ee/useE2ee";
import {
  ALICE_ID,
  contextFor,
  conversation,
  createFakeE2eeEngine,
  DM_G,
  E2eeTestProvider,
  GROUP_G,
  member,
  message,
  SELF_ID,
} from "./fakeE2eeEngine";

const mockPathname = jest.fn(() => "/messages");
jest.mock("next/navigation", () => ({
  usePathname: () => mockPathname(),
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
}));

const conversations = [
  conversation({
    unread: 3,
    mentions: 1,
    lastMessage: message({ id: "m1", text: "gm everyone" }),
  }),
  conversation({
    g: DM_G,
    kind: "dm",
    name: null,
    members: [member(SELF_ID, "me"), member(ALICE_ID, "alice")],
    status: "invalid",
    lastMessage: message({ id: "m2", g: DM_G, deleted: true }),
  }),
];

describe("encrypted conversation list", () => {
  beforeEach(() => {
    globalThis.localStorage.clear();
    mockPathname.mockReturnValue("/messages/encrypted");
  });

  it("lists chats with previews, unread counts and status", () => {
    render(
      <E2eeTestProvider
        value={contextFor(createFakeE2eeEngine({ conversations }))}
      >
        <E2eeConversationListPage />
      </E2eeTestProvider>
    );
    const list = screen.getByRole("list", { name: "Encrypted chats" });
    const rows = within(list).getAllByRole("link");
    expect(rows[0]).toHaveAttribute("href", `/messages/encrypted/${GROUP_G}`);
    expect(rows[0]).toHaveTextContent("Collectors");
    expect(rows[0]).toHaveTextContent("gm everyone");
    expect(within(rows[0]!).getByText("3 unread messages")).toBeInTheDocument();
    expect(within(rows[0]!).getByText("1 mention")).toBeInTheDocument();
    // A DM is titled by the other person.
    expect(rows[1]).toHaveTextContent("alice");
    expect(rows[1]).toHaveTextContent("Message deleted");
    expect(rows[1]).toHaveTextContent("Paused");
    expect(
      screen.getByRole("heading", { name: "Encrypted messages" })
    ).toBeInTheDocument();
    expect(screen.getByText("End-to-end encrypted")).toBeInTheDocument();
  });

  it("marks a chat muted on this device and leaves it out of the badge", () => {
    setE2eeChatMuted(SELF_ID, GROUP_G, true);
    const engine = createFakeE2eeEngine({ conversations });
    const summaries: { unread: number; hasUnread: boolean }[] = [];
    function Summary() {
      summaries.push(useE2eeUnreadSummary());
      return null;
    }
    render(
      <E2eeTestProvider value={contextFor(engine)}>
        <E2eeConversationListPage />
        <Summary />
      </E2eeTestProvider>
    );
    const list = screen.getByRole("list", { name: "Encrypted chats" });
    const [mutedRow] = within(list).getAllByRole("link");
    expect(mutedRow).toHaveTextContent("Muted");
    expect(mutedRow).not.toHaveTextContent("3 unread messages");
    // The only other chat is paused, so nothing counts.
    expect(summaries.at(-1)).toMatchObject({ unread: 0, hasUnread: false });
  });

  it("shows one DM row for ended and concurrent chats, preserving unread counts and the active history", () => {
    const pair = {
      kind: "dm" as const,
      admins: [SELF_ID, ALICE_ID],
      members: [member(SELF_ID, "me"), member(ALICE_ID, "alice")],
    };
    const currentG = `0x${"a".repeat(64)}`;
    const otherG = `0x${"b".repeat(64)}`;
    const oldG = `0x${"c".repeat(64)}`;
    const current = conversation({ ...pair, g: currentG, unread: 2 });
    const other = conversation({ ...pair, g: otherG, unread: 4 });
    const old = conversation({
      ...pair,
      g: oldG,
      status: "left",
      unread: 20,
      updatedAt: current.updatedAt + 1,
    });
    mockPathname.mockReturnValue(`/messages/encrypted/${oldG}`);
    setE2eeChatMuted(SELF_ID, otherG, true);
    render(
      <E2eeTestProvider
        value={contextFor(
          createFakeE2eeEngine({ conversations: [old, other, current] })
        )}
      >
        <E2eeConversationListPage />
        <E2eeMessagesSection />
      </E2eeTestProvider>
    );
    for (const list of screen.getAllByRole("list")) {
      const links = within(list).queryAllByRole("link");
      if (links.length === 0) continue;
      expect(links).toHaveLength(1);
      expect(links[0]).toHaveAttribute(
        "href",
        `/messages/encrypted/${currentG}`
      );
      expect(links[0]).toHaveTextContent("2 unread messages");
    }
    expect(screen.getByRole("link", { current: "page" })).toHaveAttribute(
      "href",
      `/messages/encrypted/${currentG}`
    );
  });

  it("opens the history with unread incoming messages when concurrent chats share a row", () => {
    const pair = {
      kind: "dm" as const,
      admins: [SELF_ID, ALICE_ID],
      members: [member(SELF_ID, "me"), member(ALICE_ID, "alice")],
    };
    const current = conversation({ ...pair, g: "a" });
    const incoming = conversation({ ...pair, g: "b", unread: 1 });
    render(
      <E2eeTestProvider
        value={contextFor(
          createFakeE2eeEngine({ conversations: [current, incoming] })
        )}
      >
        <E2eeConversationListPage />
      </E2eeTestProvider>
    );
    const row = within(
      screen.getByRole("list", { name: "Encrypted chats" })
    ).getByRole("link");
    expect(row).toHaveAttribute("href", "/messages/encrypted/b");
    expect(row).toHaveTextContent("1 unread message");
  });

  it("keeps unread histories unread until viewed and previews the history it opens", () => {
    const pair = {
      kind: "dm" as const,
      admins: [SELF_ID, ALICE_ID],
      members: [member(SELF_ID, "me"), member(ALICE_ID, "alice")],
    };
    const earlier = conversation({ ...pair, g: "a", unread: 2 });
    const incoming = conversation({
      ...pair,
      g: "b",
      unread: 3,
      updatedAt: earlier.updatedAt + 1,
      lastMessage: message({
        id: "incoming",
        g: "b",
        text: "new incoming history",
      }),
    });
    const muted = conversation({
      ...pair,
      g: "c",
      unread: 9,
      updatedAt: earlier.updatedAt + 2,
      lastMessage: message({
        id: "muted",
        g: "c",
        text: "muted history preview",
      }),
    });
    setE2eeChatMuted(SELF_ID, "c", true);
    const engine = createFakeE2eeEngine({
      conversations: [earlier, incoming, muted],
    });
    render(
      <E2eeTestProvider value={contextFor(engine)}>
        <E2eeConversationListPage />
      </E2eeTestProvider>
    );
    const getRow = () =>
      within(screen.getByRole("list", { name: "Encrypted chats" })).getByRole(
        "link"
      );
    expect(getRow()).toHaveTextContent("5 unread messages");
    expect(getRow()).toHaveTextContent("new incoming history");
    expect(getRow()).not.toHaveTextContent("muted history preview");
    expect(getRow()).toHaveAttribute("href", "/messages/encrypted/b");
    act(() =>
      engine.update({
        conversations: [earlier, { ...incoming, unread: 0 }, muted],
      })
    );
    expect(getRow()).toHaveTextContent("2 unread messages");
    expect(getRow()).toHaveAttribute("href", "/messages/encrypted/a");
  });

  it("shows an empty state with a way to start a chat", () => {
    render(
      <E2eeTestProvider value={contextFor(createFakeE2eeEngine())}>
        <E2eeConversationListPage />
      </E2eeTestProvider>
    );
    expect(screen.getByText("No encrypted chats yet")).toBeInTheDocument();
    const links = screen.getAllByRole("link", { name: "New encrypted chat" });
    expect(links[0]).toHaveAttribute("href", "/messages/encrypted/new");
  });
});

describe("E2eeMessagesSection", () => {
  it("renders nothing when encrypted messages are off", () => {
    const { container } = render(
      <E2eeTestProvider value={contextFor(null, { availability: "disabled" })}>
        <E2eeMessagesSection />
      </E2eeTestProvider>
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("is a single entry before this browser enrolled", () => {
    render(
      <E2eeTestProvider value={contextFor(null, { availability: "idle" })}>
        <E2eeMessagesSection />
      </E2eeTestProvider>
    );
    expect(
      screen.getByRole("link", { name: /Encrypted messages/ })
    ).toHaveAttribute("href", "/messages/encrypted");
    expect(
      screen.getByRole("heading", { name: "Direct messages" })
    ).toBeInTheDocument();
  });

  it("lists encrypted chats and marks the open one", () => {
    mockPathname.mockReturnValue(`/messages/encrypted/${GROUP_G}`);
    render(
      <E2eeTestProvider
        value={contextFor(createFakeE2eeEngine({ conversations }))}
      >
        <E2eeMessagesSection />
      </E2eeTestProvider>
    );
    const active = screen.getByRole("link", { current: "page" });
    expect(active).toHaveAttribute("href", `/messages/encrypted/${GROUP_G}`);
  });
});

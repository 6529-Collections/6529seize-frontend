import { act, fireEvent, render, screen, within } from "@testing-library/react";
import type { ReactNode } from "react";
import { E2eeRenewalBanner } from "@/components/e2ee/gate/E2eeRenewalBanner";
import { E2eeConversationListPage } from "@/components/e2ee/list/E2eeConversationListPage";
import { E2eeMessagesSection } from "@/components/e2ee/sidebar/E2eeMessagesSection";
import { setE2eeChatMuted } from "@/components/e2ee/e2eeMutedChats";
import { useE2eeUnreadSummary } from "@/hooks/e2ee/useE2ee";
import {
  ALICE_ID,
  BOB_ID,
  contextFor,
  conversation,
  createFakeE2eeEngine,
  device,
  DM_G,
  E2eeTestProvider,
  GROUP_G,
  member,
  message,
  SELF_ID,
} from "./fakeE2eeEngine";

const mockSecurityState = jest.fn();
const emojiSource = "data:image/webp;base64,UklGRg==";
const mockEmojiSources = new Map([["gm", emojiSource]]);
jest.mock("@/components/e2ee/conversation/E2eeEmojiProvider", () => ({
  E2eeEmojiProvider: ({ children }: { children: ReactNode }) => children,
  useE2eeEmojis: () => ({ sources: mockEmojiSources, native: new Map() }),
}));
const mockSearch = jest.fn(() => new URLSearchParams());
jest.mock("@/components/device-signing/DeviceSecurityStatus", () => ({
  useDeviceSecurityState: () => mockSecurityState(),
}));
jest.mock("@/hooks/device-signing/useEnableSignedMessages", () => ({
  useEnableSignedMessages: () => ({ canEnable: false, isEnabling: false }),
}));

const mockOpenComposer = jest.fn();
jest.mock("@/hooks/useCreateModalState", () => ({
  __esModule: true,
  default: () => ({ isApp: false, openDirectMessage: mockOpenComposer }),
}));

const mockPathname = jest.fn(() => "/messages");
jest.mock("next/navigation", () => ({
  usePathname: () => mockPathname(),
  useSearchParams: () => mockSearch(),
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
    mockSecurityState.mockReturnValue({
      proofGrant: null,
      proofRenewal: null,
      encryptionRenewal: null,
    });
    mockSearch.mockReturnValue(new URLSearchParams());
    mockPathname.mockReturnValue("/messages/encrypted");
  });

  it("shares a combined renewal dismissal between Waves and Messages", () => {
    const expiresAt = Date.UTC(2026, 10, 10);
    const thisDevice = device({
      deviceKey: "combined-device",
      authorProofGrantId: "combined-grant",
      expiresAt,
    });
    mockSecurityState.mockReturnValue({
      proofGrant: { id: "combined-grant", expires_at: expiresAt },
      proofRenewal: 1000,
      encryptionRenewal: 1000,
    });
    const context = contextFor(createFakeE2eeEngine({ thisDevice }));
    const banner = (
      <E2eeTestProvider value={context}>
        <E2eeRenewalBanner />
      </E2eeTestProvider>
    );
    const { rerender } = render(banner);
    expect(
      screen.getByRole("button", { name: "Renew signed posts" })
    ).toBeVisible();
    expect(
      screen.getByRole("button", { name: "Renew encrypted DMs" })
    ).toBeVisible();
    fireEvent.click(
      screen.getByRole("button", { name: "Dismiss renewal reminder" })
    );
    mockPathname.mockReturnValue("/waves/example");
    rerender(
      <E2eeTestProvider value={context}>
        <E2eeRenewalBanner />
      </E2eeTestProvider>
    );
    expect(
      screen.queryByRole("button", { name: "Renew signed posts" })
    ).toBeNull();
  });

  it("previews renewal only on Waves and Messages without enabling signing", () => {
    mockSearch.mockReturnValue(new URLSearchParams("showRenewal=true"));
    mockPathname.mockReturnValue("/preferences");
    const { rerender } = render(<E2eeRenewalBanner />);
    expect(
      screen.queryByRole("button", { name: "Renew encrypted DMs" })
    ).toBeNull();
    mockPathname.mockReturnValue("/messages/example");
    rerender(<E2eeRenewalBanner />);
    expect(
      screen.getByRole("button", { name: "Renew encrypted DMs" })
    ).toBeDisabled();
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

  it.each([
    { name: "inbox", Component: E2eeConversationListPage },
    { name: "sidebar", Component: E2eeMessagesSection },
  ])(
    "formats Markdown in $name previews without nested links or resources",
    ({ Component }) => {
      const chats = [
        conversation({
          lastMessage: message({
            id: "markdown-preview",
            senderProfileId: SELF_ID,
            text: "**Bold** *italic* ~~struck~~ [Link](https://preview.invalid)\n\n```js\nconsole.log('hi');\n```\n\n- first\n- second\n\n![Photo](https://preview.invalid/image.png)",
          }),
        }),
      ];
      render(
        <E2eeTestProvider
          value={contextFor(createFakeE2eeEngine({ conversations: chats }))}
        >
          <Component />
        </E2eeTestProvider>
      );
      const row = within(
        screen.getByRole("list", { name: "Encrypted chats" })
      ).getByRole("link");
      expect(row).toHaveTextContent(
        "You: Bold italic struck Link console.log('hi'); first second Photo"
      );
      expect(row.querySelector("strong")).toHaveTextContent("Bold");
      expect(row.querySelector("em")).toHaveTextContent("italic");
      expect(row.querySelector("del")).toHaveTextContent("struck");
      expect(row.querySelector("code")).toHaveTextContent("console.log('hi');");
      expect(
        row.querySelector("a, img, input, pre, p, ul, li, div")
      ).toBeNull();
      expect(row).not.toHaveTextContent("https://preview.invalid");
      expect(row).not.toHaveTextContent("```");
    }
  );

  it.each([
    { name: "inbox", Component: E2eeConversationListPage },
    { name: "sidebar", Component: E2eeMessagesSection },
  ])("renders compact custom emojis in $name previews", ({ Component }) => {
    const chats = [
      conversation({
        lastMessage: message({
          id: "custom-emoji-preview",
          senderProfileId: SELF_ID,
          text: "gm :gm: 😀 :unknown:",
        }),
      }),
    ];
    render(
      <E2eeTestProvider
        value={contextFor(createFakeE2eeEngine({ conversations: chats }))}
      >
        <Component />
      </E2eeTestProvider>
    );
    const row = within(
      screen.getByRole("list", { name: "Encrypted chats" })
    ).getByRole("link");
    const emoji = within(row).getByRole("img", { name: ":gm:" });
    expect(emoji).toHaveAttribute("src", emojiSource);
    expect(emoji).toHaveAttribute("width", "16");
    expect(emoji).toHaveAttribute("height", "16");
    expect(emoji.parentElement).toHaveClass("tw-truncate");
    expect(row).toHaveTextContent("You: gm 😀 :unknown:");
    expect(row).toHaveAttribute("href", `/messages/encrypted/${GROUP_G}`);
  });

  it("lists a DM holding someone else as its own chat, by its members", () => {
    const pair = {
      kind: "dm" as const,
      name: null,
      admins: [SELF_ID, ALICE_ID],
    };
    const real = conversation({
      ...pair,
      g: DM_G,
      members: [member(SELF_ID, "me"), member(ALICE_ID, "alice")],
    });
    // Sorts first by g, so it would have been the current chat with alice.
    const crowded = conversation({
      ...pair,
      g: GROUP_G,
      lastMessage: message({ id: "m3", senderProfileId: BOB_ID, text: "hi" }),
    });
    render(
      <E2eeTestProvider
        value={contextFor(
          createFakeE2eeEngine({ conversations: [real, crowded] })
        )}
      >
        <E2eeConversationListPage />
      </E2eeTestProvider>
    );
    const list = screen.getByRole("list", { name: "Encrypted chats" });
    const rows = within(list).getAllByRole("link");
    expect(rows.map((row) => row.getAttribute("href")).sort()).toEqual(
      [`/messages/encrypted/${DM_G}`, `/messages/encrypted/${GROUP_G}`].sort()
    );
    const crowdedRow = rows.find((row) =>
      row.getAttribute("href")?.endsWith(GROUP_G)
    );
    expect(crowdedRow).toHaveTextContent("alice and bob");
    expect(crowdedRow).toHaveTextContent("bob: hi");
    const realRow = rows.find((row) =>
      row.getAttribute("href")?.endsWith(DM_G)
    );
    expect(realRow).toHaveTextContent("alice");
    expect(realRow).not.toHaveTextContent("bob");
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
    const lists = screen.getAllByRole("list", { name: "Encrypted chats" });
    expect(lists).toHaveLength(2);
    const [inbox, sidebar] = lists;
    for (const [list, href] of [
      [inbox!, `/messages/encrypted/${currentG}`],
      [sidebar!, "/messages/encrypted"],
    ] as const) {
      const links = within(list).queryAllByRole("link");
      expect(links).toHaveLength(1);
      expect(links[0]).toHaveAttribute("href", href);
      expect(links[0]).toHaveTextContent("2 unread messages");
    }
    expect(
      within(sidebar!).getByRole("link", { current: "page" })
    ).toBeVisible();
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

  it.each(["left", "invalid", "restored"] as const)(
    "preserves unread and mention counts on a %s group chat",
    (status) => {
      render(
        <E2eeTestProvider
          value={contextFor(
            createFakeE2eeEngine({
              conversations: [conversation({ status, unread: 3, mentions: 1 })],
            })
          )}
        >
          <E2eeConversationListPage />
        </E2eeTestProvider>
      );
      const row = within(
        screen.getByRole("list", { name: "Encrypted chats" })
      ).getByRole("link");
      expect(row).toHaveTextContent("3 unread messages");
      expect(row).toHaveTextContent("1 mention");
    }
  );

  it.each([false, true])(
    "keeps the displayed ended DM history counts and mute state (muted: %s)",
    (muted) => {
      const pair = {
        kind: "dm" as const,
        admins: [SELF_ID, ALICE_ID],
        members: [member(SELF_ID, "me"), member(ALICE_ID, "alice")],
      };
      const earlier = conversation({
        ...pair,
        g: "old",
        status: "left",
        unread: 9,
      });
      const latest = conversation({
        ...pair,
        g: "latest",
        status: "left",
        unread: 2,
        mentions: 1,
        updatedAt: earlier.updatedAt + 1,
      });
      setE2eeChatMuted(SELF_ID, latest.g, muted);
      render(
        <E2eeTestProvider
          value={contextFor(
            createFakeE2eeEngine({ conversations: [earlier, latest] })
          )}
        >
          <E2eeConversationListPage />
        </E2eeTestProvider>
      );
      const row = within(
        screen.getByRole("list", { name: "Encrypted chats" })
      ).getByRole("link");
      expect(row).toHaveAttribute("href", "/messages/encrypted/latest");
      expect(within(row).queryByText("2 unread messages") !== null).toBe(
        !muted
      );
      expect(within(row).queryByText("1 mention") !== null).toBe(!muted);
      expect(within(row).queryByText("Muted") !== null).toBe(muted);
      expect(row).not.toHaveTextContent("9 unread messages");
    }
  );

  it("shows an empty state with a way to start a chat", () => {
    render(
      <E2eeTestProvider value={contextFor(createFakeE2eeEngine())}>
        <E2eeConversationListPage />
      </E2eeTestProvider>
    );
    expect(screen.getByText("No encrypted chats yet")).toBeInTheDocument();
    const compose = screen.getByRole("button", { name: "New message" });
    expect(compose).toHaveClass("lg:tw-hidden");
    fireEvent.click(compose);
    expect(mockOpenComposer).toHaveBeenCalledTimes(1);
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

  it.each([false, true])(
    "links the selected chat back to the inbox (collapsed: %s)",
    (collapsed) => {
      mockPathname.mockReturnValue(`/messages/encrypted/${GROUP_G}`);
      render(
        <E2eeTestProvider
          value={contextFor(createFakeE2eeEngine({ conversations }))}
        >
          <E2eeMessagesSection collapsed={collapsed} />
        </E2eeTestProvider>
      );
      const list = within(
        screen.getByRole("list", { name: "Encrypted chats" })
      );
      expect(list.getByRole("link", { current: "page" })).toHaveAttribute(
        "href",
        "/messages/encrypted"
      );
      expect(
        list.getByRole("link", { current: false, name: /alice/ })
      ).toHaveAttribute("href", `/messages/encrypted/${DM_G}`);
    }
  );
});

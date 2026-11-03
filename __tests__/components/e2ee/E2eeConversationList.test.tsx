import { fireEvent, render, screen, within } from "@testing-library/react";
import { E2eeRenewalBanner } from "@/components/e2ee/gate/E2eeRenewalBanner";
import { E2eeConversationListPage } from "@/components/e2ee/list/E2eeConversationListPage";
import { E2eeMessagesSection } from "@/components/e2ee/sidebar/E2eeMessagesSection";
import { setE2eeChatMuted } from "@/components/e2ee/e2eeMutedChats";
import { useE2eeUnreadSummary } from "@/hooks/e2ee/useE2ee";
import {
  ALICE_ID,
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
const mockSearch = jest.fn(() => new URLSearchParams());
jest.mock("@/components/device-signing/DeviceSecurityStatus", () => ({
  useDeviceSecurityState: () => mockSecurityState(),
}));
jest.mock("@/hooks/device-signing/useEnableSignedMessages", () => ({
  useEnableSignedMessages: () => ({ canEnable: false, isEnabling: false }),
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
      screen.getByRole("button", { name: "Renew author proof" })
    ).toBeVisible();
    expect(
      screen.getByRole("button", { name: "Renew encryption" })
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
      screen.queryByRole("button", { name: "Renew author proof" })
    ).toBeNull();
  });

  it("previews renewal only on Waves and Messages without enabling signing", () => {
    mockSearch.mockReturnValue(new URLSearchParams("showRenewal=true"));
    mockPathname.mockReturnValue("/preferences");
    const { rerender } = render(<E2eeRenewalBanner />);
    expect(
      screen.queryByRole("button", { name: "Renew encryption" })
    ).toBeNull();
    mockPathname.mockReturnValue("/messages/example");
    rerender(<E2eeRenewalBanner />);
    expect(
      screen.getByRole("button", { name: "Renew encryption" })
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

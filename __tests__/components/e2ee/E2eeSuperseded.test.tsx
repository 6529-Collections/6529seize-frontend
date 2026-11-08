jest.unmock("lexical");
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import type { ReactNode } from "react";
import { E2eeConversationView } from "@/components/e2ee/conversation/E2eeConversationView";
import { E2eeConversationList } from "@/components/e2ee/list/E2eeConversationList";
import type { E2eeConversation } from "@/lib/e2ee/types";
import { E2EE_MESSAGES } from "@/i18n/messages/e2ee";
import {
  ALICE_ID,
  BOB_ID,
  contextFor,
  conversation,
  createFakeE2eeEngine,
  E2eeTestProvider,
  GROUP_G,
  member,
  message,
  SELF_ID,
  type FakeE2eeEngine,
} from "./fakeE2eeEngine";

// jsdom has no element scrolling.
Element.prototype.scrollTo = jest.fn();
Element.prototype.scrollIntoView = jest.fn();

const mockPush = jest.fn();
jest.mock("@/hooks/content-moderation/useProfileBlockState", () => ({
  useProfileBlockState: () => ({ block: jest.fn() }),
}));
jest.mock("@/components/e2ee/gate/E2eeRenewalBanner", () => ({
  E2eeRenewalBanner: () => null,
}));
jest.mock("@/components/e2ee/conversation/E2eeEmojiProvider", () => ({
  E2eeEmojiProvider: ({ children }: { children: ReactNode }) => children,
  useE2eeEmojis: () => ({ sources: new Map() }),
}));
jest.mock("next/navigation", () => ({
  usePathname: () => "/messages/encrypted/0x",
  useRouter: () => ({
    push: mockPush,
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
}));

const OLD_DM = `0x${"1".repeat(64)}`;
const NEW_DM = `0x${"2".repeat(64)}`;
const NEW_GROUP = `0x${"3".repeat(64)}`;

const COPY = {
  body: E2EE_MESSAGES["e2ee.superseded.body"],
  announce: E2EE_MESSAGES["e2ee.superseded.announce"],
  continueDm: E2EE_MESSAGES["e2ee.superseded.continueDm"],
  restartGroup: E2EE_MESSAGES["e2ee.superseded.restartGroup"],
  openSuccessor: E2EE_MESSAGES["e2ee.superseded.openSuccessor"],
  notice: E2EE_MESSAGES["e2ee.superseded.notice"],
  noticeLink: E2EE_MESSAGES["e2ee.superseded.noticeLink"],
  skip: E2EE_MESSAGES["e2ee.superseded.skipToAction"],
};

const e2eeError = (code: string) =>
  Object.assign(new Error(code), { name: "E2eeError", code });

/** The en-US template with its `{param}` placeholders filled in. */
const copy = (
  key: keyof typeof E2EE_MESSAGES,
  params: Record<string, string>
): string =>
  Object.entries(params).reduce(
    (text, [name, value]) => text.replace(`{${name}}`, value),
    String(E2EE_MESSAGES[key])
  );

/** The handle the conversation factory gives a member. */
const handleOf = (item: E2eeConversation, profileId: string): string => {
  const handle = item.members.find(
    (person) => person.profileId === profileId
  )?.handle;
  if (!handle) throw new Error(`No handle for ${profileId}`);
  return handle;
};

const dm = (
  g: string,
  status: E2eeConversation["status"],
  overrides: Partial<E2eeConversation> = {}
) =>
  conversation({
    g,
    kind: "dm",
    name: null,
    admins: [SELF_ID, ALICE_ID],
    members: [member(SELF_ID, "me"), member(ALICE_ID, "alice")],
    status,
    ...overrides,
  });

const group = (overrides: Partial<E2eeConversation> = {}) =>
  conversation({ status: "superseded", ...overrides });

const renderView = (g: string, conversations: E2eeConversation[]) => {
  const engine = createFakeE2eeEngine({
    conversations,
    messages: {
      [g]: [message({ id: "m1", g, seq: 1, text: "kept message" })],
    },
  });
  render(
    <E2eeTestProvider value={contextFor(engine)}>
      <E2eeConversationView g={g} />
    </E2eeTestProvider>
  );
  return engine;
};

const composerBox = () =>
  screen.queryByRole("textbox", { name: "Encrypted message" });

beforeEach(() => {
  jest.clearAllMocks();
  globalThis.localStorage.clear();
});

describe("a superseded DM", () => {
  it("keeps history readable and replaces the composer with Continue", () => {
    const engine = renderView(OLD_DM, [dm(OLD_DM, "superseded")]);

    expect(screen.getByText("kept message")).toBeInTheDocument();
    expect(composerBox()).not.toBeInTheDocument();
    expect(screen.getByText(COPY.body)).toBeInTheDocument();
    const action = screen.getByRole("button", { name: COPY.continueDm });
    expect(action).toHaveAccessibleDescription(COPY.body);
    // The history section does not offer a second, different continue action.
    expect(
      screen.queryByRole("button", { name: "Continue encrypted chat" })
    ).not.toBeInTheDocument();
    // Opening a chat that is already read-only moves nothing and says nothing.
    expect(action).not.toHaveFocus();
    expect(screen.queryByText(COPY.announce)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: COPY.skip }));
    expect(action).toHaveFocus();
    expect(engine.restart).not.toHaveBeenCalled();
  });

  it("continues in a successor session and opens it", async () => {
    const engine = renderView(OLD_DM, [dm(OLD_DM, "superseded")]);
    jest.mocked(engine.restart).mockResolvedValueOnce(NEW_DM);

    fireEvent.click(screen.getByRole("button", { name: COPY.continueDm }));

    await waitFor(() =>
      expect(mockPush).toHaveBeenCalledWith(`/messages/encrypted/${NEW_DM}`)
    );
    expect(engine.restart).toHaveBeenCalledWith(OLD_DM);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("re-enables the action when navigation leaves the view mounted", async () => {
    const engine = renderView(OLD_DM, [dm(OLD_DM, "superseded")]);
    jest.mocked(engine.restart).mockResolvedValue(NEW_DM);
    const action = screen.getByRole("button", { name: COPY.continueDm });

    fireEvent.click(action);

    await waitFor(() => expect(mockPush).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(action).toBeEnabled());
    expect(action).not.toHaveAttribute("aria-busy", "true");
    // Restart is idempotent: pressing again opens the same chat.
    fireEvent.click(action);
    await waitFor(() => expect(mockPush).toHaveBeenCalledTimes(2));
    expect(mockPush).toHaveBeenLastCalledWith(`/messages/encrypted/${NEW_DM}`);
  });

  it("says the person is reachable once they upgrade when they have no device yet", async () => {
    const old = dm(OLD_DM, "superseded");
    const engine = renderView(OLD_DM, [old]);
    jest
      .mocked(engine.restart)
      .mockRejectedValueOnce(e2eeError("E2EE_NO_DEVICES"));

    fireEvent.click(screen.getByRole("button", { name: COPY.continueDm }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      copy("e2ee.superseded.noDevices.dm", { name: handleOf(old, ALICE_ID) })
    );
    expect(mockPush).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: COPY.continueDm })).toBeEnabled();
  });

  it("uses the new-chat copy when the person no longer accepts messages", async () => {
    const engine = renderView(OLD_DM, [dm(OLD_DM, "superseded")]);
    jest.mocked(engine.restart).mockRejectedValueOnce(e2eeError("E2EE_POLICY"));

    fireEvent.click(screen.getByRole("button", { name: COPY.continueDm }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      E2EE_MESSAGES["e2ee.new.eligibility.POLICY"]
    );
  });

  it("links to the session that already continues it", () => {
    const engine = renderView(OLD_DM, [
      dm(OLD_DM, "superseded", { successor: NEW_DM }),
      dm(NEW_DM, "active", { predecessor: OLD_DM }),
    ]);

    expect(screen.getByRole("link", { name: COPY.continueDm })).toHaveAttribute(
      "href",
      `/messages/encrypted/${NEW_DM}`
    );
    expect(
      screen.queryByRole("link", { name: "Open current chat" })
    ).not.toBeInTheDocument();
    // Both sessions stay in one thread.
    expect(
      within(
        screen.getByRole("combobox", { name: "Chat history" })
      ).getAllByRole("option")
    ).toHaveLength(2);
    expect(engine.restart).not.toHaveBeenCalled();
  });
});

describe("a superseded group", () => {
  it("starts again with the same members and opens the new group", async () => {
    const engine = renderView(GROUP_G, [group()]);
    jest.mocked(engine.restart).mockImplementationOnce(async () => {
      engine.update({
        conversations: [
          ...engine.state.conversations,
          conversation({ g: NEW_GROUP, predecessor: GROUP_G }),
        ],
      });
      return NEW_GROUP;
    });

    expect(composerBox()).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: COPY.restartGroup }));

    await waitFor(() =>
      expect(mockPush).toHaveBeenCalledWith(`/messages/encrypted/${NEW_GROUP}`)
    );
    expect(engine.restart).toHaveBeenCalledWith(GROUP_G);
  });

  it("says the members are reachable once they upgrade when nobody can be added", async () => {
    const engine = renderView(GROUP_G, [group()]);
    jest
      .mocked(engine.restart)
      .mockRejectedValueOnce(e2eeError("E2EE_NO_DEVICES"));

    fireEvent.click(screen.getByRole("button", { name: COPY.restartGroup }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      E2EE_MESSAGES["e2ee.superseded.noDevices.group"]
    );
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("names the people skipped and links to the new group", async () => {
    const old = group();
    const engine = renderView(GROUP_G, [old]);
    jest.mocked(engine.restart).mockImplementationOnce(async () => {
      engine.update({
        conversations: [
          ...engine.state.conversations,
          conversation({
            g: NEW_GROUP,
            predecessor: GROUP_G,
            members: old.members.filter(
              (person) => person.profileId !== BOB_ID
            ),
          }),
        ],
      });
      return NEW_GROUP;
    });
    const button = screen.getByRole("button", { name: COPY.restartGroup });
    act(() => button.focus());

    fireEvent.click(button);

    const link = await screen.findByRole("link", { name: COPY.openSuccessor });
    expect(link).toHaveAttribute("href", `/messages/encrypted/${NEW_GROUP}`);
    const skipped = screen.getByText(
      copy("e2ee.superseded.skipped", { names: handleOf(old, BOB_ID) })
    );
    expect(skipped.tagName).toBe("OUTPUT");
    expect(skipped).toBeVisible();
    expect(link).toHaveFocus();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("links to a successor this device already has", () => {
    renderView(GROUP_G, [
      group({ successor: NEW_GROUP }),
      conversation({ g: NEW_GROUP, predecessor: GROUP_G }),
    ]);

    expect(
      screen.getByRole("link", { name: COPY.openSuccessor })
    ).toHaveAttribute("href", `/messages/encrypted/${NEW_GROUP}`);
    expect(
      screen.queryByRole("button", { name: COPY.restartGroup })
    ).not.toBeInTheDocument();
  });
});

describe("turning read-only while open", () => {
  const goSuperseded = (engine: FakeE2eeEngine) =>
    act(() =>
      engine.update({
        conversations: engine.state.conversations.map((item) => ({
          ...item,
          status: "superseded" as const,
        })),
      })
    );

  it("moves focus from the composer to the continue action", async () => {
    const engine = renderView(GROUP_G, [conversation()]);
    const attach = await screen.findByRole("button", { name: "Attach files" });
    act(() => attach.focus());
    expect(attach).toHaveFocus();

    goSuperseded(engine);

    expect(
      screen.getByRole("button", { name: COPY.restartGroup })
    ).toHaveFocus();
    // Focus carries the explanation; the live region stays quiet.
    expect(screen.queryByText(COPY.announce)).not.toBeInTheDocument();
  });

  it("announces the change once when focus was elsewhere", async () => {
    const engine = renderView(GROUP_G, [conversation()]);
    await screen.findByRole("button", { name: "Attach files" });

    goSuperseded(engine);

    expect(screen.getByText(COPY.announce).tagName).toBe("OUTPUT");
    expect(
      screen.getByRole("button", { name: COPY.restartGroup })
    ).not.toHaveFocus();
  });
});

describe("the stronger-encryption notice", () => {
  it("opens the DM session that follows a superseded one", () => {
    renderView(NEW_DM, [
      dm(OLD_DM, "superseded"),
      dm(NEW_DM, "active", { updatedAt: Date.UTC(2026, 10, 8) }),
    ]);

    const timeline = screen.getByText(COPY.notice);
    expect(timeline).toBeInTheDocument();
    expect(
      timeline.closest('[role="status"],[role="alert"],[aria-live]')
    ).toBeNull();
    expect(screen.getByRole("link", { name: COPY.noticeLink })).toHaveAttribute(
      "href",
      `/messages/encrypted/${OLD_DM}`
    );
    expect(composerBox()).toBeInTheDocument();
  });

  it("is absent from the superseded session itself", () => {
    renderView(OLD_DM, [dm(OLD_DM, "superseded"), dm(NEW_DM, "active")]);
    expect(screen.queryByText(COPY.notice)).not.toBeInTheDocument();
  });

  it("is absent from a DM with no superseded session", () => {
    renderView(NEW_DM, [dm(NEW_DM, "active")]);
    expect(screen.queryByText(COPY.notice)).not.toBeInTheDocument();
  });

  it("tops a group whose predecessor is set", () => {
    renderView(NEW_GROUP, [
      group(),
      conversation({ g: NEW_GROUP, predecessor: GROUP_G }),
    ]);

    expect(screen.getByText(COPY.notice)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: COPY.noticeLink })).toHaveAttribute(
      "href",
      `/messages/encrypted/${GROUP_G}`
    );
  });

  it("skips the link when the earlier group is not on this device", () => {
    renderView(NEW_GROUP, [
      conversation({ g: NEW_GROUP, predecessor: GROUP_G }),
    ]);

    expect(screen.getByText(COPY.notice)).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: COPY.noticeLink })
    ).not.toBeInTheDocument();
  });

  it("is absent from a group without a predecessor", () => {
    renderView(GROUP_G, [conversation()]);
    expect(screen.queryByText(COPY.notice)).not.toBeInTheDocument();
  });
});

it("labels a superseded group read-only in the list", () => {
  render(
    <E2eeConversationList
      conversations={[group()]}
      selfProfileId={SELF_ID}
      label="Encrypted chats"
    />
  );
  expect(
    screen.getByText(E2EE_MESSAGES["e2ee.list.status.superseded"])
  ).toBeInTheDocument();
});

it("groups a superseded DM and its successor into one list entry", () => {
  render(
    <E2eeConversationList
      conversations={[
        dm(OLD_DM, "superseded"),
        dm(NEW_DM, "active", { predecessor: OLD_DM }),
      ]}
      selfProfileId={SELF_ID}
      label="Encrypted chats"
    />
  );
  const list = screen.getByRole("list", { name: "Encrypted chats" });
  expect(within(list).getAllByRole("link")).toHaveLength(1);
  expect(within(list).getByRole("link")).toHaveAttribute(
    "href",
    `/messages/encrypted/${NEW_DM}`
  );
  expect(
    screen.queryByText(E2EE_MESSAGES["e2ee.list.status.superseded"])
  ).not.toBeInTheDocument();
});

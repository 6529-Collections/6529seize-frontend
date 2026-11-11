import type { ComponentProps } from "react";
import type DirectMessageRecipients from "@/components/waves/create-dm/DirectMessageRecipients";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import {
  clearE2eeComposePrefill,
  setE2eeComposePrefill,
} from "@/components/e2ee/e2eeComposePrefill";
import { E2eeNewConversation } from "@/components/e2ee/new/E2eeNewConversation";
import { NewMessageForm } from "@/components/e2ee/new/NewMessageForm";
import { useE2ee } from "@/hooks/e2ee/useE2ee";
import { LEGACY_DM_DELETION_AT } from "@/components/e2ee/legacy/legacyDmRetention";
import type { CommunityMemberMinimal } from "@/entities/IProfile";
import {
  ALICE_ID,
  BOB_ID,
  contextFor,
  conversation,
  member,
  createFakeE2eeEngine,
  DM_G,
  E2eeTestProvider,
  GROUP_G,
  SELF_ID,
} from "./fakeE2eeEngine";

const mockPush = jest.fn();
jest.mock("next/navigation", () => ({
  usePathname: () => "/messages/encrypted/new",
  useRouter: () => ({
    push: mockPush,
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
}));

const identity = (
  profileId: string | null,
  handle: string
): CommunityMemberMinimal => ({
  profile_id: profileId,
  handle,
  normalised_handle: handle,
  primary_wallet: `0x${handle.padEnd(40, "0")}`,
  display: handle,
  tdh: 0,
  level: 0,
  cic_rating: 0,
  wallet: `0x${handle.padEnd(40, "0")}`,
  pfp: null,
});

const searchResults: CommunityMemberMinimal[] = [
  identity(ALICE_ID, "alice"),
  identity(BOB_ID, "bob"),
  identity("profile-carol", "carol"),
  identity(SELF_ID, "me"),
];

// The real picker queries the API; keep its selected status and controls here.
jest.mock("@/components/waves/create-dm/DirectMessageRecipients", () => ({
  __esModule: true,
  recipientKey: (person: CommunityMemberMinimal) =>
    person.wallet ?? person.profile_id,
  recipientName: (person: CommunityMemberMinimal) => person.handle,
  default: ({
    onToggle,
    selectionStatus,
  }: ComponentProps<typeof DirectMessageRecipients>) => (
    <div>
      {searchResults.map((result) => (
        <button
          key={result.handle}
          type="button"
          onClick={() => onToggle(result)}
        >
          pick {result.handle}
        </button>
      ))}
      {selectionStatus}
    </div>
  ),
}));

const renderNew = (engine = createFakeE2eeEngine()) => {
  render(
    <E2eeTestProvider value={contextFor(engine)}>
      <E2eeNewConversation />
    </E2eeTestProvider>
  );
  return engine;
};

describe("E2eeNewConversation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    clearE2eeComposePrefill();
  });

  it("explains why each person can't receive encrypted messages", async () => {
    const engine = createFakeE2eeEngine();
    (engine.checkEligibility as jest.Mock).mockResolvedValue([
      {
        profileId: ALICE_ID,
        status: "POLICY",
        reason: "DM_RECIPIENT_GROUP_MEMBERS_ONLY",
      },
      {
        profileId: BOB_ID,
        status: "BLOCKED",
        reason: "DM_SENDER_BLOCKED_RECIPIENT",
      },
      { profileId: "profile-carol", status: "NO_DEVICES" },
    ]);
    renderNew(engine);
    fireEvent.click(screen.getByRole("button", { name: "pick alice" }));
    fireEvent.click(screen.getByRole("button", { name: "pick bob" }));
    fireEvent.click(screen.getByRole("button", { name: "pick carol" }));

    expect(
      await screen.findByText(
        "Only accepts messages from members of a group they chose"
      )
    ).toBeInTheDocument();
    expect(
      screen.getByText("You blocked them. Unblock to message.")
    ).toBeInTheDocument();
    expect(
      screen.getByText("Hasn’t turned on encrypted messages yet")
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Remove the people who can’t receive encrypted messages to continue."
      )
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Start chat" })).toBeDisabled();
  });

  it("does not add the viewer", () => {
    renderNew();
    fireEvent.click(screen.getByRole("button", { name: "pick me" }));
    expect(
      screen.getByText("You’re already in this chat.")
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Start chat" })).toBeDisabled();
  });

  it("creates a DM with one eligible person and opens it", async () => {
    const engine = renderNew();
    fireEvent.click(screen.getByRole("button", { name: "pick alice" }));
    expect(
      await screen.findByText("Can receive encrypted messages")
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Start chat" }));
    await waitFor(() =>
      expect(engine.createConversation).toHaveBeenCalledWith({
        profileIds: [ALICE_ID],
        kind: "dm",
        name: null,
        requireAllRecipients: true,
      })
    );
    expect(mockPush).toHaveBeenCalledWith(`/messages/encrypted/${GROUP_G}`);
  });

  it("asks for a group name only once a second person is chosen", () => {
    renderNew();
    fireEvent.click(screen.getByRole("button", { name: "pick alice" }));
    fireEvent.click(screen.getByText("More options"));
    fireEvent.click(screen.getByRole("checkbox", { name: /Create a group/ }));
    expect(screen.queryByLabelText("Group name (optional)")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "pick bob" }));
    expect(screen.getByLabelText("Group name (optional)")).toBeInTheDocument();
  });

  it("makes several people a named group", async () => {
    const engine = renderNew();
    fireEvent.click(screen.getByRole("button", { name: "pick alice" }));
    fireEvent.click(screen.getByRole("button", { name: "pick bob" }));
    fireEvent.change(screen.getByLabelText("Group name (optional)"), {
      target: { value: "  Night owls " },
    });
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Start chat" })).toBeEnabled()
    );
    fireEvent.click(screen.getByRole("button", { name: "Start chat" }));
    await waitFor(() =>
      expect(engine.createConversation).toHaveBeenCalledWith({
        profileIds: [ALICE_ID, BOB_ID],
        kind: "group",
        name: "Night owls",
        requireAllRecipients: true,
      })
    );
  });

  it("offers the existing encrypted DM instead of a duplicate", async () => {
    const engine = createFakeE2eeEngine();
    (engine.findDm as jest.Mock).mockReturnValue(DM_G);
    renderNew(engine);
    fireEvent.click(screen.getByRole("button", { name: "pick alice" }));
    const open = screen.getByRole("button", { name: "Open chat" });
    fireEvent.click(open);
    expect(mockPush).toHaveBeenCalledWith(`/messages/encrypted/${DM_G}`);
    expect(engine.createConversation).not.toHaveBeenCalled();
  });

  it("starts prefilled from a plaintext DM without copying history", async () => {
    setE2eeComposePrefill({
      ownerProfileId: SELF_ID,
      source: "dm",
      people: [
        { profileId: ALICE_ID, handle: "alice", pfp: null, wallet: null },
        { profileId: SELF_ID, handle: "me", pfp: null, wallet: null },
      ],
    });
    renderNew();
    expect(
      screen.getByText(
        "Starting from a direct message. Earlier messages aren’t copied; the encrypted chat starts empty."
      )
    ).toBeInTheDocument();
    const people = screen.getByRole("list", { name: "People in this chat" });
    expect(people).toHaveTextContent("alice");
    expect(people).not.toHaveTextContent("me");
    expect(
      await screen.findByText("Can receive encrypted messages")
    ).toBeInTheDocument();
  });
});

const participants = [
  member(SELF_ID, "me"),
  member(ALICE_ID, "alice"),
  member(BOB_ID, "bob"),
];

function pick(...handles: string[]) {
  for (const handle of handles) {
    fireEvent.click(screen.getByRole("button", { name: "pick " + handle }));
  }
}

function PlaintextCapableForm({
  create,
}: {
  readonly create: (wallets: string[]) => Promise<string | null>;
}) {
  return <NewMessageForm e2ee={useE2ee()} createUnencrypted={create} />;
}

describe("unified new message", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    clearE2eeComposePrefill();
    jest
      .spyOn(Date, "now")
      .mockReturnValue(Date.parse(LEGACY_DM_DELETION_AT) - 60_000);
  });

  afterEach(() => jest.restoreAllMocks());

  it("requests the encryption engine after the first recipient is selected", () => {
    const context = contextFor(null);
    render(
      <E2eeTestProvider value={context}>
        <PlaintextCapableForm create={jest.fn()} />
      </E2eeTestProvider>
    );
    expect(context.requestEngine).not.toHaveBeenCalled();
    pick("alice");
    expect(context.requestEngine).toHaveBeenCalledTimes(1);
  });

  it("offers one exact active group without including a partial roster or an earlier group", () => {
    const engine = createFakeE2eeEngine({
      conversations: [
        conversation({
          g: "exact",
          name: "Weekend plans",
          members: participants,
        }),
        conversation({
          g: "partial",
          name: "Partial group",
          members: participants.slice(0, 2),
        }),
        conversation({
          g: "left",
          name: "Previous group",
          members: participants,
          status: "left",
        }),
      ],
    });
    renderNew(engine);
    pick("alice", "bob");
    expect(screen.getByText("Weekend plans")).toBeInTheDocument();
    expect(screen.queryByText("Partial group")).toBeNull();
    expect(screen.queryByText("Previous group")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Open chat" }));
    expect(mockPush).toHaveBeenCalledWith("/messages/encrypted/exact");
    expect(engine.createConversation).not.toHaveBeenCalled();
  });

  it("asks which group to open and keeps the new name when switching back and forth", async () => {
    const engine = createFakeE2eeEngine({
      conversations: [
        conversation({
          g: "weekend",
          name: "Weekend plans",
          members: participants,
        }),
        conversation({
          g: "project",
          name: "Project updates",
          members: participants,
        }),
      ],
    });
    renderNew(engine);
    pick("alice", "bob");
    expect(screen.getByRole("button", { name: "Open chat" })).toBeDisabled();
    fireEvent.click(screen.getByRole("radio", { name: /Project updates/ }));
    fireEvent.click(screen.getByRole("button", { name: "Open chat" }));
    expect(mockPush).toHaveBeenCalledWith("/messages/encrypted/project");

    fireEvent.click(screen.getByRole("button", { name: "Start a new group" }));
    fireEvent.change(screen.getByLabelText("Group name (optional)"), {
      target: { value: "New topic" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "View existing groups" })
    );
    fireEvent.click(screen.getByRole("button", { name: "Start a new group" }));
    expect(screen.getByLabelText("Group name (optional)")).toHaveValue(
      "New topic"
    );
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Start chat" })).toBeEnabled()
    );
    fireEvent.click(screen.getByRole("button", { name: "Start chat" }));
    expect(engine.createConversation).toHaveBeenCalledWith({
      kind: "group",
      name: "New topic",
      requireAllRecipients: true,
      profileIds: [ALICE_ID, BOB_ID],
    });
  });

  it("requires a new choice when the selected group stops matching", () => {
    const weekend = conversation({
      g: "weekend",
      name: "Weekend plans",
      members: participants,
    });
    const project = conversation({
      g: "project",
      name: "Project updates",
      members: participants,
    });
    const engine = createFakeE2eeEngine({ conversations: [weekend, project] });
    renderNew(engine);
    pick("alice", "bob");
    fireEvent.click(screen.getByRole("radio", { name: /Project updates/ }));
    const open = screen.getByRole("button", { name: "Open chat" });
    expect(open).toBeEnabled();

    act(() => engine.update({ conversations: [weekend] }));
    expect(
      screen.getByText(
        "The selected group no longer matches. Choose a group to open."
      )
    ).toBeVisible();
    expect(open).toBeDisabled();
    expect(mockPush).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("radio", { name: /Weekend plans/ }));
    fireEvent.click(open);
    expect(mockPush).toHaveBeenCalledWith("/messages/encrypted/weekend");
  });

  it("keeps a mixed group's name and selection while making fallback explicit", async () => {
    const engine = createFakeE2eeEngine();
    jest.mocked(engine.checkEligibility).mockResolvedValue([
      { profileId: ALICE_ID, status: "OK" },
      { profileId: BOB_ID, status: "NO_DEVICES" },
    ]);
    const create = jest.fn(async () => "Request failed");
    render(
      <E2eeTestProvider value={contextFor(engine)}>
        <PlaintextCapableForm create={create} />
      </E2eeTestProvider>
    );
    pick("alice", "bob");
    fireEvent.change(screen.getByLabelText("Group name (optional)"), {
      target: { value: "Design review" },
    });
    await screen.findByText(
      "Remove the people who can’t receive encrypted messages to continue."
    );
    expect(screen.getByRole("button", { name: "Start chat" })).toBeDisabled();
    fireEvent.click(
      screen.getByRole("button", { name: "Use unencrypted chat instead" })
    );
    expect(screen.getByText(/deletes it from its servers/)).toBeVisible();
    expect(create).not.toHaveBeenCalled();
    fireEvent.click(
      screen.getByRole("button", { name: "Continue unencrypted" })
    );
    expect(create).toHaveBeenCalledWith([
      identity(ALICE_ID, "alice").wallet,
      identity(BOB_ID, "bob").wallet,
    ]);
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Request failed"
    );
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Use encrypted chat" })
      ).toBeEnabled()
    );
    fireEvent.click(screen.getByRole("button", { name: "Use encrypted chat" }));
    expect(screen.queryByText("Request failed")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Group name (optional)")).toHaveValue(
      "Design review"
    );
    expect(screen.getByRole("button", { name: "Start chat" })).toBeDisabled();
  });

  it.each([
    { status: "NO_DEVICES", afterCutoff: false, fallback: true },
    { status: "NO_DEVICES", afterCutoff: true, fallback: false },
    { status: "POLICY", afterCutoff: false, fallback: false },
    { status: "BLOCKED", afterCutoff: false, fallback: false },
  ] as const)(
    "offers fallback only for a recipient without encryption before the cutoff ($status, closed=$afterCutoff)",
    async ({ status, afterCutoff, fallback }) => {
      if (afterCutoff)
        jest
          .mocked(Date.now)
          .mockReturnValue(Date.parse(LEGACY_DM_DELETION_AT));
      const engine = createFakeE2eeEngine();
      jest
        .mocked(engine.checkEligibility)
        .mockResolvedValue([{ profileId: ALICE_ID, status }]);
      const create = jest.fn(async () => null);
      render(
        <E2eeTestProvider value={contextFor(engine)}>
          <PlaintextCapableForm create={create} />
        </E2eeTestProvider>
      );
      pick("alice");
      if (fallback) {
        fireEvent.click(
          await screen.findByRole("button", { name: "Continue unencrypted" })
        );
        expect(create).toHaveBeenCalledWith([
          identity(ALICE_ID, "alice").wallet,
        ]);
      } else {
        const blockedLabel =
          status === "BLOCKED"
            ? /You blocked them/
            : /Doesn’t accept messages from you/;
        await screen.findByText(
          afterCutoff ? /Unencrypted messaging has ended/ : blockedLabel
        );
        expect(
          screen.queryByRole("button", { name: "Continue unencrypted" })
        ).toBeNull();
        expect(
          screen.getByRole("button", { name: "Start chat" })
        ).toBeDisabled();
      }
    }
  );

  it("blocks an unencrypted submit after the cutoff even if the old button is visible", async () => {
    const engine = createFakeE2eeEngine();
    jest
      .mocked(engine.checkEligibility)
      .mockResolvedValue([{ profileId: ALICE_ID, status: "NO_DEVICES" }]);
    const create = jest.fn(async () => null);
    render(
      <E2eeTestProvider value={contextFor(engine)}>
        <PlaintextCapableForm create={create} />
      </E2eeTestProvider>
    );
    pick("alice");
    const fallback = await screen.findByRole("button", {
      name: "Continue unencrypted",
    });
    jest.mocked(Date.now).mockReturnValue(Date.parse(LEGACY_DM_DELETION_AT));
    fireEvent.click(fallback);
    expect(create).not.toHaveBeenCalled();
    expect(engine.createConversation).not.toHaveBeenCalled();
  });
});

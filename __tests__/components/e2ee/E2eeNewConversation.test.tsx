import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import {
  clearE2eeComposePrefill,
  setE2eeComposePrefill,
} from "@/components/e2ee/e2eeComposePrefill";
import { E2eeNewConversation } from "@/components/e2ee/new/E2eeNewConversation";
import type { CommunityMemberMinimal } from "@/entities/IProfile";
import {
  ALICE_ID,
  BOB_ID,
  contextFor,
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

// The real search queries the API; here each result is a button.
jest.mock(
  "@/components/groups/page/create/config/identities/select/GroupCreateIdentitiesSearch",
  () => ({
    __esModule: true,
    default: ({
      onIdentitySelect,
      label,
    }: {
      readonly onIdentitySelect: (identity: CommunityMemberMinimal) => void;
      readonly label: string;
    }) => (
      <div aria-label={label}>
        {searchResults.map((result) => (
          <button
            key={result.handle}
            type="button"
            onClick={() => onIdentitySelect(result)}
          >
            pick {result.handle}
          </button>
        ))}
      </div>
    ),
  })
);

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
    expect(
      screen.getByRole("button", { name: "Start encrypted chat" })
    ).toBeDisabled();
  });

  it("does not add the viewer", () => {
    renderNew();
    fireEvent.click(screen.getByRole("button", { name: "pick me" }));
    expect(
      screen.getByText("You’re already in this chat.")
    ).toBeInTheDocument();
    expect(screen.getByText("No one selected yet.")).toBeInTheDocument();
  });

  it("creates a DM with one eligible person and opens it", async () => {
    const engine = renderNew();
    fireEvent.click(screen.getByRole("button", { name: "pick alice" }));
    expect(
      await screen.findByText("Can receive encrypted messages")
    ).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: /Direct message/ })).toBeChecked();
    fireEvent.click(
      screen.getByRole("button", { name: "Start encrypted chat" })
    );
    await waitFor(() =>
      expect(engine.createConversation).toHaveBeenCalledWith({
        profileIds: [ALICE_ID],
        kind: "dm",
        name: null,
      })
    );
    expect(mockPush).toHaveBeenCalledWith(`/messages/encrypted/${GROUP_G}`);
  });

  it("asks for a group name only once a second person is chosen", () => {
    renderNew();
    fireEvent.click(screen.getByRole("button", { name: "pick alice" }));
    fireEvent.click(screen.getByRole("radio", { name: /^Group/u }));
    expect(screen.queryByLabelText("Group name (optional)")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "pick bob" }));
    expect(screen.getByLabelText("Group name (optional)")).toBeInTheDocument();
  });

  it("makes several people a named group", async () => {
    const engine = renderNew();
    fireEvent.click(screen.getByRole("button", { name: "pick alice" }));
    fireEvent.click(screen.getByRole("button", { name: "pick bob" }));
    expect(
      screen.getByRole("radio", { name: /Direct message/ })
    ).toBeDisabled();
    fireEvent.change(screen.getByLabelText("Group name (optional)"), {
      target: { value: "  Night owls " },
    });
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Start encrypted chat" })
      ).toBeEnabled()
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Start encrypted chat" })
    );
    await waitFor(() =>
      expect(engine.createConversation).toHaveBeenCalledWith({
        profileIds: [ALICE_ID, BOB_ID],
        kind: "group",
        name: "Night owls",
      })
    );
  });

  it("offers the existing encrypted DM instead of a duplicate", async () => {
    const engine = createFakeE2eeEngine();
    (engine.findDm as jest.Mock).mockReturnValue(DM_G);
    renderNew(engine);
    fireEvent.click(screen.getByRole("button", { name: "pick alice" }));
    expect(
      await screen.findByText("You already have an encrypted chat with alice.")
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Open chat" })).toHaveAttribute(
      "href",
      `/messages/encrypted/${DM_G}`
    );
    expect(
      screen.getByRole("button", { name: "Start encrypted chat" })
    ).toBeDisabled();
  });

  it("starts prefilled from a plaintext DM without copying history", async () => {
    setE2eeComposePrefill({
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

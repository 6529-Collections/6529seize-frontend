import { fireEvent, render, screen } from "@testing-library/react";
import { useEncryptedNotificationPreview } from "@/hooks/e2ee/useEncryptedNotificationPreview";
import type { INotificationEncryptedMessage } from "@/types/feed.types";
import NotificationInboxRow from "@/components/notifications/inbox/NotificationInboxRow";
import NotificationEncryptedMessage from "@/components/brain/notifications/NotificationEncryptedMessage";
import { groupReactionNotifications } from "@/components/brain/notifications/utils/groupReactionNotifications";
import { ApiNotificationCause } from "@/generated/models/ApiNotificationCause";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import type { ApiProfileMin } from "@/generated/models/ApiProfileMin";
import type { ApiWaveOverview } from "@/generated/models/ApiWaveOverview";
import type {
  INotificationDropReacted,
  INotificationVotingCreditsReturned,
} from "@/types/feed.types";
import { isGroupedReactionsItem } from "@/types/feed.types";

const mockLoadEmojiData = jest.fn(async () => {});
const mockFindCustomEmoji = jest.fn();
const mockFindNativeEmoji = jest.fn();
jest.mock("@/contexts/EmojiContext", () => ({
  useEmoji: () => ({
    loadEmojiData: mockLoadEmojiData,
    findCustomEmoji: mockFindCustomEmoji,
    findNativeEmoji: mockFindNativeEmoji,
  }),
}));

jest.mock("next/navigation", () => ({
  ...jest.requireActual("next/navigation"),
  useRouter: () => ({ push: jest.fn() }),
}));

jest.mock("@/hooks/e2ee/useEncryptedNotificationPreview", () => ({
  useEncryptedNotificationPreview: jest.fn(),
}));
beforeEach(() => {
  mockFindCustomEmoji.mockReturnValue(null);
  mockFindNativeEmoji.mockImplementation((id: string) =>
    id === "fire" ? { name: "Fire", skins: [{ native: "🔥" }] } : null
  );
  jest
    .mocked(useEncryptedNotificationPreview)
    .mockReturnValue({ preview: null, needsSetup: false });
});

jest.mock("@/hooks/useBrowserLocale", () => ({
  useBrowserLocale: () => "en-US",
}));
jest.mock("@/components/common/OverlappingAvatars", () => ({
  __esModule: true,
  default: ({ items }: { items: { key: string; ariaLabel: string }[] }) => (
    <span>{items.map((item) => item.ariaLabel).join(", ")}</span>
  ),
}));

const drop = {
  id: "drop",
  serial_no: 42,
  title: null,
  parts: [{ content: "@[GelatoGenesis] in #[QUORUM]" }],
  wave: { id: "wave", is_direct_message: false, picture: "wave.png" },
} as ApiDrop;

it("renders regular notification Markdown without truncating delimiters or nesting links", () => {
  const longBold = "formatted ".repeat(30).trim();
  const notification = {
    ...reaction(1, "alice", null),
    related_drops: [
      {
        ...drop,
        parts: [
          {
            part_id: 1,
            media: [],
            content: `**${longBold}** *italic* ~~gone~~ and \`code\`.\n\n[Link](https://example.com) ![Image](https://example.com/image.png)`,
          },
        ],
      },
    ],
  };
  const { container } = render(
    <NotificationInboxRow
      notification={notification}
      handle="viewer"
      onOpen={jest.fn()}
    />
  );
  expect(screen.getByText(longBold).tagName).toBe("STRONG");
  expect(screen.getByText("italic").tagName).toBe("EM");
  expect(screen.getByText("gone").tagName).toBe("DEL");
  expect(screen.getByText("code").tagName).toBe("CODE");
  expect(screen.getByText("Image")).toBeInTheDocument();
  expect(screen.getAllByRole("link")).toHaveLength(1);
  expect(screen.getByRole("link")).toHaveAttribute(
    "href",
    "/waves/wave?serialNo=42"
  );
  expect(
    container.querySelector(
      "a a,p p,iframe,video,audio,input,img[src*='example.com']"
    )
  ).toBeNull();
});

function reaction(
  id: number,
  handle: string,
  readAt: number | null,
  reactionCode = ":fire:"
): INotificationDropReacted {
  return {
    id,
    created_at: id,
    read_at: readAt,
    cause: ApiNotificationCause.DropReacted,
    related_identity: {
      id: handle,
      handle,
      pfp: `${handle}.png`,
    } as ApiProfileMin,
    related_drops: [drop],
    additional_context: { reaction: reactionCode },
  };
}

it("groups reactors, keeps mixed read state, and opens every distinct unread ID", () => {
  const onOpen = jest.fn();
  const group = groupReactionNotifications([
    reaction(3, "alice", 10),
    reaction(2, "bob", null),
    reaction(2, "carol", null),
    reaction(1, "bob", null),
  ])[0]!;
  render(
    <NotificationInboxRow
      notification={group}
      handle="viewer"
      onOpen={onOpen}
    />
  );
  expect(screen.getByText("New reactions to your drop")).toBeInTheDocument();
  expect(screen.getAllByRole("img", { name: "Fire" })).toHaveLength(1);
  expect(screen.getByText("🔥")).toBeInTheDocument();
  expect(screen.getByText("alice, bob, carol")).toBeInTheDocument();
  expect(screen.getByAltText("")).toHaveAttribute("src", "wave.png");
  expect(screen.getByText("@GelatoGenesis in #QUORUM")).toBeInTheDocument();
  expect(screen.getByText("Unread")).toBeInTheDocument();
  const link = screen.getByRole("link");
  expect(link).toHaveAttribute("href", "/waves/wave?serialNo=42");
  fireEvent.click(link);
  expect(onOpen).toHaveBeenCalledWith([2, 1]);
});

it("shows three reactors once when snapshots mix profile IDs and handle IDs", () => {
  const notifications = ["alice", "bob", "carol", "alice", "bob"].map(
    (handle, index) => {
      const notification = reaction(index + 1, handle, null);
      return {
        ...notification,
        related_identity: {
          ...notification.related_identity,
          id: index < 3 ? `profile-${handle}` : handle,
        },
      };
    }
  );
  const onOpen = jest.fn();
  render(
    <NotificationInboxRow
      notification={groupReactionNotifications(notifications)[0]!}
      handle="viewer"
      onOpen={onOpen}
    />
  );

  expect(screen.getByText("alice, bob, carol")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("link"));
  expect(onOpen).toHaveBeenCalledWith([1, 2, 3, 4, 5]);
});

it.each(["alice", "ALICE", " alice "])(
  "matches reactor handles across ID formats regardless of case or whitespace (%s)",
  (handle) => {
    const notification = reaction(1, handle, null);
    const first = {
      ...notification,
      related_identity: {
        ...notification.related_identity,
        id: "profile-alice",
      },
    };
    render(
      <NotificationInboxRow
        notification={
          groupReactionNotifications([first, reaction(2, "alice", null)])[0]!
        }
        handle="viewer"
        onOpen={jest.fn()}
      />
    );

    expect(screen.getByText("alice")).toBeInTheDocument();
  }
);

it("keeps distinct reactors without handles and deduplicates them by profile ID", () => {
  const notifications = ["alice", "bob", "alice"].map((id, index) => {
    const notification = reaction(index + 1, id, null);
    return {
      ...notification,
      related_identity: { ...notification.related_identity, handle: null },
    };
  });
  render(
    <NotificationInboxRow
      notification={groupReactionNotifications(notifications)[0]!}
      handle="viewer"
      onOpen={jest.fn()}
    />
  );

  expect(
    screen.getByText("Unknown profile, Unknown profile")
  ).toBeInTheDocument();
});

it("keeps single reactions readable and does not mark a read row again", () => {
  const onOpen = jest.fn();
  render(
    <NotificationInboxRow
      notification={reaction(1, "alice", 10)}
      handle="viewer"
      onOpen={onOpen}
    />
  );
  expect(screen.getByText("alice reacted to your drop")).toBeInTheDocument();
  expect(screen.getByRole("img", { name: "Fire" })).toBeInTheDocument();
  expect(mockLoadEmojiData).toHaveBeenCalled();
  expect(screen.getByAltText("")).toHaveAttribute("src", "alice.png");
  expect(screen.queryByText("Unread")).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("link"));
  expect(onOpen).toHaveBeenCalledWith([]);
});

it("shows each distinct native and custom emoji in a grouped preview", () => {
  mockFindCustomEmoji.mockImplementation((id: string) =>
    id === "6529" ? { name: "6529", skins: [{ src: "6529.webp" }] } : null
  );
  const custom = reaction(3, "carol", null, ":6529:");
  const group = groupReactionNotifications([
    reaction(1, "alice", null),
    reaction(2, "bob", null),
    custom,
  ])[0]!;
  render(
    <NotificationInboxRow
      notification={group}
      handle="viewer"
      onOpen={jest.fn()}
    />
  );
  expect(screen.getAllByRole("img", { name: "Fire" })).toHaveLength(1);
  expect(screen.getByRole("img", { name: "6529" })).toBeInTheDocument();
  expect(screen.getByAltText("6529")).toHaveAttribute("src", "6529.webp");
});

it("keeps a text fallback until emoji data loads without hiding the notification", () => {
  mockFindNativeEmoji.mockReturnValue(null);
  const notification = reaction(1, "alice", null);
  const { rerender } = render(
    <NotificationInboxRow
      notification={notification}
      handle="viewer"
      onOpen={jest.fn()}
    />
  );
  expect(screen.getByText(":fire:")).toBeInTheDocument();
  expect(screen.getByText("alice reacted to your drop")).toBeInTheDocument();
  mockFindNativeEmoji.mockReturnValue({
    name: "Fire",
    skins: [{ native: "🔥" }],
  });
  rerender(
    <NotificationInboxRow
      notification={notification}
      handle="viewer"
      onOpen={jest.fn()}
    />
  );
  expect(screen.queryByText(":fire:")).not.toBeInTheDocument();
  expect(screen.getByRole("img", { name: "Fire" })).toBeInTheDocument();
});

it("keeps an unavailable custom reaction readable", () => {
  const notification = reaction(1, "alice", null, ":removed_emoji:");
  render(
    <NotificationInboxRow
      notification={notification}
      handle="viewer"
      onOpen={jest.fn()}
    />
  );
  expect(screen.getByText(":removed_emoji:")).toBeInTheDocument();
  expect(screen.getByRole("link")).toHaveAttribute(
    "href",
    "/waves/wave?serialNo=42"
  );
});

it("shows raw Unicode reactions without adding shortcode delimiters", () => {
  const notification = reaction(1, "alice", null, "👍");
  render(
    <NotificationInboxRow
      notification={notification}
      handle="viewer"
      onOpen={jest.fn()}
    />
  );
  expect(screen.getByText("👍")).toBeInTheDocument();
  expect(screen.queryByText(":👍:")).not.toBeInTheDocument();
});

it("bounds grouped emoji previews and counts only additional distinct reactions", () => {
  const notifications = [
    "fire",
    "one",
    "two",
    "three",
    "four",
    "five",
    "six",
    "six",
    "seven",
    "",
  ].map((code, index) => ({
    ...reaction(index, `user-${index}`, null),
    additional_context: { reaction: code ? `:${code}:` : "" },
  }));
  const group = groupReactionNotifications(notifications)[0]!;
  render(
    <NotificationInboxRow
      notification={group}
      handle="viewer"
      onOpen={jest.fn()}
    />
  );
  expect(screen.getByRole("img", { name: "Fire" })).toBeInTheDocument();
  expect(screen.getByText(":five:")).toBeInTheDocument();
  expect(screen.queryByText(":six:")).not.toBeInTheDocument();
  expect(screen.queryByText(":seven:")).not.toBeInTheDocument();
  expect(screen.queryByText("::")).not.toBeInTheDocument();
  expect(screen.getByText("+2 more")).toBeInTheDocument();
});

it.each([undefined, null, "", "::"])(
  "keeps notifications usable when reaction data is missing or empty (%s)",
  (value) => {
    const notification = reaction(1, "alice", null);
    Reflect.set(notification.additional_context, "reaction", value);
    render(
      <NotificationInboxRow
        notification={notification}
        handle="viewer"
        onOpen={jest.fn()}
      />
    );
    expect(screen.getByText("alice reacted to your drop")).toBeInTheDocument();
    expect(screen.queryByText("::")).not.toBeInTheDocument();
    expect(screen.getByRole("link")).toHaveAttribute(
      "href",
      "/waves/wave?serialNo=42"
    );
  }
);

it("keeps the bell fallback for grouped reactions without a wave picture", () => {
  const group = groupReactionNotifications([
    reaction(1, "alice", null),
    reaction(2, "bob", null),
  ])[0]!;
  if (!isGroupedReactionsItem(group)) throw new Error("Expected a group");
  render(
    <NotificationInboxRow
      notification={{
        ...group,
        drop: { ...drop, wave: { ...drop.wave, picture: null } },
      }}
      handle="viewer"
      onOpen={jest.fn()}
    />
  );
  expect(screen.queryByAltText("")).not.toBeInTheDocument();
  expect(screen.getByRole("link").querySelector("svg")).toBeInTheDocument();
});

it.each(["wave.png", undefined])(
  "uses the returned-credit wave picture with a bell fallback (%s)",
  (pfp) => {
    const notification: INotificationVotingCreditsReturned = {
      id: 4,
      created_at: 4,
      read_at: null,
      cause: ApiNotificationCause.VotingCreditsReturned,
      ...(pfp ? { related_wave: { pfp } as ApiWaveOverview } : {}),
      additional_context: {
        event_id: "release",
        reason: "AUTHOR_DELETED",
        wave_id: "wave",
        competition_id: "competition",
        competition_title: "Main Stage",
        entry_id: "entry",
        drop_id: "deleted",
        submission_title: "Artwork",
        credit_type: "TDH",
        amount: 10,
        released_at: 3,
      },
    };
    render(
      <NotificationInboxRow
        notification={notification}
        handle="viewer"
        onOpen={jest.fn()}
      />
    );
    if (pfp) {
      expect(screen.getByAltText("")).toHaveAttribute("src", pfp);
    } else {
      expect(screen.queryByAltText("")).not.toBeInTheDocument();
      expect(screen.getByRole("link").querySelector("svg")).toBeInTheDocument();
    }
    expect(screen.getByRole("link")).toHaveAttribute(
      "href",
      "/waves/wave/decisions/competition"
    );
  }
);

it("uses the group's latest drop even when the first reaction is older", () => {
  const older = {
    ...reaction(1, "alice", 10),
    related_drops: [{ ...drop, title: "Old title", serial_no: 1 }],
  };
  const group = groupReactionNotifications([older, reaction(2, "bob", 10)])[0]!;
  render(
    <NotificationInboxRow
      notification={group}
      handle="viewer"
      onOpen={jest.fn()}
    />
  );
  expect(screen.getByText("@GelatoGenesis in #QUORUM")).toBeInTheDocument();
  expect(screen.queryByText("Old title")).not.toBeInTheDocument();
  expect(screen.getByRole("link")).toHaveAttribute(
    "href",
    "/waves/wave?serialNo=42"
  );
});

it.each([null, "A locally decrypted message"])(
  "preserves encrypted notification fallback or local preview (%s)",
  (preview) => {
    jest
      .mocked(useEncryptedNotificationPreview)
      .mockReturnValue({ preview, needsSetup: !preview });
    const notification: INotificationEncryptedMessage = {
      id: 12,
      created_at: 12,
      read_at: null,
      cause: ApiNotificationCause.E2EeMessage,
      additional_context: { encrypted_group: "0xgroup" },
    };
    const onOpen = jest.fn();
    render(
      <NotificationInboxRow
        notification={notification}
        handle="viewer"
        onOpen={onOpen}
      />
    );
    expect(useEncryptedNotificationPreview).toHaveBeenCalledWith(
      "0xgroup",
      undefined
    );
    expect(screen.getByText("New encrypted message")).toBeInTheDocument();
    expect(
      screen.getByText(preview ?? "Set up Encrypted DMs")
    ).toBeInTheDocument();
    expect(screen.getByRole("link")).toHaveAttribute(
      "href",
      "/messages/encrypted/0xgroup"
    );
    fireEvent.click(screen.getByRole("link"));
    expect(onOpen).toHaveBeenCalledWith([12]);
  }
);

it("links the sender avatar and handle separately from encrypted chat setup", () => {
  jest.mocked(useEncryptedNotificationPreview).mockReturnValue({
    preview: null,
    needsSetup: true,
  });
  const onOpen = jest.fn();
  render(
    <NotificationInboxRow
      notification={{
        id: 13,
        created_at: 13,
        read_at: null,
        cause: ApiNotificationCause.E2EeMessage,
        related_identity: {
          id: "alice",
          handle: "alice",
          pfp: "https://example.com/avatar.png",
          level: 80,
          artist_of_prevote_cards: [1],
        } as ApiProfileMin,
        additional_context: {
          encrypted_group: "0xgroup",
          encrypted_message_seq: 8,
        },
      }}
      handle="viewer"
      onOpen={onOpen}
    />
  );
  const sender = screen.getByRole("link", { name: "alice" });
  expect(sender).toHaveAttribute("href", "/alice");
  expect(sender.querySelector("img")).toBeInTheDocument();
  expect(screen.getByRole("img", { name: "Level 80" })).toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: "View 1 minted meme" })
  ).toBeInTheDocument();
  const setup = screen.getByRole("link", { name: "Set up Encrypted DMs" });
  expect(setup).toHaveAttribute("href", "/messages/encrypted/0xgroup");
  fireEvent.click(sender);
  expect(onOpen).not.toHaveBeenCalled();
  fireEvent.click(setup);
  expect(onOpen).toHaveBeenCalledWith([13]);
});

it.each(["overview", "page"])(
  "renders private Markdown in the notification %s without message links or resources",
  (surface) => {
    const longBold = "formatted ".repeat(30).trim();
    jest.mocked(useEncryptedNotificationPreview).mockReturnValue({
      preview: `\`\`\`js\nconsole.log("preview");\n\`\`\`\n\n**Bold** *italic* ~~struck~~ and \`code\`.\n\n**${longBold}**\n\n[Private link](https://private.invalid/link) ![Private image](https://private.invalid/image.png)\n\n<img src="https://private.invalid/html.png">\n\n- [x] Complete\n\n| Key | Value |\n| --- | --- |\n| A | B |`,
      needsSetup: false,
    });
    const notification: INotificationEncryptedMessage = {
      id: 14,
      created_at: 14,
      read_at: null,
      cause: ApiNotificationCause.E2EeMessage,
      additional_context: {
        encrypted_group: "0xgroup",
        encrypted_message_seq: 9,
      },
    };
    const { container } = render(
      surface === "overview" ? (
        <NotificationInboxRow
          notification={notification}
          handle="viewer"
          onOpen={jest.fn()}
        />
      ) : (
        <NotificationEncryptedMessage notification={notification} />
      )
    );
    expect(screen.getByText("Bold").tagName).toBe("STRONG");
    expect(screen.getByText("italic").tagName).toBe("EM");
    expect(screen.getByText("struck").tagName).toBe("DEL");
    expect(screen.getByText("code").tagName).toBe("CODE");
    expect(screen.getByText('console.log("preview");').tagName).toBe("CODE");
    expect(screen.getByText(longBold).tagName).toBe("STRONG");
    expect(screen.getByText("Private image")).toBeInTheDocument();
    expect(screen.getByRole("table")).toBeInTheDocument();
    expect(screen.getAllByRole("link")).toHaveLength(1);
    expect(screen.getByRole("link")).toHaveAttribute(
      "href",
      "/messages/encrypted/0xgroup"
    );
    expect(
      container.querySelector("a a,img,iframe,video,audio,source,input,script")
    ).toBeNull();
  }
);

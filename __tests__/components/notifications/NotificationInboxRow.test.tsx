import { fireEvent, render, screen } from "@testing-library/react";
import { useEncryptedNotificationPreview } from "@/hooks/e2ee/useEncryptedNotificationPreview";
import type { INotificationEncryptedMessage } from "@/types/feed.types";
import NotificationInboxRow from "@/components/notifications/inbox/NotificationInboxRow";
import { groupReactionNotifications } from "@/components/brain/notifications/utils/groupReactionNotifications";
import { ApiNotificationCause } from "@/generated/models/ApiNotificationCause";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import type { ApiProfileMin } from "@/generated/models/ApiProfileMin";
import type { INotificationDropReacted } from "@/types/feed.types";

jest.mock("@/hooks/e2ee/useEncryptedNotificationPreview", () => ({
  useEncryptedNotificationPreview: jest.fn(() => null),
}));
beforeEach(() => {
  jest.mocked(useEncryptedNotificationPreview).mockReturnValue(null);
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
jest.mock("@/components/common/profile/ProfileAvatar", () => ({
  __esModule: true,
  default: () => <span />,
}));

const drop = {
  id: "drop",
  serial_no: 42,
  title: null,
  parts: [{ content: "@[GelatoGenesis] in #[QUORUM]" }],
  wave: { id: "wave", is_direct_message: false },
} as ApiDrop;

function reaction(
  id: number,
  handle: string,
  readAt: number | null
): INotificationDropReacted {
  return {
    id,
    created_at: id,
    read_at: readAt,
    cause: ApiNotificationCause.DropReacted,
    related_identity: { id: handle, handle, pfp: null } as ApiProfileMin,
    related_drops: [drop],
    additional_context: { reaction: ":fire:" },
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
  expect(screen.getByText("alice, bob, carol")).toBeInTheDocument();
  expect(screen.getByText("@GelatoGenesis in #QUORUM")).toBeInTheDocument();
  expect(screen.getByText("Unread")).toBeInTheDocument();
  const link = screen.getByRole("link");
  expect(link).toHaveAttribute("href", "/waves/wave?serialNo=42");
  fireEvent.click(link);
  expect(onOpen).toHaveBeenCalledWith([2, 1]);
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
  expect(screen.queryByText("Unread")).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("link"));
  expect(onOpen).toHaveBeenCalledWith([]);
});

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
    jest.mocked(useEncryptedNotificationPreview).mockReturnValue(preview);
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
    expect(useEncryptedNotificationPreview).toHaveBeenCalledWith("0xgroup");
    expect(screen.getByText("New encrypted message")).toBeInTheDocument();
    if (preview) expect(screen.getByText(preview)).toBeInTheDocument();
    expect(screen.getByRole("link")).toHaveAttribute(
      "href",
      "/messages/encrypted/0xgroup"
    );
    fireEvent.click(screen.getByRole("link"));
    expect(onOpen).toHaveBeenCalledWith([12]);
  }
);

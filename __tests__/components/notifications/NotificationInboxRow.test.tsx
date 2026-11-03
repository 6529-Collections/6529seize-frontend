import { fireEvent, render, screen } from "@testing-library/react";
import NotificationInboxRow from "@/components/notifications/inbox/NotificationInboxRow";
import { groupReactionNotifications } from "@/components/brain/notifications/utils/groupReactionNotifications";
import { ApiNotificationCause } from "@/generated/models/ApiNotificationCause";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import type { ApiProfileMin } from "@/generated/models/ApiProfileMin";
import type { INotificationDropReacted } from "@/types/feed.types";

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

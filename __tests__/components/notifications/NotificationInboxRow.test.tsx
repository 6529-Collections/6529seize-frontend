import { fireEvent, render, screen } from "@testing-library/react";
import NotificationInboxRow from "@/components/notifications/inbox/NotificationInboxRow";
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
    related_identity: {
      id: handle,
      handle,
      pfp: `${handle}.png`,
    } as ApiProfileMin,
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
  expect(screen.getByAltText("")).toHaveAttribute("src", "wave.png");
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
  expect(screen.getByAltText("")).toHaveAttribute("src", "alice.png");
  expect(screen.queryByText("Unread")).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("link"));
  expect(onOpen).toHaveBeenCalledWith([]);
});

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
      "/waves/wave/competitions/competition"
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

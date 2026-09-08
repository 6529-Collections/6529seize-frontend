import type { Emoji, NativeEmoji } from "@/contexts/EmojiContext";
import { ApiNotificationCause } from "@/generated/models/ApiNotificationCause";
import type { ApiProfileMin } from "@/generated/models/ApiProfileMin";
import type {
  GroupedReactionsItem,
  INotificationDropReacted,
} from "@/types/feed.types";
import { render, screen } from "@testing-library/react";
const NotificationItem = jest.fn((_props: unknown) => (
  <div data-testid="item" />
));
const findCustomEmoji = jest.fn<Emoji | null, [string]>();
const findNativeEmoji = jest.fn<NativeEmoji | null, [string]>();

jest.mock("@/components/brain/notifications/NotificationItem", () => ({
  __esModule: true,
  default: NotificationItem,
}));

jest.mock(
  "@/components/brain/notifications/drop-reacted/NotificationDropReactedGroup",
  () => ({
    __esModule: true,
    default: () => <div data-testid="group" />,
  })
);

jest.mock("@/hooks/useBrowserLocale", () => ({
  useBrowserLocale: () => "en-US",
}));

jest.mock("@/hooks/useDeviceInfo", () => ({
  __esModule: true,
  default: () => ({ isApp: false }),
}));

jest.mock("@/contexts/EmojiContext", () => ({
  useEmoji: () => ({ findCustomEmoji, findNativeEmoji }),
}));

import NotificationItems from "@/components/brain/notifications/NotificationItems";
import React from "react";

describe("NotificationItems", () => {
  beforeEach(() => {
    NotificationItem.mockClear();
    findCustomEmoji.mockReset().mockReturnValue(null);
    findNativeEmoji.mockReset().mockImplementation((id) =>
      id === "heart"
        ? { id, name: "Heart", keywords: "heart", skins: [{ native: "❤️" }] }
        : null
    );
  });

  it("passes activeDrop only to the related notification row", () => {
    const active = { drop: { id: "active" } } as unknown;
    const items = [
      {
        id: "1",
        cause: "DROP_REPLIED",
        related_drops: [{ id: "original" }, { id: "active" }],
      },
      {
        id: "2",
        cause: "DROP_VOTED",
        related_drops: [{ id: "other" }],
      },
      {
        cause: "IDENTITY_SUBSCRIBED",
        related_drops: [],
      },
    ] as unknown[];
    const onReply = jest.fn();
    const onClick = jest.fn();

    const { container } = render(
      <NotificationItems
        items={items as never[]}
        activeDrop={active as never}
        onReply={onReply}
        onDropContentClick={onClick}
      />
    );

    expect(NotificationItem).toHaveBeenCalledTimes(3);
    expect(
      Array.from(container.querySelectorAll('[id^="feed-item-"]')).map(
        (row) => row.id
      )
    ).toEqual(["feed-item-1", "feed-item-2", "feed-item-fallback-2"]);
    expect(container.querySelector("#feed-item-fallback-2")).not.toBeNull();
    const firstRow = container.querySelector("#feed-item-1") as HTMLElement;
    expect(firstRow.style.contentVisibility).toBe("auto");
    expect(firstRow.style.containIntrinsicSize).toBe("auto 400px");
    expect(firstRow.style.overflowClipMargin).toBe("4px");
    const firstCall = NotificationItem.mock.calls.at(0);
    const secondCall = NotificationItem.mock.calls.at(1);
    expect(firstCall?.[0]).toEqual(
      expect.objectContaining({
        notification: items[0],
        activeDrop: active,
        onReply,
        onDropContentClick: onClick,
      })
    );
    expect(secondCall?.[0]).toEqual(
      expect.objectContaining({
        notification: items[1],
        activeDrop: null,
        onReply,
        onDropContentClick: onClick,
      })
    );
  });

  const unreadNotification: INotificationDropReacted = {
    id: 4,
    cause: ApiNotificationCause.DropReacted,
    created_at: 100,
    read_at: null,
    related_identity: { id: "reactor-1" } as ApiProfileMin,
    related_drops: [{ id: "reacted-drop" } as GroupedReactionsItem["drop"]],
    additional_context: { reaction: ":heart:" },
  };

  it("labels only notifications with an unread API state", () => {
    const { container } = render(
      <NotificationItems
        items={[
          unreadNotification,
          { ...unreadNotification, id: 5, read_at: 0 },
        ]}
        activeDrop={null}
        onReply={jest.fn()}
      />
    );

    expect(screen.getAllByText("Unread")).toHaveLength(1);
    expect(container.querySelector("#feed-item-4")).toHaveTextContent("Unread");
    expect(container.querySelector("#feed-item-5")).not.toHaveTextContent(
      "Unread"
    );
  });

  it("updates grouped unread status when every notification is read", () => {
    findNativeEmoji.mockReturnValue(null);
    const group: GroupedReactionsItem = {
      type: "grouped_reactions",
      id: 5,
      createdAt: 100,
      drop: { id: "reacted-drop" } as GroupedReactionsItem["drop"],
      notifications: [
        { ...unreadNotification, id: 5, read_at: 200 },
        unreadNotification,
      ],
    };
    const onReply = jest.fn();
    const { rerender } = render(
      <NotificationItems items={[group]} activeDrop={null} onReply={onReply} />
    );

    expect(screen.getByTestId("group")).toBeInTheDocument();
    expect(screen.getByText("Unread")).toBeVisible();

    rerender(
      <NotificationItems
        items={[
          {
            ...group,
            notifications: group.notifications.map((notification) => ({
              ...notification,
              read_at: 200,
            })),
          },
        ]}
        activeDrop={null}
        onReply={onReply}
      />
    );

    expect(screen.getByTestId("group")).toBeInTheDocument();
    expect(screen.queryByText("Unread")).not.toBeInTheDocument();
  });

  it("omits unsupported reaction rows until their emoji becomes available", () => {
    const notification: INotificationDropReacted = {
      ...unreadNotification,
      additional_context: { reaction: ":custom-reaction:" },
    };
    const onReply = jest.fn();
    const { container, rerender } = render(
      <NotificationItems
        items={[notification]}
        activeDrop={null}
        onReply={onReply}
      />
    );

    expect(container.querySelector("#feed-item-4")).not.toBeInTheDocument();
    expect(screen.queryByText("Unread")).not.toBeInTheDocument();
    expect(NotificationItem).not.toHaveBeenCalled();

    findCustomEmoji.mockReturnValue({
      id: "custom-reaction",
      name: "Custom reaction",
      keywords: "reaction",
      skins: [{ src: "/custom-reaction.png" }],
    });
    rerender(
      <NotificationItems
        items={[notification]}
        activeDrop={null}
        onReply={onReply}
      />
    );

    expect(screen.getByTestId("item")).toBeInTheDocument();
    expect(screen.getByText("Unread")).toBeVisible();
  });

  it("omits rows with missing drop content but retains header-only alerts", () => {
    const { container } = render(
      <NotificationItems
        items={[
          { ...unreadNotification, id: 6, related_drops: [] },
          {
            ...unreadNotification,
            id: 7,
            cause: ApiNotificationCause.DropReplied,
            additional_context: {
              reply_drop_id: "missing-reply",
              replied_drop_id: "reacted-drop",
              replied_drop_part: "1",
            },
          },
          {
            ...unreadNotification,
            id: 8,
            cause: ApiNotificationCause.PriorityAlert,
            related_drops: [],
            additional_context: {},
          },
        ]}
        activeDrop={null}
        onReply={jest.fn()}
      />
    );

    expect(NotificationItem).toHaveBeenCalledTimes(1);
    expect(
      Array.from(container.querySelectorAll('[id^="feed-item-"]')).map(
        (row) => row.id
      )
    ).toEqual(["feed-item-8"]);
    expect(screen.getByText("Unread")).toBeVisible();
    expect(container.querySelector("#feed-item-8")).toHaveTextContent("Unread");
  });
});

import { render } from "@testing-library/react";
const NotificationItem = jest.fn((_props: unknown) => (
  <div data-testid="item" />
));

jest.mock("@/components/brain/notifications/NotificationItem", () => ({
  __esModule: true,
  default: NotificationItem,
}));

import NotificationItems from "@/components/brain/notifications/NotificationItems";
import React from "react";

describe("NotificationItems", () => {
  it("passes activeDrop only to the related notification row", () => {
    const active = { drop: { id: "active" } } as unknown;
    const items = [
      {
        id: "1",
        cause: "DROP_REPLIED",
        related_drops: [{ id: "active" }],
      },
      {
        id: "2",
        cause: "DROP_VOTED",
        related_drops: [{ id: "other" }],
      },
      {
        cause: "DROP_QUOTED",
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
    expect(container.querySelector("#feed-item-fallback-2")).not.toBeNull();
    const firstRow = container.querySelector("#feed-item-1") as HTMLElement;
    expect(firstRow.style.contentVisibility).toBe("auto");
    expect(firstRow.style.containIntrinsicSize).toBe("auto 400px");
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
});

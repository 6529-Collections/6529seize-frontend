import NotificationPriorityAlert from "@/components/brain/notifications/priority-alert/NotificationPriorityAlert";
import { render, screen } from "@testing-library/react";
import React from "react";

const mockRouter = { push: jest.fn() };
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(() => mockRouter),
  useSearchParams: jest.fn(),
  usePathname: jest.fn(),
}));

const DropMock = jest.fn((_props: unknown) => <div data-testid="drop" />);
jest.mock("@/components/waves/drops/Drop", () => ({
  __esModule: true,
  default: (props: unknown) => {
    DropMock(props);
    return <div data-testid="drop" />;
  },
  DropLocation: {
    MY_STREAM: "MY_STREAM",
    WAVE: "WAVE",
  },
}));

jest.mock("@/hooks/useDeviceInfo", () => ({
  __esModule: true,
  default: jest.fn(() => ({ isApp: false })),
}));

jest.mock("@/components/brain/notifications/NotificationsFollowBtn", () => ({
  __esModule: true,
  default: () => <button data-testid="follow-btn">Follow</button>,
}));

jest.mock(
  "@/components/brain/notifications/subcomponents/NotificationHeader",
  () => ({
    __esModule: true,
    default: ({
      author,
      children,
    }: {
      author: { handle: string };
      children: React.ReactNode;
    }) => (
      <div data-testid="notification-header">
        <span>{author.handle}</span>
        {children}
      </div>
    ),
  })
);

const baseNotification: any = {
  id: 1,
  cause: "PRIORITY_ALERT" as any,
  related_identity: { handle: "alice", pfp: null },
  related_drops: [
    {
      id: "d",
      wave: { id: "w" },
      author: { handle: "alice" },
      serial_no: 1,
      parts: [],
      metadata: [],
    },
  ],
  additional_context: {},
  created_at: 1,
  read_at: null,
};

describe("NotificationPriorityAlert", () => {
  it("renders priority alert notification with drop", () => {
    render(
      <NotificationPriorityAlert
        notification={baseNotification}
        activeDrop={null}
        onReply={jest.fn()}
        onQuote={jest.fn()}
      />
    );
    expect(screen.getByText("alice")).toBeInTheDocument();
    expect(screen.getByText(/sent a priority alert/)).toBeInTheDocument();
    expect(screen.getByTestId("drop")).toBeInTheDocument();
  });

  it("renders notification header when related_drops is empty", () => {
    const notificationWithoutDrops = {
      ...baseNotification,
      related_drops: [],
    };
    render(
      <NotificationPriorityAlert
        notification={notificationWithoutDrops}
        activeDrop={null}
        onReply={jest.fn()}
        onQuote={jest.fn()}
      />
    );
    expect(screen.getByText("alice")).toBeInTheDocument();
    expect(screen.getByText(/sent a priority alert/)).toBeInTheDocument();
    expect(screen.queryByTestId("drop")).not.toBeInTheDocument();
  });

  it("uses router in reply and quote handlers", () => {
    mockRouter.push.mockClear();
    render(
      <NotificationPriorityAlert
        notification={baseNotification}
        activeDrop={null}
        onReply={jest.fn()}
        onQuote={jest.fn()}
      />
    );
    expect(DropMock).toHaveBeenCalled();
    const lastCall = DropMock.mock.calls.at(-1);
    const props = lastCall?.[0] as Record<string, unknown> | undefined;
    if (props?.["onReplyClick"]) {
      (props["onReplyClick"] as (n: number) => void)(5);
    }
    if (props?.["onQuoteClick"]) {
      (props["onQuoteClick"] as (q: unknown) => void)({
        wave: { id: "w" },
        serial_no: 6,
      });
    }
    expect(mockRouter.push).toHaveBeenCalledWith("/waves?wave=w&serialNo=5");
    expect(mockRouter.push).toHaveBeenCalledWith("/waves?wave=w&serialNo=6");
  });
});

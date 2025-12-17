import NotificationAllDrops from "@/components/brain/notifications/all-drops/NotificationAllDrops";
import { render, screen } from "@testing-library/react";
import React from "react";

const mockRouter = { push: jest.fn() };
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(() => mockRouter),
  useSearchParams: jest.fn(),
  usePathname: jest.fn(),
}));

jest.mock("@/hooks/useDeviceInfo", () => ({
  __esModule: true,
  default: jest.fn(() => ({ isApp: false })),
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
};

describe("NotificationAllDrops", () => {
  it("renders vote text", () => {
    const n = { ...baseNotification, additional_context: { vote: 2 } };
    render(
      <NotificationAllDrops
        notification={n}
        activeDrop={null}
        onReply={jest.fn()}
        onQuote={jest.fn()}
      />
    );
    expect(screen.getByText("+2")).toBeInTheDocument();
  });

  it("uses router in reply and quote handlers", () => {
    mockRouter.push.mockClear();
    render(
      <NotificationAllDrops
        notification={baseNotification}
        activeDrop={null}
        onReply={jest.fn()}
        onQuote={jest.fn()}
      />
    );
    const lastCall = DropMock.mock.calls.at(-1);
    const props = lastCall?.[0] as Record<string, unknown> | undefined;
    if (props?.onReplyClick) {
      (props.onReplyClick as (n: number) => void)(5);
    }
    if (props?.onQuoteClick) {
      (props.onQuoteClick as (q: unknown) => void)({
        wave: { id: "w" },
        serial_no: 6,
      });
    }
    expect(mockRouter.push).toHaveBeenCalledWith("/waves?wave=w&serialNo=5");
    expect(mockRouter.push).toHaveBeenCalledWith("/waves?wave=w&serialNo=6");
  });
});

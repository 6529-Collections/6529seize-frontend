import NotificationPriorityAlert from "@/components/brain/notifications/priority-alert/NotificationPriorityAlert";
import { render, screen } from "@testing-library/react";
import { useRouter } from "next/navigation";

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(() => ({ push: jest.fn() })),
  useSearchParams: jest.fn(),
  usePathname: jest.fn(),
}));

const DropMock = jest.fn(() => <div data-testid="drop" />);
jest.mock("@/components/waves/drops/Drop", () => ({
  __esModule: true,
  default: (props: any) => {
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
    render(
      <NotificationPriorityAlert
        notification={baseNotification}
        activeDrop={null}
        onReply={jest.fn()}
        onQuote={jest.fn()}
      />
    );
    expect(DropMock).toHaveBeenCalled();
    const props = DropMock.mock.calls[0][0];
    props.onReplyClick(5);
    props.onQuoteClick({ wave: { id: "w" }, serial_no: 6 } as any);
    const router = (useRouter as jest.Mock).mock.results[0].value;
    expect(router.push).toHaveBeenCalledWith("/waves?wave=w&serialNo=5/");
    expect(router.push).toHaveBeenCalledWith("/waves?wave=w&serialNo=6/");
  });
});

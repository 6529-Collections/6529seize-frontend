import LatestDropNextMintSection from "@/components/home/now-minting/LatestDropNextMintSection";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ href, children, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

jest.mock("next/image", () => ({
  __esModule: true,
  default: ({ alt = "", ...props }: any) => <img alt={alt} {...props} />,
}));

jest.mock("@/components/common/profile/ProfileAvatar", () => ({
  __esModule: true,
  ProfileBadgeSize: { SMALL: "SMALL" },
  default: () => <div data-testid="profile-avatar" />,
}));

jest.mock(
  "@/components/drops/view/item/content/media/DropListItemContentMedia",
  () => ({
    __esModule: true,
    default: () => <div data-testid="drop-media" />,
  })
);

jest.mock("@/components/meme-calendar/meme-calendar.helpers", () => ({
  __esModule: true,
  getNextMintStart: jest.fn(() => new Date("2026-02-18T17:40:00.000Z")),
  formatFullDateTime: jest.fn(() => "Feb 18 · 17:40"),
}));

jest.mock("@/hooks/useDeviceInfo", () => ({
  __esModule: true,
  default: jest.fn(() => ({ hasTouchScreen: false })),
}));

const useNextMintSubscriptionMock = jest.fn();
jest.mock("@/hooks/useNextMintSubscription", () => ({
  __esModule: true,
  useNextMintSubscription: (enabled?: boolean) =>
    useNextMintSubscriptionMock(enabled),
}));

describe("LatestDropNextMintSection", () => {
  const toggleSubscriptionMock = jest.fn();
  const drop = {
    id: "d1",
    title: "Next Meme Winner",
    metadata: [],
    created_at: 1739900400000,
    rating: 12345,
    parts: [
      {
        media: [
          { mime_type: "image/png", url: "https://example.com/test.png" },
        ],
      },
    ],
    author: {
      handle: "artist",
      primary_address: "0xabc",
      pfp: null,
    },
    wave: {
      id: "w1",
      name: "Memes Wave",
      picture: null,
    },
  } as any;

  beforeEach(() => {
    jest.clearAllMocks();
    useNextMintSubscriptionMock.mockReturnValue({
      nextSubscription: {
        token_id: 101,
        subscribed: true,
      },
      isSubscribed: true,
      isLoading: false,
      isMutating: false,
      canToggle: true,
      toggleSubscription: toggleSubscriptionMock,
    });
  });

  it("renders subscribed button state", () => {
    render(<LatestDropNextMintSection drop={drop} />);

    expect(
      screen.getByRole("button", { name: "Toggle next mint subscription" })
    ).toBeInTheDocument();
    expect(screen.getByText("Subscribed")).toBeInTheDocument();
    expect(useNextMintSubscriptionMock).toHaveBeenCalledWith(true);
  });

  it("calls toggleSubscription when button is clicked", async () => {
    const user = userEvent.setup();
    render(<LatestDropNextMintSection drop={drop} />);

    await user.click(
      screen.getByRole("button", { name: "Toggle next mint subscription" })
    );

    expect(toggleSubscriptionMock).toHaveBeenCalledTimes(1);
  });

  it("shows subscribe label when user is not subscribed", () => {
    useNextMintSubscriptionMock.mockReturnValue({
      nextSubscription: {
        token_id: 101,
        subscribed: false,
      },
      isSubscribed: false,
      isLoading: false,
      isMutating: false,
      canToggle: true,
      toggleSubscription: toggleSubscriptionMock,
    });

    render(<LatestDropNextMintSection drop={drop} />);

    expect(screen.getByText("Subscribe")).toBeInTheDocument();
  });

  it("shows updating label while mutation is in progress", () => {
    useNextMintSubscriptionMock.mockReturnValue({
      nextSubscription: {
        token_id: 101,
        subscribed: true,
      },
      isSubscribed: true,
      isLoading: false,
      isMutating: true,
      canToggle: true,
      toggleSubscription: toggleSubscriptionMock,
    });

    render(<LatestDropNextMintSection drop={drop} />);

    expect(screen.getByText("Updating...")).toBeInTheDocument();
  });

  it("disables button when toggling is not allowed", () => {
    useNextMintSubscriptionMock.mockReturnValue({
      nextSubscription: {
        token_id: 101,
        subscribed: false,
      },
      isSubscribed: false,
      isLoading: false,
      isMutating: false,
      canToggle: false,
      toggleSubscription: toggleSubscriptionMock,
    });

    render(<LatestDropNextMintSection drop={drop} />);

    expect(
      screen.getByRole("button", { name: "Toggle next mint subscription" })
    ).toBeDisabled();
  });

  it("disables button when no target subscription is available", () => {
    useNextMintSubscriptionMock.mockReturnValue({
      nextSubscription: null,
      isSubscribed: false,
      isLoading: false,
      isMutating: false,
      canToggle: true,
      toggleSubscription: toggleSubscriptionMock,
    });

    render(<LatestDropNextMintSection drop={drop} />);

    expect(
      screen.getByRole("button", { name: "Toggle next mint subscription" })
    ).toBeDisabled();
  });
});

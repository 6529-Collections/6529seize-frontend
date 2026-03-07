import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

jest.mock("@/components/common/profile/ProfileAvatar", () => ({
  __esModule: true,
  ProfileBadgeSize: { SMALL: "SMALL" },
  default: () => <div data-testid="profile-avatar" />,
}));

jest.mock("@/components/drops/media/MediaTypeBadge", () => ({
  __esModule: true,
  default: () => <div data-testid="media-type-badge" />,
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
}));

jest.mock("@/helpers/navigation.helpers", () => ({
  __esModule: true,
  getWaveRoute: jest.fn(() => "/waves?wave=w1&drop=d1"),
}));

jest.mock("@/hooks/useDeviceInfo", () => ({
  __esModule: true,
  default: jest.fn(() => ({ hasTouchScreen: false })),
}));

const useNextMintSubscriptionMock = jest.fn();
jest.mock("@/hooks/useNextMintSubscription", () => ({
  __esModule: true,
  useNextMintSubscription: () => useNextMintSubscriptionMock(),
}));

import { NextMintCard } from "@/components/home/next-mint-leading/NextMintCard";

describe("NextMintCard", () => {
  const toggleSubscriptionMock = jest.fn();

  const drop = {
    id: "d1",
    title: "Next Meme Winner",
    metadata: [],
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
    render(<NextMintCard drop={drop} />);

    const button = screen.getByRole("button", { name: "Subscribed" });
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText("Subscribed")).toBeInTheDocument();
    expect(useNextMintSubscriptionMock).toHaveBeenCalledWith();
  });

  it("calls toggleSubscription when action button is clicked", async () => {
    const user = userEvent.setup();
    render(<NextMintCard drop={drop} />);

    await user.click(screen.getByRole("button", { name: "Subscribed" }));

    expect(toggleSubscriptionMock).toHaveBeenCalledTimes(1);
  });

  it("disables action when toggling is not allowed", () => {
    useNextMintSubscriptionMock.mockReturnValue({
      nextSubscription: null,
      isSubscribed: false,
      isLoading: false,
      isMutating: false,
      canToggle: false,
      toggleSubscription: toggleSubscriptionMock,
    });

    render(<NextMintCard drop={drop} />);

    const button = screen.getByRole("button", { name: "Subscribe" });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByText("Subscribe")).toBeInTheDocument();
  });

  it("returns null when drop is null", () => {
    const { container } = render(<NextMintCard drop={null} />);

    expect(container.firstChild).toBeNull();
    expect(useNextMintSubscriptionMock).not.toHaveBeenCalled();
  });

  it("mounts subscription hook only when drop is present across renders", () => {
    const { rerender } = render(<NextMintCard drop={null} />);
    rerender(<NextMintCard drop={drop} />);

    expect(useNextMintSubscriptionMock).toHaveBeenCalledTimes(1);
    expect(useNextMintSubscriptionMock).toHaveBeenCalledWith();
  });
});

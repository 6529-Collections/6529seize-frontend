import { render, screen } from "@testing-library/react";

import FarcasterCard from "@/components/waves/FarcasterCard";
import { fetchFarcasterPreview } from "@/services/api/farcaster";

jest.mock("@/components/waves/ChatItemHrefButtons", () => ({
  __esModule: true,
  default: () => <div data-testid="href-buttons" />,
}));

jest.mock("@/services/api/farcaster", () => ({
  fetchFarcasterPreview: jest.fn(),
}));

const mockedFetchFarcasterPreview =
  fetchFarcasterPreview as jest.MockedFunction<typeof fetchFarcasterPreview>;

describe("FarcasterCard", () => {
  beforeEach(() => {
    mockedFetchFarcasterPreview.mockReset();
  });

  it("reserves a stable frame for single cast images", async () => {
    mockedFetchFarcasterPreview.mockResolvedValue({
      type: "cast",
      canonicalUrl: "https://warpcast.com/alice/0x123",
      cast: {
        author: {
          username: "alice",
          displayName: "Alice",
        },
        text: "A cast with an image",
        embeds: [
          {
            type: "image",
            url: "https://example.com/cast-image.jpg",
          },
        ],
      },
    });

    render(<FarcasterCard href="https://warpcast.com/alice/0x123" />);

    const image = await screen.findByRole("img", {
      name: "Image from Alice's cast",
    });

    expect(image.parentElement).toHaveClass("tw-aspect-video", "tw-min-h-40");
    expect(image).toHaveClass("tw-h-full", "tw-w-full", "tw-object-cover");
  });

  it("reserves a stable frame for Farcaster frame images", async () => {
    mockedFetchFarcasterPreview.mockResolvedValue({
      type: "frame",
      canonicalUrl: "https://warpcast.com/alice/0x123",
      frame: {
        frameUrl: "https://example.com/frame",
        title: "Frame title",
        imageUrl: "https://example.com/frame-image.jpg",
        buttons: ["Open"],
      },
    });

    render(<FarcasterCard href="https://warpcast.com/alice/0x123" />);

    const image = await screen.findByRole("img", { name: "Frame title" });

    expect(image.parentElement).toHaveClass("tw-aspect-video", "tw-min-h-40");
    expect(image).toHaveClass("tw-h-full", "tw-w-full", "tw-object-cover");
  });
});

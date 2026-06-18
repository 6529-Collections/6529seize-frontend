import { render, screen, waitFor } from "@testing-library/react";

import CmsThreeDViewer from "@/components/profile-cms/CmsThreeDViewer";
import type { CmsThreeDViewerConfig } from "@/components/profile-cms/CmsThreeDTypes";

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

const roomConfig: CmsThreeDViewerConfig = {
  description: "A small room.",
  fallbackHref: "/punk6529/rooms/work-1/index.html",
  kind: "room",
  placements: [
    {
      asset: {
        alt: "Square artwork",
        height: 1200,
        id: "asset-room-work",
        url: "data:image/png;base64,iVBORw0KGgo=",
        width: 1200,
      },
      detailHref: "/punk6529/nfts/ethereum/contract/1/index.html",
      displayMode: "faithful",
      id: "placement-work",
      label: "Square artwork",
      size: [1.2, 1.2],
    },
  ],
  poster: {
    alt: "Room poster",
    height: 900,
    id: "poster",
    url: "data:image/png;base64,iVBORw0KGgo=",
    width: 1600,
  },
  preset: "wall",
  requiresActivation: true,
  title: "Simple room",
};

describe("CmsThreeDViewer", () => {
  const originalMatchMedia = globalThis.matchMedia;

  afterEach(() => {
    globalThis.matchMedia = originalMatchMedia;
  });

  it("renders a deferred room canvas with canonical artwork links", () => {
    mockMatchMedia(false);

    render(<CmsThreeDViewer config={roomConfig} />);

    expect(screen.getByTestId("cms-3d-canvas")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Enter room" })).toBeVisible();
    expect(
      screen.getByRole("link", { name: "Square artwork" })
    ).toHaveAttribute("href", "/punk6529/nfts/ethereum/contract/1/index.html");
  });

  it("uses poster and 2D links on mobile", async () => {
    mockMatchMedia(true);

    render(<CmsThreeDViewer config={roomConfig} />);

    await waitFor(() =>
      expect(
        screen.getByText(
          "This mobile view uses the static poster and 2D links for a lighter, more reliable experience."
        )
      ).toBeInTheDocument()
    );
    expect(screen.queryByRole("button", { name: "Enter room" })).toBeNull();
    expect(
      screen.getByRole("link", { name: "Open 2D fallback" })
    ).toHaveAttribute("href", "/punk6529/rooms/work-1/index.html");
  });
});

function mockMatchMedia(isMobile: boolean): void {
  globalThis.matchMedia = jest.fn((query: string) => ({
    addEventListener: jest.fn(),
    matches: query === "(max-width: 767px)" ? isMobile : false,
    media: query,
    removeEventListener: jest.fn(),
  })) as typeof globalThis.matchMedia;
}
